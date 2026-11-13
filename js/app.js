const C = window.BBS_CONFIG, B = window.BBS, esc = B.esc, $ = s => document.querySelector(s), PG = document.body.dataset.page;
let db = null, S = { ...B.DEF }, PR = [], PO = [], SV = [];
const link = h => /^(#|https?:\/\/|[\w\-./?=%]+$)/.test(h || "") ? h : "#";
const okHref = h => esc(link(h));
const safeUrl = u => /^https?:\/\/[^\s'"()<>\\]+$/.test(u || "") ? esc(u) : "";
const para = t => esc(t).split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join("");
const money = v => v === null || v === undefined || v === "" ? "" : Number(v).toLocaleString("tr-TR") + " " + esc(S.currency);
const intS = (k, d, a, b) => { const v = parseInt(S[k], 10); return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const dateTR = v => v ? new Date(v).toLocaleDateString("tr-TR") : "";
const STK = { var: ["Stokta", "ok"], sinirli: ["Sınırlı stok", "mid"], yok: ["Tükendi", "no"] };

const IC = { sun: B.icon("sun"), moon: B.icon("moon"), menu: B.icon("menu"), phone: B.icon("phone"), lock: B.icon("lock") };

// Supabase bağlanana kadar görünen örnek veri
const DEMO = {
  menu: [["Hizmetler", "#hizmetler"], ["Ürünler", "urunler.html"], ["Haberler", "#haberler"], ["İletişim", "#iletisim"]].map(([label, href]) => ({ label, href })),
  slides: [{ title: "Aracınız doğru ellerde.", text: "Her işi önce size anlatır, sonra yaparız.", btn_text: "RANDEVU AL", btn_link: "#iletisim" }, { title: "Yedek parça, net bilgi.", text: "Stoktaki parçaların detayı ve fiyatı bir tık uzağınızda.", btn_text: "ÜRÜNLERİ GÖR", btn_link: "urunler.html" }],
  services: [["Yağ değişimi", "Motor yağı ve filtre değişimi, aracınıza uygun ürünlerle."], ["Motor tamiratı", "Arıza tespiti ve onarım; yapılan işi parça parça anlatırız."], ["Fren bakımı", "Balata, disk ve hidrolik kontrolü."], ["Lastik değişimi", "Mevsimlik değişim, rot ve balans ayarı."]].map(([title, description]) => ({ title, description })),
  products: [{ title: "Alaşım jant seti", category: "Jant", description: "16–19 inç alaşım jant seçenekleri.", price: 640, stock: "var", featured: true }, { title: "Ön tampon", category: "Kaporta", description: "Boyalı veya boyasız, birçok model.", stock: "sinirli" }, { title: "Fren balata seti", category: "Fren", description: "Ön ve arka takımlar.", price: 85, stock: "yok" }],
  posts: [{ title: "Lastiklerinizi daha uzun ömürlü kılmanın 4 yolu", category: "Bakım", excerpt: "Basınç, rotasyon ve doğru depolama ile lastik ömrünü uzatın.", body: "Basıncı ayda bir kontrol edin.\nLastikleri 10.000 km'de bir yer değiştirin.", created_at: new Date().toISOString() }],
  pages: [], socials: [], faq: [], brands: []
};
const get = async (t, q) => { if (!db) return DEMO[t]; const { data, error } = await q(db.from(t).select("*")); return error || !data ? DEMO[t] : data; };

function chrome(menu, soc) {
  const logo = safeUrl(S.logo_url) || "image/bbslogo.png", base = PG === "home" ? "" : "index.html";
  const tel = esc(S.phone).replace(/\s/g, "");
  // sosyal medya: tablo boşsa eski Facebook/Instagram ayarlarına bak
  const legacy = [["facebook", "Facebook"], ["instagram", "Instagram"]].filter(([k]) => B.socUrl(S[k])).map(([k, n]) => ({ name: n, url: S[k], icon: k }));
  const socs = (soc && soc.length ? soc : legacy).filter(x => x.visible !== false && B.socUrl(x.url));
  const sIcon = x => x.icon === "custom" && safeUrl(x.icon_url) ? `<img src="${safeUrl(x.icon_url)}" alt="">` : B.icon(x.icon);
  const sLinks = l => l.map(x => `<a href="${esc(B.socUrl(x.url))}" ${/^https?:/i.test(x.url) ? 'target="_blank" rel="noopener"' : ""} aria-label="${esc(x.name)}" title="${esc(x.name)}">${sIcon(x)}</a>`).join("");
  const inNav = socs.filter(x => x.in_nav !== false), inFoot = socs.filter(x => x.in_footer !== false);
  // "auto": 3 veya daha az ikon menüde (gece/gündüz düğmesinin yanında), fazlası üst şeritte; telefonda menü yerine üst şerit
  const place = S.social_place === "nav" || S.social_place === "top" ? S.social_place : inNav.length <= 3 ? "nav" : "top";
  const noTitle = S.logo_title === "0";
  $("#hdr").innerHTML = `${S.announcement ? `<div class="ann">${esc(S.announcement)}</div>` : ""}
  <div class="top"><div class="wrap">${S.phone ? `<a href="tel:${tel}">${esc(S.phone)}</a>` : ""}${S.email ? `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>` : ""}<span>${esc(S.hours)}</span>${inNav.length ? `<span class="soc-top ${place === "nav" ? "m-only" : ""}">${sLinks(inNav)}</span>` : ""}</div></div>
  <header class="nav" id="nav"><div class="wrap"><a class="brand" href="${base || "#"}"><img src="${logo}" alt="${noTitle ? esc(S.site_title) : ""}">${noTitle ? "" : `<span>${esc(S.site_title)}</span>`}</a>
  <nav id="mainnav" aria-label="Ana menü"><ul>${menu.filter(m => m.visible !== false).map(m => `<li><a href="${/^#/.test(m.href) ? base + okHref(m.href) : okHref(m.href)}">${esc(m.label)}</a></li>`).join("")}</ul></nav>
  ${place === "nav" && inNav.length ? `<span class="soc-nav">${sLinks(inNav)}</span>` : ""}<button class="icon-btn" id="themeBtn" type="button"></button><button class="icon-btn" id="menu" type="button" aria-label="Menü">${IC.menu}</button></div></header>`;
  const wd = String(S.whatsapp).replace(/\D/g, "");
  $("#ftr").innerHTML = `<footer><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(S.site_title)} ${esc(S.footer_text)}</span><span class="soc">${sLinks(inFoot)}</span><a class="adm" href="admin/" aria-label="Yönetim" title="Yönetim">${IC.lock}</a></div></footer>${wd ? `<a class="wa" href="https://wa.me/${wd}" target="_blank" rel="noopener" aria-label="WhatsApp ile yazın">${IC.phone}</a>` : ""}`;
  // gece / gündüz düğmesi
  const tb = $("#themeBtn"), root = document.documentElement;
  const paint = () => {
    const dark = root.dataset.theme === "dark";
    tb.innerHTML = dark ? IC.sun : IC.moon;
    tb.setAttribute("aria-label", dark ? "Gündüz moduna geç" : "Gece moduna geç");
    tb.title = tb.getAttribute("aria-label");
  };
  tb.onclick = () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { } paint(); };
  paint();
  $("#menu").onclick = () => $("#mainnav").classList.toggle("open");
  $("#mainnav").onclick = () => $("#mainnav").classList.remove("open");
  addEventListener("scroll", () => $("#nav").classList.toggle("sticky", scrollY > 60), { passive: true });
}

function openDlg(img, html) {
  const d = $("#dlg");
  d.innerHTML = `<div class="dl ${img ? "" : "noimg"}">${img ? `<div class="im" style="background-image:url('${img}')"></div>` : ""}<div class="tx">${html}<form method="dialog"><button class="btn ghost" style="margin-top:1.1rem">KAPAT</button></form></div></div>`;
  d.showModal();
}
document.addEventListener("click", e => {
  if (e.target.id === "dlg") return e.target.close();
  const c = e.target.closest("[data-pi],[data-po],[data-sv]"); if (!c) return;
  const wd = String(S.whatsapp).replace(/\D/g, ""), tel = esc(S.phone).replace(/\s/g, "");
  if (c.dataset.pi !== undefined) {
    const x = PR[c.dataset.pi], s = STK[x.stock] || STK.var;
    openDlg(safeUrl(x.image_url), `<small>${esc(x.category)}</small><h3>${esc(x.title)}</h3><span class="stk inl ${s[1]}">${s[0]}</span>${para(x.description)}<div class="big">${money(x.price) || "Fiyat için bizi arayın"}</div><div class="acts">${wd ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${wd}?text=${encodeURIComponent("Merhaba, " + x.title + " hakkında bilgi almak istiyorum.")}">WHATSAPP İLE SOR</a>` : ""}${S.phone ? `<a class="btn ghost" href="tel:${tel}">ARA</a>` : ""}</div>`);
  } else if (c.dataset.sv !== undefined) {
    const x = SV[c.dataset.sv];
    openDlg("", `<h3>${esc(x.title)}</h3>${para(x.description)}<div class="acts" style="margin-top:.8rem">${wd ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${wd}?text=${encodeURIComponent("Merhaba, " + x.title + " hizmeti hakkında bilgi almak istiyorum.")}">WHATSAPP İLE SOR</a>` : ""}${S.phone ? `<a class="btn ghost" href="tel:${tel}">ARA</a>` : ""}</div>`);
  } else {
    const x = PO[c.dataset.po], meta = [x.author, dateTR(x.created_at)].filter(Boolean).map(esc).join(" · ");
    openDlg(safeUrl(x.image_url), `<small>${esc(x.category)}</small><h3>${esc(x.title)}</h3>${meta ? `<div class="meta">${meta}</div>` : ""}${para(x.body || x.excerpt)}`);
  }
});
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.(".pc,.svc li")) e.target.click(); });

const pcard = (x, i) => {
  const s = STK[x.stock] || STK.var, im = safeUrl(x.image_url);
  return `<article class="pc" tabindex="0" data-pi="${i}"><div class="in"><div class="ph"><i style="${im ? `background-image:url('${im}')` : ""}"></i>${x.featured ? '<span class="chip">ÖNE ÇIKAN</span>' : ""}<span class="stk ${s[1]}">${s[0]}</span></div><div class="b"><small>${esc(x.category)}</small><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="pr"><b>${money(x.price) || "Fiyat sorunuz"}</b><span>Detay</span></div></div></div></article>`;
};
const postCard = (x, i) => {
  const im = safeUrl(x.image_url);
  return `<article class="pc" tabindex="0" data-po="${i}"><div class="in"><div class="ph"><i style="${im ? `background-image:url('${im}')` : ""}"></i></div><div class="b"><small>${esc(x.category)} · ${dateTR(x.created_at)}</small><h3>${esc(x.title)}</h3><p>${esc(x.excerpt)}</p><div class="pr"><span>${esc(x.author)}</span><span>Oku</span></div></div></div></article>`;
};
const svcItem = (x, i) => `<li tabindex="0" role="button" data-sv="${i}"><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></li>`;
const fillSections = () => document.querySelectorAll("[data-set]").forEach(el => { el.textContent = S[el.dataset.set] ?? ""; });

function slider(list) {
  const el = $("#slider"); if (!list.length) { el.remove(); return; }
  const logo = safeUrl(S.logo_url) || "image/bbslogo.png";
  el.innerHTML = `<div class="track">${list.map((x, i) => `<div class="sl" ${i ? 'aria-hidden="true"' : ""} style="${safeUrl(x.image_url) ? `background-image:url('${safeUrl(x.image_url)}')` : ""}"><div class="wrap"><div><h1>${esc(x.title)}</h1><p>${esc(x.text)}</p>${x.btn_text ? `<a class="btn" href="${okHref(x.btn_link)}">${esc(x.btn_text)}</a>` : ""}</div>${safeUrl(x.image_url) ? "" : `<img src="${logo}" alt="">`}</div></div>`).join("")}</div>
  ${list.length > 1 ? `<button class="sp" aria-label="Önceki">‹</button><button class="sn" aria-label="Sonraki">›</button><div class="dots">${list.map((_, i) => `<button aria-label="Slayt ${i + 1}"></button>`).join("")}</div>` : ""}`;
  if (list.length < 2) return;
  const tr = el.querySelector(".track"), dots = [...el.querySelectorAll(".dots button")], sl = [...el.querySelectorAll(".sl")];
  let i = 0, t, x0;
  const go = n => { i = (n + list.length) % list.length; tr.style.transform = `translateX(-${i * 100}%)`; dots.forEach((d, k) => d.classList.toggle("on", k === i)); sl.forEach((s, k) => s.setAttribute("aria-hidden", k !== i)); };
  const auto = () => { clearInterval(t); if (!matchMedia("(prefers-reduced-motion:reduce)").matches) t = setInterval(() => go(i + 1), 6000); };
  el.querySelector(".sp").onclick = () => { go(i - 1); auto(); }; el.querySelector(".sn").onclick = () => { go(i + 1); auto(); };
  dots.forEach((d, k) => d.onclick = () => { go(k); auto(); });
  el.onmouseenter = () => clearInterval(t); el.onmouseleave = auto;
  el.ontouchstart = e => x0 = e.touches[0].clientX;
  el.ontouchend = e => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { go(i + (dx < 0 ? 1 : -1)); auto(); } };
  go(0); auto();
}

function counters() {
  const still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target, end = +el.dataset.n, suf = el.dataset.s, t0 = performance.now();
    if (still) return;
    const step = t => { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .4 });
  document.querySelectorAll("[data-n]").forEach(el => io.observe(el));
}

async function home() {
  const nS = intS("svc_limit", 6, 1, 50), nP = intS("prod_limit", 4, 1, 24), nN = intS("news_limit", 4, 1, 24);
  const [sl, sv, pr, po, fq, br] = await Promise.all([
    get("slides", q => q.eq("active", true).order("sort")),
    get("services", q => q.order("sort")),
    get("products", q => q.eq("published", true).order("created_at", { ascending: false })),
    get("posts", q => q.eq("published", true).order("created_at", { ascending: false }).limit(nN + 1)),
    get("faq", q => q.eq("visible", true).order("sort")),
    get("brands", q => q.eq("visible", true).order("sort"))
  ]);
  SV = sv; PR = pr; PO = po.slice(0, nN); slider(sl); fillSections();
  $("#hl-t").textContent = S.hl_title; $("#hl-p").textContent = S.hl_text;
  const hb = $("#hl-b"); hb.textContent = S.hl_btn_text; hb.href = link(S.hl_btn_link); hb.hidden = !S.hl_btn_text;
  $("#stats").innerHTML = [1, 2, 3].filter(i => S["stat" + i + "_num"]).map(i => {
    const v = String(S["stat" + i + "_num"]), m = v.match(/^(\d+)(.*)$/);
    return `<li>${m ? `<b data-n="${esc(m[1])}" data-s="${esc(m[2])}">${esc(v)}</b>` : `<b>${esc(v)}</b>`}<span>${esc(S["stat" + i + "_label"])}</span></li>`;
  }).join("");
  counters();
  $("#services").innerHTML = sv.slice(0, nS).map((x, i) => svcItem(x, i)).join("");
  $("#svc-more").hidden = sv.length <= nS;
  // ürünler: önce öne çıkanlar, eksik kalırsa en yeniler
  $("#products").innerHTML = [...pr].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, nP).map(x => pcard(x, pr.indexOf(x))).join("");
  $("#prod-more").hidden = pr.length <= nP;
  $("#posts").innerHTML = PO.map((x, i) => postCard(x, i)).join("");
  $("#news-more").hidden = po.length <= nN;
  // markalar ve sık sorulan sorular (boşsa veya panelden kapatıldıysa bölüm gizlenir)
  const on = k => S["show_" + k] !== "0";
  $("#neler").hidden = !on("hl"); $("#hizmetler").hidden = !on("svc"); $("#urunler").hidden = !on("prod"); $("#haberler").hidden = !on("news");
  $("#markalar").hidden = !on("brands") || !br.length;
  $("#brands").dataset.bg = S.brands_bg || "white";
  $("#brands").innerHTML = br.map(x => {
    const im = safeUrl(x.logo_url), inner = im ? `<img src="${im}" alt="${esc(x.name)}" loading="lazy">` : `<b>${esc(x.name)}</b>`, u = B.socUrl(x.url);
    return `<li>${/^https?:/i.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener" title="${esc(x.name)}">${inner}</a>` : `<div title="${esc(x.name)}">${inner}</div>`}</li>`;
  }).join("");
  $("#sss").hidden = !on("faq") || !fq.length;
  $("#faq").innerHTML = fq.map(x => `<details class="fq"><summary>${esc(x.question)}</summary><div class="fa">${para(x.answer)}</div></details>`).join("");
  if (fq.length && on("faq")) {
    const ld = document.createElement("script"); ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: fq.map(x => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer || "" } })) });
    document.head.appendChild(ld);
  }
  // iletişim + harita
  const lat = parseFloat(S.map_lat), lng = parseFloat(S.map_lng), ok = S.map_lat !== "" && isFinite(lat) && isFinite(lng);
  $("#info").innerHTML = [["Telefon", S.phone], ["E-posta", S.email], ["Çalışma saatleri", S.hours], ["Adres", S.address]].filter(r => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  const dir = ok ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : S.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.address)}` : "";
  $("#map").innerHTML = (ok ? `<iframe title="Harita" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - .006}%2C${lat - .004}%2C${lng + .006}%2C${lat + .004}&amp;layer=mapnik&amp;marker=${lat}%2C${lng}"></iframe>` : "") + (dir ? `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(dir)}">YOL TARİFİ AL</a>` : "");
  $("#form").addEventListener("submit", async e => {
    e.preventDefault();
    const m = $("#msg"), f = Object.fromEntries(new FormData(e.target));
    if (!db) { m.textContent = "Supabase henüz bağlı değil (js/config.js)."; return; }
    const { error } = await db.from("messages").insert(f);
    m.textContent = error ? "Gönderilemedi, lütfen telefonla ulaşın." : "Teşekkürler, en kısa sürede dönüş yapacağız.";
    if (!error) e.target.reset();
  });
}

async function hizmetler() {
  SV = await get("services", q => q.order("sort"));
  const draw = () => {
    const q = $("#q").value.toLowerCase();
    const l = SV.filter(x => (x.title + " " + (x.description || "")).toLowerCase().includes(q));
    $("#count").textContent = l.length + " hizmet";
    $("#services").innerHTML = l.map(x => svcItem(x, SV.indexOf(x))).join("") || "<li style='grid-column:1/-1;cursor:default'><p>Sonuç bulunamadı.</p></li>";
  };
  $("#q").addEventListener("input", draw); draw();
}

async function urunler() {
  PR = await get("products", q => q.eq("published", true).order("created_at", { ascending: false }));
  [...new Set(PR.map(x => x.category).filter(Boolean))].sort().forEach(c => $("#cat").insertAdjacentHTML("beforeend", `<option>${esc(c)}</option>`));
  const draw = () => {
    const q = $("#q").value.toLowerCase(), c = $("#cat").value, st = $("#stk").value, so = $("#srt").value;
    let l = PR.filter(x => (!c || x.category === c) && (!st || (x.stock || "var") === st) && (x.title + " " + (x.description || "") + " " + (x.category || "")).toLowerCase().includes(q));
    const pv = x => x.price == null ? Infinity : Number(x.price);
    if (so === "az") l.sort((a, b) => a.title.localeCompare(b.title, "tr")); if (so === "ar") l.sort((a, b) => pv(a) - pv(b)); if (so === "az2") l.sort((a, b) => (b.price == null ? -1 : pv(b)) - (a.price == null ? -1 : pv(a)));
    $("#count").textContent = l.length + " ürün";
    $("#products").innerHTML = l.map(x => pcard(x, PR.indexOf(x))).join("") || "<p>Sonuç bulunamadı.</p>";
  };
  ["#q", "#cat", "#stk", "#srt"].forEach(s => $(s).addEventListener("input", draw)); draw();
}

async function haberler() {
  PO = await get("posts", q => q.eq("published", true).order("created_at", { ascending: false }));
  [...new Set(PO.map(x => x.category).filter(Boolean))].sort().forEach(c => $("#cat").insertAdjacentHTML("beforeend", `<option>${esc(c)}</option>`));
  const PAGE = 12; let shown = PAGE;
  const draw = () => {
    const q = $("#q").value.toLowerCase(), c = $("#cat").value;
    const l = PO.filter(x => (!c || x.category === c) && ((x.title || "") + " " + (x.excerpt || "") + " " + (x.category || "")).toLowerCase().includes(q));
    $("#count").textContent = l.length + " yazı";
    $("#posts").innerHTML = l.slice(0, shown).map(x => postCard(x, PO.indexOf(x))).join("") || "<p>Sonuç bulunamadı.</p>";
    $("#loadmore").hidden = l.length <= shown;
  };
  ["#q", "#cat"].forEach(s => $(s).addEventListener("input", () => { shown = PAGE; draw(); }));
  $("#loadmore").onclick = () => { shown += PAGE; draw(); };
  draw();
}

async function sayfa() {
  const slug = new URLSearchParams(location.search).get("s") || "";
  const l = await get("pages", q => q.eq("slug", slug).eq("published", true));
  const p = l[0];
  $("#content").innerHTML = p ? `<div class="head"><h2>${esc(p.title)}</h2></div>${para(p.body)}` : `<div class="head"><h2>Sayfa bulunamadı</h2></div><p><a href="index.html">Anasayfaya dön</a></p>`;
  if (p) document.title = p.title + " | " + S.site_title;
}

(async () => {
  let th = null; try { th = localStorage.getItem("theme"); } catch (e) { }
  document.documentElement.dataset.theme = th || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
  if (C.SUPABASE_URL) { try { await B.loadLib(); db = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY); } catch (e) { } }
  if (db) { const { data } = await db.from("settings").select("*"); (data || []).forEach(r => { if (r.value) S[r.key] = r.value; }); }
  B.applyTheme(S);
  if (PG === "home") document.title = S.site_title + " | " + S.tagline;
  const [menu, soc] = await Promise.all([get("menu", q => q.order("sort")), get("socials", q => q.eq("visible", true).order("sort"))]);
  chrome(menu, soc);
  ({ home, urunler, sayfa, haberler, hizmetler })[PG]();
})();
