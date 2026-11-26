// Statik sayfa üretici: paylaşım önizleme sayfaları (p/, y/) + sitemap.xml + robots.txt
// Çalıştırma:  node scripts/build-static.mjs      (Node 18+)
// Alan adı:    SITE_URL ortam değişkeni  →  CNAME dosyası  →  GitHub Pages adresi  (sırasıyla)
// Test:        SUPABASE_URL ve SUPABASE_ANON_KEY ortam değişkenleriyle js/config.js geçersiz kılınabilir.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), "utf8") : "");

// ---- yapılandırma
const cfg = read("js/config.js");
const SB = (process.env.SUPABASE_URL || (cfg.match(/SUPABASE_URL:\s*"([^"]+)"/) || [])[1] || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_ANON_KEY || (cfg.match(/SUPABASE_ANON_KEY:\s*"([^"]+)"/) || [])[1] || "";
if (!SB || !KEY) { console.error("Supabase bilgisi bulunamadı (js/config.js)."); process.exit(1); }

let site = (process.env.SITE_URL || "").trim();
if (!site && read("CNAME").trim()) site = "https://" + read("CNAME").trim();
if (!site && process.env.GITHUB_REPOSITORY) {
  const [o, r] = process.env.GITHUB_REPOSITORY.split("/");
  site = r.toLowerCase() === `${o.toLowerCase()}.github.io` ? `https://${o}.github.io` : `https://${o}.github.io/${r}`;
}
if (!site) { console.error("Alan adı belli değil: SITE_URL ayarlayın ya da CNAME dosyası ekleyin."); process.exit(1); }
site = site.replace(/\/$/, "");
if (!/^https?:\/\//.test(site)) site = "https://" + site;

// ---- Supabase REST (anon anahtarı; RLS yalnızca yayındaki kayıtları verir)
async function all(table, query = "") {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/${table}?select=*${query}&limit=1000&offset=${from}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
    const d = await r.json();
    out.push(...d);
    if (d.length < 1000) return out;
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = (h) => String(h ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const img1 = (v) => String(v || "").split(/\n+/).map((x) => x.trim()).find((u) => /^https:\/\/[^\s'"()<>\\]+$/.test(u)) || "";

const settings = Object.fromEntries((await all("settings").catch(() => [])).map((r) => [r.key, r.value]));
const title = settings.site_title || "BBS AUTO";
const cur = settings.currency || "€";
const lang = settings.lang_main || "tr";
const logo = img1(settings.logo_url) || `${site}/image/bbslogo.png`;
const enabled = settings.share_pages !== "0";

const products = await all("products", "&published=eq.true&order=id.asc").catch(() => []);
const posts = await all("posts", "&published=eq.true&order=id.asc").catch(() => []);
const pages = await all("pages", "&published=eq.true&order=id.asc").catch(() => []);

const STK = { var: "Stokta", sinirli: "Sınırlı stok", yok: "Tükendi" };
const page = ({ t, d, image, url, target, linkText }) => `<!DOCTYPE html>
<html lang="${esc(lang)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t)}</title>
<meta name="robots" content="noindex,follow">
<meta name="description" content="${esc(d)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(title)}">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t)}">
<meta name="twitter:description" content="${esc(d)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")})</script>
</head><body><p><a href="${esc(target)}">${esc(linkText)}</a></p></body></html>
`;

for (const d of ["p", "y"]) { rmSync(join(root, d), { recursive: true, force: true }); mkdirSync(join(root, d), { recursive: true }); }
writeFileSync(join(root, "p/index.html"), `<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../urunler.html">`);
writeFileSync(join(root, "y/index.html"), `<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../haberler.html">`);

let np = 0, ny = 0;
if (enabled) {
  for (const x of products) {
    const price = x.price == null || x.price === "" ? "" : `${Number(x.price).toLocaleString(lang)} ${cur}`;
    const d = cut([price, STK[x.stock] || "", strip(x.description)].filter(Boolean).join(" · ") || title, 200);
    writeFileSync(join(root, `p/${x.id}.html`), page({
      t: `${x.title} | ${title}`, d, image: img1(x.image_url) || logo,
      url: `${site}/p/${x.id}.html`, target: `../urunler.html#urun-${x.id}`, linkText: x.title,
    }));
    np++;
  }
  for (const x of posts) {
    writeFileSync(join(root, `y/${x.id}.html`), page({
      t: `${x.title} | ${title}`, d: cut(strip(x.excerpt) || strip(x.body) || title, 200), image: img1(x.image_url) || logo,
      url: `${site}/y/${x.id}.html`, target: `../haber.html?id=${x.id}`, linkText: x.title,
    }));
    ny++;
  }
}

// ---- sitemap.xml
const urls = [
  [`${site}/`, null, "1.0"], [`${site}/urunler.html`, null, "0.9"], [`${site}/hizmetler.html`, null, "0.8"], [`${site}/haberler.html`, null, "0.7"],
  ...posts.map((x) => [`${site}/haber.html?id=${x.id}`, x.created_at, "0.6"]),
  ...pages.map((x) => [`${site}/sayfa.html?s=${encodeURIComponent(x.slug)}`, x.created_at, "0.4"]),
];
const day = (v) => (v ? String(v).slice(0, 10) : "");
writeFileSync(join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, m, p]) => `  <url><loc>${esc(u)}</loc>${day(m) ? `<lastmod>${day(m)}</lastmod>` : ""}<priority>${p}</priority></url>`).join("\n") + `\n</urlset>\n`);

// ---- robots.txt: Sitemap satırını güncelle
let robots = read("robots.txt").split(/\r?\n/).filter((l) => !/^sitemap:/i.test(l)).join("\n").trimEnd();
writeFileSync(join(root, "robots.txt"), (robots || "User-agent: *\nAllow: /") + `\n\nSitemap: ${site}/sitemap.xml\n`);

console.log(`Tamam: ${np} ürün + ${ny} haber paylaşım sayfası, ${urls.length} adreslik sitemap.xml (${site})`);
