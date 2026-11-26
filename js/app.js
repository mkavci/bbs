const C = window.BBS_CONFIG, B = window.BBS, esc = B.esc, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], PG = document.body.dataset.page;
let db = null, S = { ...B.DEF }, PR = [], PO = [], SV = [], LEGAL = {};
const _t = (...a) => B.t(...a);
// iç bağlantı: #, http(s) ya da site içi dosya yolu ("//" ile başlayan dış yönlendirmeler reddedilir)
const link = h => /^(#|https?:\/\/|(?!\/\/)[\w\-./?=%&#]+$)/.test(h || "") ? h : "#";
const okHref = h => esc(link(h));
const safeUrl = u => /^https?:\/\/[^\s'"()<>\\]+$/.test(u || "") ? esc(u) : "";
const para = t => esc(t).split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join("");
const money = v => v === null || v === undefined || v === "" ? "" : Number(v).toLocaleString(B.loc()) + " " + esc(S.currency);
const intS = (k, d, a, b) => { const v = parseInt(S[k], 10); return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const dateTR = v => v ? new Date(v).toLocaleDateString(B.loc()) : "";
const fillTok = h => h.replace(/\{\{(\w+)\}\}/g, (_, k) => esc(S[k] || (k === "legal_email" ? S.email : "") || "[…]"));
const digits = v => String(v || "").replace(/\D/g, "");
const idOf = (x, i) => x.id ?? i;
// bir kayıttaki görseller: image_url alanında her satırda bir adres (ilki ana görsel)
const imgsOf = x => String(x.image_url || "").split(/\n+/).map(u => safeUrl(u.trim())).filter(Boolean);
const rawUrl = u => /^https?:\/\/[^\s'"()<>\\]+$/.test(u || "") ? u : "";
const preload = u => new Promise(r => { if (!u) return r(); const i = new Image(); i.onload = i.onerror = r; i.src = u; setTimeout(r, 3500); });
const rich = t => B.rich(t);
const STK = { var: ["Stokta", "ok"], sinirli: ["Sınırlı stok", "mid"], yok: ["Tükendi", "no"] };
const IC = Object.fromEntries(["sun", "moon", "menu", "phone", "lock", "arrow", "close", "share", "up", "route", "whatsapp", "car", "user"].map(n => [n, B.icon(n)]));

// hizmet başlığından uygun ikonu seçer
const SVC_ICONS = [[/yağ|filtre/, "drop"], [/fren|balata|disk/, "disc"], [/lastik|rot|balans|jant|supap/, "tire"], [/akü|elektrik|far|ampul|şarj|marş/, "battery"], [/klima|soğutma|radyatör|antifriz/, "snow"], [/egzoz|katalitik|dpf/, "wind"], [/motor|turbo|enjektör|triger|şanzıman|debriyaj/, "engine"], [/arıza|teşhis|diagnostik|kontrol|muayene/, "search"], [/sigorta|garanti|kasko/, "shield"], [/kaporta|boya|cam|tampon/, "car"]];
const svcIcon = t => { const k = String(t || "").toLocaleLowerCase("tr"); return B.icon((SVC_ICONS.find(([r]) => r.test(k)) || [0, "wrench"])[1]); };

// Supabase bağlanana kadar görünen örnek veri
const DEMO = {
  menu: [["Hizmetler", "#hizmetler"], ["Ürünler", "urunler.html"], ["Haberler", "#haberler"], ["İletişim", "#iletisim"]].map(([label, href]) => ({ label, href })),
  slides: [{ title: "Aracınız doğru ellerde.", text: "Her işi önce size anlatır, sonra yaparız.", btn_text: "Randevu al", btn_link: "#iletisim" }, { title: "Yedek parça, net bilgi.", text: "Stoktaki parçaların detayı ve fiyatı bir tık uzağınızda.", btn_text: "Ürünleri gör", btn_link: "urunler.html" }],
  services: [["Yağ değişimi", "Motor yağı ve filtre değişimi, aracınıza uygun ürünlerle."], ["Motor tamiratı", "Arıza tespiti ve onarım; yapılan işi parça parça anlatırız."], ["Fren bakımı", "Balata, disk ve hidrolik kontrolü."], ["Lastik değişimi", "Mevsimlik değişim, rot ve balans ayarı."]].map(([title, description]) => ({ title, description })),
  products: [{ title: "Alaşım jant seti", category: "Jant", description: "16–19 inç alaşım jant seçenekleri.", price: 640, stock: "var", featured: true }, { title: "Ön tampon", category: "Kaporta", description: "Boyalı veya boyasız, birçok model.", stock: "sinirli" }, { title: "Fren balata seti", category: "Fren", description: "Ön ve arka takımlar.", price: 85, stock: "yok" }],
  posts: [{ title: "Lastiklerinizi daha uzun ömürlü kılmanın 4 yolu", category: "Bakım", excerpt: "Basınç, rotasyon ve doğru depolama ile lastik ömrünü uzatın.", body: "Basıncı ayda bir kontrol edin.\nLastikleri 10.000 km'de bir yer değiştirin.", created_at: new Date().toISOString() }],
  pages: [], socials: [], faq: [], brands: [], reviews: []
};
// Veritabanı bağlıyken hata olursa sahte örnek veri GÖSTERİLMEZ (yalnızca menü yedeği kullanılır)
const get = async (t, q) => {
  if (!db) return DEMO[t] || [];
  let r; try { r = await q(db.from(t).select("*")); } catch (e) { r = { error: e }; }
  if (r.error || !r.data) { if (r.error) console.warn("[" + t + "]", r.error.message || r.error); return t === "menu" ? DEMO.menu : []; }
  return B.trRows(t, t === "menu" && !r.data.length ? DEMO.menu : r.data);
};

const toast = m => { const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2400); };
const mapPt = () => { const lat = parseFloat(S.map_lat), lng = parseFloat(S.map_lng); return { ok: S.map_lat !== "" && isFinite(lat) && isFinite(lng), lat, lng }; };
const dirUrl = () => { const p = mapPt(); return p.ok ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : S.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.address)}` : ""; };
const waUrl = txt => `https://wa.me/${digits(S.whatsapp)}${txt ? "?text=" + encodeURIComponent(txt) : ""}`;

// ---- SEO: açıklama, Open Graph, canonical, JSON-LD ----
const setMeta = (key, val, prop) => {
  const sel = `meta[${prop ? "property" : "name"}="${key}"]`; let el = document.head.querySelector(sel);
  if (!el) { el = document.createElement("meta"); el.setAttribute(prop ? "property" : "name", key); document.head.appendChild(el); }
  el.setAttribute("content", val);
};
const absUrl = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
const seo = (title, desc) => {
  if (title) document.title = title;
  setMeta("og:title", document.title, true); setMeta("twitter:card", "summary");
  if (desc) { setMeta("description", desc); setMeta("og:description", desc, true); }
  setMeta("og:image", absUrl(safeUrl(S.logo_url) || "image/bbslogo.png"), true);
  if (/^https?:/.test(location.protocol)) {
    let c = document.head.querySelector('link[rel=canonical]'); if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
    c.href = location.origin + location.pathname + (PG === "sayfa" ? location.search : "");
  }
};
const jsonLd = o => { const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(o).replace(/</g, "\\u003c"); document.head.appendChild(s); };

function chrome(menu, soc) {
  const logo = safeUrl(S.logo_url) || "image/bbslogo.png", base = PG === "home" ? "" : "index.html";
  const tel = esc(S.phone).replace(/\s/g, "");
  // sosyal medya: tablo boşsa eski Facebook/Instagram ayarlarına bak
  const legacy = [["facebook", "Facebook"], ["instagram", "Instagram"]].filter(([k]) => B.socUrl(S[k])).map(([k, n]) => ({ name: n, url: S[k], icon: k }));
  const socs = (soc && soc.length ? soc : legacy).filter(x => x.visible !== false && B.socUrl(x.url));
  const sIcon = x => x.icon === "custom" && safeUrl(x.icon_url) ? `<img src="${safeUrl(x.icon_url)}" alt="">` : B.icon(x.icon);
  const sLinks = l => l.map(x => `<a href="${esc(B.socUrl(x.url))}" ${/^https?:/i.test(x.url) ? 'target="_blank" rel="noopener"' : ""} aria-label="${esc(x.name)}" title="${esc(x.name)}">${sIcon(x)}</a>`).join("");
  const inFoot = socs.filter(x => x.in_footer !== false);
  const noTitle = S.logo_title === "0";
  const brand = `<a class="brand" href="${base || "#"}"><img src="${logo}" alt="${noTitle ? esc(S.site_title) : ""}" width="120" height="36">${noTitle ? "" : `<span>${esc(S.site_title)}</span>`}</a>`;
  const items = menu.filter(m => m.visible !== false), href = m => /^#/.test(m.href) ? base + okHref(m.href) : okHref(m.href);
  $("#hdr").innerHTML = `${S.announcement ? `<div class="ann">${esc(S.announcement)}</div>` : ""}
  <div class="top"><div class="wrap">${S.phone ? `<a href="tel:${tel}">${esc(S.phone)}</a>` : ""}${S.email ? `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>` : ""}<span>${esc(S.hours)}</span></div></div>
  <header class="nav" id="nav"><div class="wrap">${brand}
  <nav id="mainnav" aria-label="Ana menü"><ul>${items.map(m => `<li><a href="${href(m)}">${esc(m.label)}</a></li>`).join("")}</ul></nav>
  ${B.langs.length > 1 && S.lang_switcher !== "0" ? `<select class="lsel" id="langSel" aria-label="Dil">${B.langs.map(c => `<option value="${c}" ${c === B.lang ? "selected" : ""}>${esc(B.LANGS[c] || c)}</option>`).join("")}</select>` : ""}<button class="icon-btn" id="themeBtn" type="button"></button><button class="icon-btn" id="menu" type="button" aria-label="Menü" aria-expanded="false" aria-controls="mainnav">${IC.menu}</button></div></header>`;

  const contact = [S.phone && `<li><a href="tel:${tel}">${esc(S.phone)}</a></li>`, S.email && `<li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>`, S.hours && `<li>${esc(S.hours)}</li>`, S.address && `<li>${dirUrl() ? `<a target="_blank" rel="noopener" href="${esc(dirUrl())}">${esc(S.address)}</a>` : esc(S.address)}</li>`].filter(Boolean).join("");
  const wd = digits(S.whatsapp), dir = dirUrl();
  const bar = S.show_mbar !== "0" && (S.phone || wd) ? `<div class="mbar">${S.phone ? `<a class="p" href="tel:${tel}">${IC.phone}Ara</a>` : ""}${wd ? `<a class="w" href="${waUrl()}" target="_blank" rel="noopener">${B.icon("whatsapp")}WhatsApp</a>` : ""}${dir ? `<a href="${esc(dir)}" target="_blank" rel="noopener">${IC.route}Yol tarifi</a>` : ""}</div>` : "";
  $("#ftr").innerHTML = `<footer><div class="wrap fg"><div class="fb">${brand}<p>${esc(S.tagline)}</p><span class="soc">${sLinks(inFoot)}</span></div>
  <div><h4>Sayfalar</h4><ul>${items.map(m => `<li><a href="${href(m)}">${esc(m.label)}</a></li>`).join("")}</ul></div>
  ${contact ? `<div><h4>İletişim</h4><ul>${contact}</ul></div>` : "<div></div>"}</div>
  <div class="wrap fbot"><span>© ${new Date().getFullYear()} ${esc(S.site_title)} ${esc(S.footer_text)}</span><span class="lg">${["kvkk", "gizlilik", "cerez"].filter(k => LEGAL[k]).map(k => `<a href="sayfa.html?s=${k}">${esc(LEGAL[k].title)}</a>`).join("")}</span><a class="adm" href="admin/" aria-label="Yönetici girişi" title="Yönetici girişi">${IC.user}</a></div></footer>
  ${bar}${wd ? `<a class="wa" href="${waUrl()}" target="_blank" rel="noopener" aria-label="WhatsApp ile yazın">${B.icon("whatsapp")}</a>` : ""}
  <button class="totop" id="totop" type="button" aria-label="Sayfanın başına dön">${IC.up}</button>`;
  document.body.classList.toggle("has-mbar", !!bar);

  // gece / gündüz düğmesi
  const ls = $("#langSel"); if (ls) ls.onchange = () => { try { localStorage.setItem("bbs_lang", ls.value); } catch (e) { } const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.href; };
  const tb = $("#themeBtn"), root = document.documentElement;
  const paint = () => {
    const dark = root.dataset.theme === "dark";
    tb.innerHTML = dark ? IC.sun : IC.moon;
    tb.setAttribute("aria-label", _t(dark ? "Gündüz moduna geç" : "Gece moduna geç")); tb.title = tb.getAttribute("aria-label");
    setMeta("theme-color", B.resolve(S, dark).nav_bg);
  };
  tb.onclick = () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { } paint(); };
  paint();
  const mn = $("#menu"), nav = $("#mainnav");
  mn.onclick = () => mn.setAttribute("aria-expanded", nav.classList.toggle("open"));
  nav.onclick = () => { nav.classList.remove("open"); mn.setAttribute("aria-expanded", "false"); };
  // bulunulan sayfayı menüde işaretle
  const here = location.pathname.split("/").pop() || "index.html";
  $$("#mainnav a").forEach(a => { const h = a.getAttribute("href") || ""; if (!h.includes("#") && h.split("?")[0] === here) { a.classList.add("on"); a.setAttribute("aria-current", "page"); } });
  const tt = $("#totop"); tt.onclick = () => scrollTo({ top: 0, behavior: "smooth" });
  addEventListener("scroll", () => { $("#nav").classList.toggle("sticky", scrollY > 60); tt.classList.toggle("show", scrollY > 700); }, { passive: true });
}

// anasayfada kaydırdıkça menüde bulunulan bölümü işaretler
function spy() {
  const links = $$('#mainnav a').filter(a => /^#[\w-]+$/.test(a.getAttribute("href") || "")); if (!links.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => { const on = a.getAttribute("href") === "#" + e.target.id; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"); });
  }), { rootMargin: "-40% 0px -55% 0px" });
  links.forEach(a => { const s = $(a.getAttribute("href")); if (s && !s.hidden) io.observe(s); });
}

// ---- detay penceresi (ürün / yazı / hizmet); paylaşılabilir bağlantı: #urun-12, #yazi-3, #hizmet-5 ----
function openDlg(list, html, hash, alt, fit) {
  const d = $("#dlg"), many = list.length > 1;
  d.innerHTML = `<div class="dl ${list.length ? "" : "noimg"}"><form method="dialog"><button class="x" aria-label="Kapat">${IC.close}</button></form>${list.length ? `<div class="im" data-i="0" data-fit="${fit || "cover"}"><img class="main" src="${list[0]}" alt="${esc(alt)}">${many ? `<button class="gp" type="button" data-g="-1" aria-label="Önceki görsel">‹</button><button class="gn" type="button" data-g="1" aria-label="Sonraki görsel">›</button><div class="thumbs">${list.map((u, i) => `<button type="button" data-gi="${i}" class="${i ? "" : "on"}" aria-label="${_t("Görsel {0}", i + 1)}"><img src="${u}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}</div>` : ""}<div class="tx">${html}</div></div>`;
  d._imgs = list;
  d.showModal(); document.documentElement.classList.add("lock");
  if (hash) history.replaceState(null, "", location.pathname + location.search + hash);
  d._shareP = shareUrl();
}
// WhatsApp/Facebook sayfayı JavaScript çalıştırmadan okur; bu yüzden paylaşımda p/<id>.html ve y/<id>.html (scripts/build-static.mjs üretir) kullanılır
const shareUrl = async () => {
  const here = location.href; if (S.share_pages === "0" || !/^https?:/.test(location.protocol)) return here;
  const m = location.hash.match(/^#(urun|yazi)-(.+)$/), q = new URLSearchParams(location.search).get("id");
  const rel = m ? (m[1] === "urun" ? "p/" : "y/") + encodeURIComponent(decodeURIComponent(m[2])) + ".html" : PG === "haber" && q ? "y/" + encodeURIComponent(q) + ".html" : "";
  if (!rel) return here; const u = new URL(rel, location.href).href;
  try { const r = await fetch(u, { method: "HEAD" }); return r.ok ? u : here; } catch (e) { return here; }
};
const showImg = (d, n) => {
  const im = d.querySelector(".im"); if (!im || !d._imgs) return; const L = d._imgs.length, i = (n + L) % L;
  im.dataset.i = i; im.querySelector(".main").src = d._imgs[i];
  im.querySelectorAll("[data-gi]").forEach((b, k) => { b.classList.toggle("on", k === i); if (k === i) b.scrollIntoView({ block: "nearest", inline: "center" }); });
};
const closeDlg = () => {
  document.documentElement.classList.remove("lock");
  if (/^#(urun|yazi|hizmet)-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
};
const shareBtn = t => `<button class="btn ghost" type="button" data-share data-title="${esc(t)}">${IC.share}Paylaş</button>`;
const contactBtns = txt => `${digits(S.whatsapp) ? `<a class="btn" target="_blank" rel="noopener" href="${waUrl(txt)}">WhatsApp ile sor</a>` : ""}${S.phone ? `<a class="btn ghost" href="tel:${esc(S.phone).replace(/\s/g, "")}">Ara</a>` : ""}`;
function openProduct(i) {
  const x = PR[i]; if (!x) return; const s = STK[x.stock] || STK.var;
  openDlg(imgsOf(x), `<small>${esc(x.category)}</small><h3>${esc(x.title)}</h3><span class="stk inl ${s[1]}">${s[0]}</span>${x.sku ? `<p class="sku">${esc(_t("Kod: {0}", x.sku))}</p>` : ""}${para(x.description)}<div class="big">${money(x.price) || "Fiyat için bizi arayın"}</div><div class="acts">${contactBtns(_t("Merhaba, {0} hakkında bilgi almak istiyorum.", x.title))}${shareBtn(x.title)}</div>`, "#urun-" + idOf(x, i), x.title, "contain");
}
const postHref = (x, i) => "haber.html?id=" + encodeURIComponent(idOf(x, i));
function openPost(i) {
  const x = PO[i]; if (!x) return; const meta = [x.author, dateTR(x.created_at)].filter(Boolean).map(esc).join(" · "), mode = S.news_detail || "button";
  // "button": kısa özet + "Haberin tamamını oku"; "popup": tüm yazı pencerede
  const body = mode === "popup" ? `<div class="rich">${rich(x.body || x.excerpt)}</div>` : para(x.excerpt || B.textOf(x.body).slice(0, 320) + (B.textOf(x.body).length > 320 ? "…" : ""));
  openDlg(imgsOf(x), `<small>${esc(x.category)}</small><h3>${esc(x.title)}</h3>${meta ? `<div class="meta">${meta}</div>` : ""}${body}<div class="acts">${mode !== "popup" ? `<a class="btn" href="${postHref(x, i)}">Haberin tamamını oku</a>` : ""}${shareBtn(x.title)}</div>`, "#yazi-" + idOf(x, i), x.title);
}
function openService(i) {
  const x = SV[i]; if (!x) return;
  const book = PG === "home" ? "#iletisim" : "index.html?konu=" + encodeURIComponent(x.title) + "#iletisim";
  openDlg([], `<h3>${esc(x.title)}</h3>${para(x.description)}<div class="acts"><a class="btn" href="${book}" data-book="${esc(x.title)}">Randevu al</a>${contactBtns(_t("Merhaba, {0} hizmeti hakkında bilgi almak istiyorum.", x.title))}${shareBtn(x.title)}</div>`, "#hizmet-" + idOf(x, i), x.title);
}
function openByHash() {
  const m = location.hash.match(/^#(urun|yazi|hizmet)-(.+)$/); if (!m) return;
  const list = { urun: PR, yazi: PO, hizmet: SV }[m[1]], i = list.findIndex((x, k) => String(idOf(x, k)) === decodeURIComponent(m[2]));
  if (i >= 0) ({ urun: openProduct, yazi: openPost, hizmet: openService })[m[1]](i);
}
$("#dlg").addEventListener("close", closeDlg);
document.addEventListener("click", e => {
  if (e.target.id === "dlg") return e.target.close();
  const gi = e.target.closest("[data-gi],[data-g]");
  if (gi) { const d = $("#dlg"), cur = +d.querySelector(".im").dataset.i; showImg(d, gi.dataset.gi !== undefined ? +gi.dataset.gi : cur + +gi.dataset.g); return; }
  const sh = e.target.closest("[data-share]");
  if (sh) {
    (async () => {
      const data = { title: sh.dataset.title, url: await ($("#dlg")._shareP || shareUrl()) };
      if (navigator.share) navigator.share(data).catch(() => { });
      else navigator.clipboard?.writeText(data.url).then(() => toast(_t("Bağlantı kopyalandı")), () => toast(_t("Bağlantı kopyalanamadı")));
    })();
    return;
  }
  const bk = e.target.closest("[data-book]");
  if (bk && PG === "home") { e.preventDefault(); $("#dlg").close(); const t = $("#topic"); if (t) t.value = [...t.options].some(o => o.value === bk.dataset.book) ? bk.dataset.book : ""; $("#iletisim").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("#form")?.message.focus({ preventScroll: true }), 500); return; }
  const c = e.target.closest("[data-pi],[data-po],[data-sv]"); if (!c) return;
  if (c.dataset.pi !== undefined) openProduct(+c.dataset.pi);
  else if (c.dataset.sv !== undefined) openService(+c.dataset.sv);
  else openPost(+c.dataset.po);
});
document.addEventListener("keydown", e => { const d = $("#dlg"); if (d.open && d._imgs && d._imgs.length > 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { showImg(d, +d.querySelector(".im").dataset.i + (e.key === "ArrowRight" ? 1 : -1)); return; } if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".pc,.svc li[data-sv]")) { e.preventDefault(); e.target.click(); } });

const pcard = (x, i) => {
  const s = STK[x.stock] || STK.var, im = imgsOf(x)[0], n = imgsOf(x).length;
  return `<article class="pc" tabindex="0" role="button" data-pi="${i}"><div class="in"><div class="ph">${im ? `<img src="${im}" alt="" loading="lazy" decoding="async">` : `<span class="noimg">${IC.car}</span>`}${x.featured ? '<span class="chip">Öne çıkan</span>' : ""}${n > 1 ? `<span class="chip cnt">${_t("{0} görsel", n)}</span>` : ""}<span class="stk ${s[1]}">${s[0]}</span></div><div class="b"><small>${esc(x.category)}</small><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="pr"><b>${money(x.price) || "Fiyat sorunuz"}</b><span>Detay${IC.arrow}</span></div></div></div></article>`;
};
const postCard = (x, i, asLink) => {
  const im = imgsOf(x)[0], page = asLink || (S.news_detail === "page"), T = page ? "a" : "article";
  return `<${T} class="pc" ${page ? `href="${postHref(x, i)}"` : `tabindex="0" role="button" data-po="${i}"`}><div class="in"><div class="ph">${im ? `<img src="${im}" alt="" loading="lazy" decoding="async">` : `<span class="noimg">${IC.car}</span>`}</div><div class="b"><small>${[esc(x.category), dateTR(x.created_at)].filter(Boolean).join(" · ")}</small><h3>${esc(x.title)}</h3><p>${esc(x.excerpt || B.textOf(x.body).slice(0, 140))}</p><div class="pr"><span>${esc(x.author)}</span><span>Oku${IC.arrow}</span></div></div></div></${T}>`;
};
const svcItem = (x, i) => `<li tabindex="0" role="button" data-sv="${i}"><span class="ic">${svcIcon(x.title)}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><span class="go">${IC.arrow}</span></li>`;
const skel = (n, tag = "div") => Array.from({ length: n }, () => `<${tag} class="sk" aria-hidden="true"></${tag}>`).join("");
const fillSections = () => $$("[data-set]").forEach(el => { el.textContent = S[el.dataset.set] ?? ""; });

function slider(list) {
  const el = $("#slider"); if (!list.length) { el.remove(); return; }
  const logo = safeUrl(S.logo_url) || "image/bbslogo.png";
  el.innerHTML = `<div class="track">${list.map((x, i) => { const im = safeUrl(x.image_url), H = i ? "h2 class=\"h1\"" : "h1", Hc = i ? "h2" : "h1"; return `<div class="sl" ${i ? 'aria-hidden="true" inert' : ""} ${im ? `style="background-image:url('${im}')"` : ""}><div class="wrap"><div class="txt"><${H}>${esc(x.title)}</${Hc}><p>${esc(x.text)}</p>${x.btn_text ? `<a class="btn" href="${okHref(x.btn_link)}">${esc(x.btn_text)}</a>` : ""}</div>${im ? "" : `<div class="plate"><img src="${logo}" alt=""></div>`}</div></div>`; }).join("")}</div>
  ${list.length > 1 ? `<button class="sp" aria-label="Önceki">‹</button><button class="sn" aria-label="Sonraki">›</button><div class="dots">${list.map((_, i) => `<button aria-label="${_t("Slayt {0}", i + 1)}"></button>`).join("")}</div>` : ""}`;
  if (list.length < 2) return;
  const tr = el.querySelector(".track"), dots = [...el.querySelectorAll(".dots button")], sl = [...el.querySelectorAll(".sl")];
  let i = 0, t, x0;
  const go = n => { i = (n + list.length) % list.length; tr.style.transform = `translateX(-${i * 100}%)`; dots.forEach((d, k) => { d.classList.toggle("on", k === i); d.setAttribute("aria-current", k === i); }); sl.forEach((s, k) => { s.setAttribute("aria-hidden", k !== i); s.inert = k !== i; }); };
  const stop = () => clearInterval(t);
  const auto = () => { stop(); if (!matchMedia("(prefers-reduced-motion:reduce)").matches && !document.hidden) t = setInterval(() => go(i + 1), 6500); };
  el.querySelector(".sp").onclick = () => { go(i - 1); auto(); }; el.querySelector(".sn").onclick = () => { go(i + 1); auto(); };
  dots.forEach((d, k) => d.onclick = () => { go(k); auto(); });
  el.onmouseenter = stop; el.onmouseleave = auto; el.addEventListener("focusin", stop); el.addEventListener("focusout", auto);
  el.addEventListener("keydown", e => { if (e.key === "ArrowLeft") { go(i - 1); auto(); } else if (e.key === "ArrowRight") { go(i + 1); auto(); } });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : auto());
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
  $$("[data-n]").forEach(el => io.observe(el));
}

// arama / filtre durumunu adres çubuğuna yazar (?q=...&cat=...), bağlantı paylaşılabilir olur
const syncUrl = o => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => v && p.set(k, v)); history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash); };
const fillSelect = (sel, vals) => vals.forEach(c => sel.insertAdjacentHTML("beforeend", `<option>${esc(c)}</option>`));
const fromQuery = (map) => { const P = new URLSearchParams(location.search); Object.entries(map).forEach(([k, sel]) => { const v = P.get(k), el = $(sel); if (v && el && (el.tagName !== "SELECT" || [...el.options].some(o => o.value === v))) el.value = v; }); };

async function home() {
  const nS = intS("svc_limit", 6, 1, 50), nP = intS("prod_limit", 4, 1, 24), nN = intS("news_limit", 4, 1, 24);
  $("#services").innerHTML = skel(Math.min(nS, 4), "li"); $("#products").innerHTML = skel(nP); $("#posts").innerHTML = skel(nN);
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
  $("#services").innerHTML = sv.slice(0, nS).map((x, i) => svcItem(x, i)).join("") || `<li class="none"><p>Henüz hizmet eklenmedi.</p></li>`;
  $("#svc-more").hidden = sv.length <= nS;
  // ürünler: önce öne çıkanlar, eksik kalırsa en yeniler
  $("#products").innerHTML = [...pr].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, nP).map(x => pcard(x, pr.indexOf(x))).join("") || `<p class="empty">Henüz ürün eklenmedi.</p>`;
  $("#prod-more").hidden = pr.length <= nP;
  $("#posts").innerHTML = PO.map((x, i) => postCard(x, i)).join("") || `<p class="empty">Henüz yazı yok.</p>`;
  $("#news-more").hidden = po.length <= nN;
  await reviewsSection(sv);
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
  if (fq.length && on("faq")) jsonLd({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: fq.map(x => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer || "" } })) });
  // iletişim + harita
  const mp = mapPt(), dir = dirUrl(), tel = esc(S.phone).replace(/\s/g, "");
  $("#info").innerHTML = [["Telefon", S.phone && `<a href="tel:${tel}">${esc(S.phone)}</a>`], ["E-posta", S.email && `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`], ["Çalışma saatleri", esc(S.hours)], ["Adres", esc(S.address)]].filter(r => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  $("#map").innerHTML = (mp.ok ? `<iframe title="Harita" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${mp.lng - .006}%2C${mp.lat - .004}%2C${mp.lng + .006}%2C${mp.lat + .004}&amp;layer=mapnik&amp;marker=${mp.lat}%2C${mp.lng}"></iframe>` : "") + (dir ? `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(dir)}">Yol tarifi al</a>` : "");
  // yerel işletme bilgisi (arama motorları için)
  jsonLd({
    "@context": "https://schema.org", "@type": "AutoRepair", name: S.site_title, description: S.meta_desc || S.tagline, image: absUrl(safeUrl(S.logo_url) || "image/bbslogo.png"),
    url: location.origin && location.origin !== "null" ? location.origin + location.pathname : undefined, telephone: S.phone || undefined, email: S.email || undefined,
    address: S.address ? { "@type": "PostalAddress", streetAddress: S.address } : undefined, geo: mp.ok ? { "@type": "GeoCoordinates", latitude: mp.lat, longitude: mp.lng } : undefined,
    sameAs: (soc_cache || []).map(x => x.url).filter(u => /^https?:/i.test(u))
  });
  // konu listesi + hizmet sayfasından gelen ön seçim (?konu=)
  const tp = $("#topic"); sv.forEach(x => tp.insertAdjacentHTML("beforeend", `<option>${esc(x.title)}</option>`)); tp.insertAdjacentHTML("beforeend", "<option>Diğer</option>");
  fromQuery({ konu: "#topic" });
  const f = $("#form"), m = $("#msg"), sbtn = f.querySelector("[type=submit]");
  $("#consent-txt").innerHTML = consentTxt("consent_label"); $("#consent-box").hidden = S.require_consent === "0";
  const say = (t, ok) => { m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); };
  f.addEventListener("input", e => e.target.removeAttribute("aria-invalid"));
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)); [...f.elements].forEach(el => el.removeAttribute?.("aria-invalid"));
    if (d.website) { say("Teşekkürler, en kısa sürede dönüş yapacağız.", true); f.reset(); return; } // gizli alan doluysa bot
    delete d.website; d.name = d.name.trim(); d.message = d.message.trim(); d.phone = d.phone.trim(); d.email = d.email.trim();
    if (!d.name || !d.message) return say("Ad soyad ve mesaj alanlarını doldurun.");
    if (!d.phone && !d.email) { f.phone.setAttribute("aria-invalid", "true"); f.email.setAttribute("aria-invalid", "true"); f.phone.focus(); return say("Size dönebilmemiz için telefon ya da e-posta yazın."); }
    if (d.email && !f.email.checkValidity()) { f.email.setAttribute("aria-invalid", "true"); f.email.focus(); return say("E-posta adresi geçersiz görünüyor."); }
    if (S.require_consent !== "0" && !f.consent.checked) { f.consent.setAttribute("aria-invalid", "true"); f.consent.focus(); return say(_t("Devam etmek için aydınlatma metnini onaylayın.")); }
    d.consent = !!f.consent.checked; d.consent_at = d.consent ? new Date().toISOString() : null;
    let last = 0; try { last = +localStorage.getItem("bbs_sent") || 0; } catch (x) { }
    if (Date.now() - last < 30000) return say("Çok sık gönderiyorsunuz, lütfen biraz bekleyin.");
    if (!db) return say("Mesaj sistemi şu an bağlı değil, lütfen telefonla ulaşın.");
    if ($("#topic").value) d.message = ("[Konu: " + $("#topic").value + "] " + d.message).slice(0, 1000);
    sbtn.disabled = true; say("Gönderiliyor…", true);
    let { error } = await db.from("messages").insert(d);
    if (error && /consent/.test(error.message || "")) { delete d.consent; delete d.consent_at; ({ error } = await db.from("messages").insert(d)); }
    sbtn.disabled = false;
    if (error) return say("Gönderilemedi, lütfen telefonla ulaşın.");
    try { localStorage.setItem("bbs_sent", Date.now()); } catch (x) { }
    say("Teşekkürler, en kısa sürede dönüş yapacağız.", true); f.reset(); toast("Mesajınız iletildi");
  });
  spy(); openByHash();
  await preload(rawUrl(sl[0]?.image_url));
}

async function hizmetler() {
  $("#services").innerHTML = skel(6, "li");
  SV = await get("services", q => q.order("sort"));
  const draw = () => {
    const q = $("#q").value.toLocaleLowerCase("tr");
    const l = SV.filter(x => (x.title + " " + (x.description || "")).toLocaleLowerCase("tr").includes(q));
    $("#count").textContent = _t("{0} hizmet", l.length);
    $("#services").innerHTML = l.map(x => svcItem(x, SV.indexOf(x))).join("") || `<li class="none"><p>Sonuç bulunamadı. Başka bir kelime deneyin.</p></li>`;
  };
  fromQuery({ q: "#q" });
  $("#q").addEventListener("input", () => { draw(); syncUrl({ q: $("#q").value }); }); draw(); openByHash();
}

async function urunler() {
  $("#products").innerHTML = skel(8);
  PR = await get("products", q => q.eq("published", true).order("created_at", { ascending: false }));
  fillSelect($("#cat"), [...new Set(PR.map(x => x.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr")));
  fromQuery({ q: "#q", cat: "#cat", stk: "#stk", srt: "#srt" });
  const draw = () => {
    const q = $("#q").value.toLocaleLowerCase("tr"), c = $("#cat").value, st = $("#stk").value, so = $("#srt").value;
    let l = PR.filter(x => (!c || x.category === c) && (!st || (x.stock || "var") === st) && (x.title + " " + (x.description || "") + " " + (x.category || "") + " " + (x.sku || "")).toLocaleLowerCase("tr").includes(q));
    const pv = x => x.price == null ? Infinity : Number(x.price);
    if (so === "az") l.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    if (so === "ar") l.sort((a, b) => pv(a) - pv(b));
    if (so === "az2") l.sort((a, b) => (b.price == null ? -1 : pv(b)) - (a.price == null ? -1 : pv(a)));
    const act = !!(q || c || st || so !== "yeni");
    $("#count").textContent = _t("{0} ürün", l.length); $("#clr").hidden = !act;
    $("#products").innerHTML = l.map(x => pcard(x, PR.indexOf(x))).join("") || `<p class="empty">Aramanıza uyan ürün yok. Filtreleri değiştirin ya da temizleyin.</p>`;
    syncUrl({ q: $("#q").value, cat: c, stk: st, srt: so === "yeni" ? "" : so });
  };
  ["#q", "#cat", "#stk", "#srt"].forEach(s => $(s).addEventListener("input", draw));
  $("#clr").onclick = () => { $("#q").value = ""; $("#cat").value = ""; $("#stk").value = ""; $("#srt").value = "yeni"; draw(); };
  draw(); openByHash();
}

async function haberler() {
  $("#posts").innerHTML = skel(8);
  PO = await get("posts", q => q.eq("published", true).order("created_at", { ascending: false }));
  fillSelect($("#cat"), [...new Set(PO.map(x => x.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr")));
  fromQuery({ q: "#q", cat: "#cat" });
  const PAGE = 12; let shown = PAGE;
  const draw = () => {
    const q = $("#q").value.toLocaleLowerCase("tr"), c = $("#cat").value;
    const l = PO.filter(x => (!c || x.category === c) && ((x.title || "") + " " + (x.excerpt || "") + " " + (x.category || "")).toLocaleLowerCase("tr").includes(q));
    $("#count").textContent = _t("{0} yazı", l.length);
    $("#posts").innerHTML = l.slice(0, shown).map(x => postCard(x, PO.indexOf(x))).join("") || `<p class="empty">Aramanıza uyan yazı yok.</p>`;
    $("#loadmore").hidden = l.length <= shown;
    syncUrl({ q: $("#q").value, cat: c });
  };
  ["#q", "#cat"].forEach(s => $(s).addEventListener("input", () => { shown = PAGE; draw(); }));
  $("#loadmore").onclick = () => { shown += PAGE; draw(); };
  draw(); openByHash();
}

async function sayfa() {
  const slug = new URLSearchParams(location.search).get("s") || "";
  const l = await get("pages", q => q.eq("slug", slug).eq("published", true));
  const p = l[0];
  $("#content").innerHTML = p ? `<div class="head"><h2>${esc(p.title)}</h2></div><div class="rich">${fillTok(rich(p.body))}</div>` : `<div class="head"><h2>Sayfa bulunamadı</h2></div><p><a class="btn" href="index.html">Anasayfaya dön</a></p>`;
  if (p) seo(p.title + " | " + S.site_title, B.textOf(p.body).slice(0, 155));
}

async function haber() {
  const id = new URLSearchParams(location.search).get("id") || "", box = $("#post");
  box.innerHTML = skel(1);
  PO = await get("posts", q => q.eq("published", true).order("created_at", { ascending: false }));
  const i = PO.findIndex((x, k) => String(idOf(x, k)) === id), x = PO[i];
  if (!x) { box.innerHTML = `<a class="crumb" href="haberler.html">${IC.arrow}Tüm haberler</a><div class="head"><h2>Haber bulunamadı</h2></div><p>Bu haber kaldırılmış ya da adres yanlış olabilir.</p><p><a class="btn" href="haberler.html">Haberlere dön</a></p>`; return; }
  const im = imgsOf(x), meta = [esc(x.category), esc(x.author), dateTR(x.created_at)].filter(Boolean).join(" · ");
  box.innerHTML = `<a class="crumb" href="haberler.html">${IC.arrow}Tüm haberler</a>${meta ? `<div class="meta">${meta}</div>` : ""}<h1>${esc(x.title)}</h1>${x.excerpt ? `<p class="lead">${esc(x.excerpt)}</p>` : ""}${im[0] ? `<figure class="pimg"><img src="${im[0]}" alt="${esc(x.title)}"></figure>` : ""}<div class="rich">${rich(x.body || "")}</div>${im.length > 1 ? `<div class="more-imgs">${im.slice(1).map(u => `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="" loading="lazy"></a>`).join("")}</div>` : ""}<div class="acts">${shareBtn(x.title)}${contactBtns(_t("Merhaba, \"{0}\" yazınız hakkında yazıyorum.", x.title))}</div>`;
  const first = rawUrl(String(x.image_url || "").split(/\n+/)[0].trim()), desc = (x.excerpt || B.textOf(x.body)).slice(0, 155);
  seo(x.title + " | " + S.site_title, desc);
  if (first) setMeta("og:image", absUrl(first), true);
  jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: x.title, description: desc, image: first || undefined, datePublished: x.created_at || undefined, author: x.author ? { "@type": "Person", name: x.author } : undefined, publisher: { "@type": "Organization", name: S.site_title } });
  const others = PO.filter((_, k) => k !== i).slice(0, 3);
  $("#more").hidden = !others.length; $("#posts").innerHTML = others.map(o => postCard(o, PO.indexOf(o), true)).join("");
  await preload(first);
}

// ---- yasal metin, onay kutusu, çerez bildirimi, ziyaret sayacı ----
const consentTxt = key => {
  const lbl = esc(_t(S[key] || B.DEF[key])), name = esc(_t(S.kvkk_link_text || B.DEF.kvkk_link_text));
  return lbl.replace("{link}", LEGAL.kvkk ? `<a href="sayfa.html?s=kvkk" target="_blank" rel="noopener">${name}</a>` : name);
};
function cookieNotice() {
  if (S.cookie_notice === "0") return;
  try { if (localStorage.getItem("bbs_cn")) return; } catch (e) { }
  const el = document.createElement("div"); el.className = "cn"; el.setAttribute("role", "region"); el.setAttribute("aria-label", _t("Çerez bildirimi"));
  el.innerHTML = `<p>${esc(S.cookie_text)}${LEGAL.cerez ? ` <a href="sayfa.html?s=cerez">${_t("Çerez Politikası")}</a>` : ""}</p><button class="btn sm" type="button">${_t("Tamam")}</button>`;
  el.querySelector("button").onclick = () => { try { localStorage.setItem("bbs_cn", "1"); } catch (e) { } el.remove(); };
  document.body.appendChild(el);
}
// çerezsiz, IP saklamayan sayaç (supabase/schema-v4.sql: track_visit). Do Not Track açıksa, yönetici girişliyse ve botlarda sayılmaz.
async function track() {
  try {
    if (!db || S.visit_counter === "0" || navigator.doNotTrack === "1" || location.protocol === "file:" || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
    if ((await db.auth.getSession()).data.session) return;
    let ref = ""; try { const h = new URL(document.referrer).hostname; if (h && h !== location.hostname) ref = h.replace(/^www\./, ""); } catch (e) { }
    const p = (location.pathname.split("/").pop() || "index.html") + (PG === "haber" || PG === "sayfa" ? location.search : "");
    await db.rpc("track_visit", { p_path: p.slice(0, 100), p_ref: ref });
  } catch (e) { }
}

// ---- müşteri yorumları ----
const stars = n => `<span class="st" role="img" aria-label="${n} / 5">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`;
async function reviewsSection(sv) {
  const sec = $("#yorumlar"); if (!sec) return;
  if (S.show_reviews === "0") { sec.hidden = true; return; }
  const list = await get("reviews", q => q.eq("published", true).order("created_at", { ascending: false }));
  const n = list.length, avg = n ? list.reduce((a, x) => a + x.rating, 0) / n : 0, lim = intS("reviews_limit", 6, 1, 50);
  const open = S.reviews_open !== "0", g = safeUrl(S.google_review_url);
  const card = x => `<article class="rv">${stars(x.rating)}<p>${esc(x.comment)}</p><div class="by"><b>${esc(x.name)}</b>${x.service ? ` · ${esc(x.service)}` : ""} · ${dateTR(x.created_at)}</div>${x.reply ? `<div class="rp"><b>${_t("Yanıtımız")}</b><p>${esc(x.reply)}</p></div>` : ""}</article>`;
  const bars = [5, 4, 3, 2, 1].map(k => { const c = list.filter(x => x.rating === k).length; return `<li><span>${k}★</span><i><b style="width:${n ? Math.round(c / n * 100) : 0}%"></b></i><span>${c}</span></li>`; }).join("");
  $("#rev").innerHTML = `<aside class="rsum">${n ? `<div class="avg">${avg.toLocaleString(B.loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>${stars(Math.round(avg))}<small>${_t("{0} yorum", n)}</small><ul>${bars}</ul>` : `<p>${_t("Henüz yorum yok. İlk yorumu siz yazın!")}</p>`}<div class="acts">${open ? `<button class="btn" type="button" id="rv-new">${_t("Yorum yaz")}</button>` : ""}${g ? `<a class="btn ghost" href="${g}" target="_blank" rel="noopener">${_t("Google'da değerlendirin")}</a>` : ""}</div></aside><div class="rlist"><div class="rgrid" id="rgrid">${list.slice(0, lim).map(card).join("")}</div>${n > lim ? `<div class="more"><button class="btn ghost" type="button" id="rv-more">${_t("Tüm yorumları göster")}</button></div>` : ""}</div>`;
  const more = $("#rv-more"); if (more) more.onclick = () => { $("#rgrid").innerHTML = list.map(card).join(""); more.parentNode.remove(); };
  const nw = $("#rv-new"); if (nw) nw.onclick = () => openReview(sv);
  if (open && new URLSearchParams(location.search).get("yorum") === "1") { sec.scrollIntoView(); openReview(sv); }
}
function openReview(sv) {
  const needC = S.require_consent !== "0";
  openDlg([], `<h3>${_t("Yorum yaz")}</h3><form id="rf" novalidate>
    <label>${_t("Adınız")}<input name="name" required maxlength="80" autocomplete="name"></label>
    <label><span>${_t("Hizmet")} <span class="opt">${_t("(isteğe bağlı)")}</span></span><select name="service"><option value="">${_t("Seçin")}</option>${sv.map(x => `<option>${esc(x.title)}</option>`).join("")}<option>${_t("Diğer")}</option></select></label>
    <fieldset class="rtg"><legend>${_t("Puanınız")}</legend><div class="rate">${[5, 4, 3, 2, 1].map(k => `<input type="radio" name="rating" id="rt${k}" value="${k}"><label for="rt${k}" title="${k}">★</label>`).join("")}</div></fieldset>
    <label>${_t("Yorumunuz")}<textarea name="comment" required maxlength="1000" rows="4"></textarea></label>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    ${needC ? `<label class="chk"><input type="checkbox" name="consent"><span>${consentTxt("review_consent_label")}</span></label>` : ""}
    <button class="btn" type="submit">${_t("Yorumu gönder")}</button><p class="msg" id="rmsg" role="status" aria-live="polite"></p></form>`, "", "");
  const f = $("#rf"), m = $("#rmsg"), say = (x, ok) => { m.textContent = x; m.className = "msg " + (ok ? "ok" : "err"); };
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(f), d = { name: String(fd.get("name") || "").trim(), comment: String(fd.get("comment") || "").trim(), service: fd.get("service") || null, rating: +(fd.get("rating") || 0) };
    if (fd.get("website")) return say(_t("Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır. Teşekkürler!"), true);
    if (!d.name) return say(_t("Lütfen adınızı yazın."));
    if (!d.rating) return say(_t("Lütfen bir puan seçin."));
    if (d.comment.length < 5) return say(_t("Yorumunuz en az 5 karakter olmalı."));
    if (needC && !fd.get("consent")) return say(_t("Devam etmek için aydınlatma metnini onaylayın."));
    let last = 0; try { last = +localStorage.getItem("bbs_rev") || 0; } catch (x) { }
    if (Date.now() - last < 86400000) return say(_t("Bugün zaten bir yorum gönderdiniz."));
    if (!db) return say(_t("Gönderilemedi, lütfen telefonla ulaşın."));
    d.consent = !!fd.get("consent");
    const btn = f.querySelector("[type=submit]"); btn.disabled = true; say(_t("Yorum gönderiliyor…"), true);
    let { error } = await db.from("reviews").insert(d);
    if (error && /consent/.test(error.message || "")) { delete d.consent; ({ error } = await db.from("reviews").insert(d)); }
    btn.disabled = false;
    if (error) return say(_t("Yorum gönderilemedi, lütfen daha sonra tekrar deneyin."));
    try { localStorage.setItem("bbs_rev", Date.now()); } catch (x) { }
    f.innerHTML = `<p class="msg ok">${_t("Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır. Teşekkürler!")}</p><button class="btn" type="button" id="rf-x">${_t("Kapat")}</button>`;
    $("#rf-x").onclick = () => $("#dlg").close();
  });
}

let soc_cache = [];
// açılış ekranı: içerik, yazı tipi ve ilk görsel hazır olunca (en fazla 7 sn sonra) kapanır
const splash = $("#splash");
const hideSplash = () => {
  if (!splash || !splash.isConnected) return; splash.classList.add("done"); setTimeout(() => splash.remove(), 700);
  try { sessionStorage.setItem("bbs_splash", "1"); } catch (e) { }
};
setTimeout(hideSplash, 7000);
(async () => {
  const root = document.documentElement;
  try {
  if (!root.dataset.theme) { let th = null; try { th = localStorage.getItem("theme"); } catch (e) { } root.dataset.theme = th || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light"); }
  if (C.SUPABASE_URL) { try { await B.loadLib(); db = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY); } catch (e) { console.warn("Supabase yüklenemedi", e); } }
  if (db) { try { const { data } = await db.from("settings").select("*"); (data || []).forEach(r => { if (r.value) S[r.key] = r.value; }); } catch (e) { console.warn("Ayarlar alınamadı", e); } }
  await B.initLang(db, S);
  B.applyTheme(S);
  try { const lg = rawUrl(S.logo_url); lg ? localStorage.setItem("bbs_logo", lg) : localStorage.removeItem("bbs_logo"); } catch (e) { }
  const [menu, soc, lp] = await Promise.all([get("menu", q => q.order("sort")), get("socials", q => q.eq("visible", true).order("sort")), get("pages", q => q.in("slug", ["kvkk", "gizlilik", "cerez"]).eq("published", true))]);
  soc_cache = soc; LEGAL = Object.fromEntries(lp.map(p => [p.slug, p]));
  chrome(menu, soc); cookieNotice();
  if (PG === "home") seo(S.site_title + " | " + S.tagline, S.meta_desc || S.tagline);
  else if (PG !== "sayfa") seo(null, S.meta_desc || undefined);
  const fonts = document.fonts?.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  await ({ home, urunler, sayfa, haberler, hizmetler, haber })[PG]?.();
  await fonts;
  } catch (e) { console.error(e); }
  hideSplash();
  track();
})();
