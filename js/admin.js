const C = window.BBS_CONFIG, B = window.BBS, esc = B.esc, app = document.getElementById("app"), $ = s => document.querySelector(s);
if (!C.SUPABASE_URL) { app.innerHTML = "<p style='padding:2rem'>js/config.js içine Supabase bilgilerini girin.</p>"; throw 0; }
let db, cur = "dash";
const toast = m => { const t = document.createElement("div"); t.id = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };

const FL = { title: "Başlık", text: "Açıklama", image_url: "Görsel", btn_text: "Buton yazısı", btn_link: "Buton bağlantısı", sort: "Sıra", active: "Yayında", label: "Menü adı", href: "Bağlantı", visible: "Görünür", slug: "Adres (örn: hakkimizda)", body: "İçerik", published: "Yayında", description: "Açıklama", category: "Kategori", price: "Fiyat", stock: "Stok durumu", featured: "Öne çıkan", author: "Yazar", excerpt: "Özet", name: "Ad", phone: "Telefon", email: "E-posta", message: "Mesaj", created_at: "Tarih" };
const STOCK = [["var", "Stokta"], ["sinirli", "Sınırlı stok"], ["yok", "Tükendi"]];
// Yeni içerik türü eklemek için buraya bir satır eklemek yeterli
const T = {
  dash: { label: "Panel", i: "▦" },
  slides: { label: "Slider", i: "▭", order: 1, cols: ["title", "btn_text", "active", "sort"], f: { title: "text", text: "area", image_url: "image", btn_text: "text", btn_link: "link", active: "check", sort: "number" } },
  menu: { label: "Menü", i: "☰", order: 1, cols: ["label", "href", "visible", "sort"], f: { label: "text", href: "link", visible: "check", sort: "number" } },
  pages: { label: "Sayfalar", i: "▤", cols: ["title", "slug", "published"], f: { title: "text", slug: "text", body: "area", published: "check" }, pre: o => { o.slug = o.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""); } },
  services: { label: "Hizmetler", i: "⚙", order: 1, cols: ["title", "sort"], f: { title: "text", description: "area", sort: "number" } },
  products: { label: "Ürünler", i: "◫", cols: ["title", "category", "price", "stock", "featured", "published"], f: { title: "text", category: "text", price: "number", stock: ["select", STOCK], description: "area", image_url: "image", featured: "check", published: "check" } },
  posts: { label: "Haberler / Blog", i: "✎", cols: ["title", "category", "published"], f: { title: "text", category: "text", author: "text", excerpt: "area", body: "area", image_url: "image", published: "check" } },
  messages: { label: "Mesajlar", i: "✉", cols: ["name", "phone", "message", "created_at"], f: null },
  settings: { label: "Site Ayarları", i: "★" }
};
const CNT = n => [4, 6, 8, 10, 12, 16, 20].map(x => [String(x), x + " " + n]);
const BGS = [["solid", "Düz renk"], ["linear", "Gradyan"], ["radial", "Radyal"]];
// Sekmeler: [id, başlık, [[fieldset başlığı, alanlar]]]; "renk" sekmesi ayrıca özel çizilir
const TABS = [
  ["genel", "Genel", [["Site bilgileri", [["site_title", "Site başlığı", "text"], ["tagline", "Slogan", "text"], ["logo_url", "Logo", "image"], ["announcement", "Duyuru çubuğu (boşsa görünmez)", "text"], ["footer_text", "Alt bilgi yazısı", "text"], ["currency", "Para birimi (€, ₺, $)", "text"]]]]],
  ["renk", "Renk paletleri", []],
  ["yazi", "Yazı tipi ve boyut", [["Yazı tipleri", [["font_head", "Bölüm başlıkları", "select", B.FONTS], ["font_card", "Kart, popup ve hizmet başlıkları (ürün adı, fiyat dahil)", "select", B.FONTS], ["font_hero", "Büyük başlıklar (slider, Neler yapıyoruz, sayılar)", "select", B.FONTS], ["font_btn", "Butonlar", "select", B.FONTS], ["font_body", "Genel metin", "select", B.FONTS]]], ["Boyut", [["font_size", "Genel boyut (px) — tüm site büyür/küçülür", "range", [13, 22]], ["head_size", "Başlık boyutu (%)", "range", [70, 140]]]]]],
  ["ana", "Anasayfa", [["Kaç tane gösterilsin?", [["svc_limit", "Hizmet sayısı", "select", CNT("hizmet")], ["prod_limit", "Ürün sayısı", "select", CNT("ürün")], ["news_limit", "Haber sayısı", "select", CNT("haber")]]], ["Bölüm başlıkları", [["sec_svc_title", "Hizmetler başlığı", "text"], ["sec_svc_text", "Hizmetler alt yazısı", "text"], ["sec_prod_title", "Ürünler başlığı", "text"], ["sec_prod_text", "Ürünler alt yazısı", "text"], ["sec_news_title", "Haberler başlığı", "text"], ["sec_news_text", "Haberler alt yazısı", "text"], ["sec_contact_title", "Mesaj formu başlığı", "text"], ["sec_find_title", "İletişim bilgisi başlığı", "text"]]], ["Neler yapıyoruz bandı", [["hl_title", "Başlık", "text"], ["hl_text", "Açıklama", "area"], ["hl_btn_text", "Buton yazısı", "text"], ["hl_btn_link", "Buton bağlantısı", "text"], ["stat1_num", "1. sayı (örn 10+)", "text"], ["stat1_label", "1. etiket", "text"], ["stat2_num", "2. sayı", "text"], ["stat2_label", "2. etiket", "text"], ["stat3_num", "3. sayı", "text"], ["stat3_label", "3. etiket", "text"]]]]],
  ["iletisim", "İletişim ve sosyal", [["İletişim ve harita", [["phone", "Telefon", "text"], ["email", "E-posta", "text"], ["hours", "Çalışma saatleri", "text"], ["address", "Adres", "area"], ["map_lat", "Enlem (Google Haritalar'da konuma sağ tıklayıp kopyalayın)", "text"], ["map_lng", "Boylam", "text"], ["whatsapp", "WhatsApp numarası (ülke koduyla, örn 905551112233)", "text"]]], ["Sosyal medya", [["facebook", "Facebook adresi (https://...)", "text"], ["instagram", "Instagram adresi (https://...)", "text"]]]]],
  ["gelismis", "Gelişmiş", [["Gelişmiş", [["auto_contrast", "Otomatik okunabilirlik düzeltmesi", "select", [["0", "Kapalı — seçtiğim renkler aynen uygulansın"], ["1", "Açık — okunmayan yazı renkleri otomatik açılıp koyulaşsın"]]], ["custom_css", "Özel CSS (en son uygulanır, panel ayarlarının üstüne yazar)", "area"]]]]]
];
const STYLE_KEYS = { false: "bg_style", true: "dark_bg_style" };

const cell = (k, v) => v === true ? "✓" : v === false ? "–" : k === "created_at" ? new Date(v).toLocaleDateString("tr-TR") : k === "stock" ? (STOCK.find(s => s[0] === v) || ["", v ?? ""])[1] : esc(String(v ?? "").slice(0, 70));

async function start() {
  try { await B.loadLib(); } catch (e) { app.textContent = "Supabase kütüphanesi yüklenemedi (internet bağlantısını kontrol edin)."; return; }
  db = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  (await db.auth.getSession()).data.session ? shell() : login();
}
function login() {
  app.innerHTML = `<form class="login"><h2>Yönetici Girişi</h2><label>E-posta<input name="e" type="email" required></label><label>Şifre<input name="p" type="password" required></label><button class="b">Giriş</button><small id="er"></small></form>`;
  app.querySelector("form").onsubmit = async e => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({ email: e.target.e.value, password: e.target.p.value });
    error ? ($("#er").textContent = "Giriş başarısız") : shell();
  };
}
function shell() {
  app.innerHTML = `<div class="shell"><aside class="sb"><div class="logo">BBS <b>AUTO</b> Yönetim</div>${Object.entries(T).map(([k, v]) => `<button data-k="${k}" class="${k === cur ? "on" : ""}"><span>${v.i}</span>${v.label}</button>${k === "dash" || k === "products" ? "<hr>" : ""}`).join("")}<hr><a href="../index.html" target="_blank">↗ Siteyi gör</a><button id="out">⎋ Çıkış</button></aside><main id="m"></main></div><dialog id="dlg"></dialog>`;
  app.querySelectorAll("[data-k]").forEach(b => b.onclick = () => go(b.dataset.k));
  $("#out").onclick = async () => { await db.auth.signOut(); login(); };
  ({ dash, settings: settingsView }[cur] || list)();
}
const go = k => { cur = k; shell(); };

async function dash() {
  const ks = ["products", "posts", "services", "messages", "slides", "pages"];
  const cs = await Promise.all(ks.map(k => db.from(k).select("*", { count: "exact", head: true }).then(r => r.count ?? "–")));
  const { data: ms } = await db.from("messages").select("*").order("created_at", { ascending: false }).limit(5);
  $("#m").innerHTML = `<h2>Hoş geldiniz</h2><div class="tiles">${ks.map((k, i) => `<div class="tile" data-go="${k}"><b>${cs[i]}</b>${T[k].label}</div>`).join("")}</div>
  <div class="row"><button class="b" data-go="products">+ Ürün ekle</button><button class="b" data-go="posts">+ Haber ekle</button><button class="b s" data-go="slides">Slider düzenle</button><button class="b s" data-go="settings">Site ayarları</button></div>
  <div class="card"><h3 style="margin-top:0">Son mesajlar</h3><ul>${(ms || []).map(x => `<li><b>${esc(x.name)}</b> ${esc(x.phone)}<br>${esc(x.message)}</li>`).join("") || "<li>Henüz mesaj yok.</li>"}</ul></div>`;
  document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
}

async function list() {
  const t = T[cur];
  let q = db.from(cur).select("*"); q = t.order ? q.order("sort") : q.order("id", { ascending: false });
  const { data, error } = await q;
  if (error) { $("#m").innerHTML = `<h2>${t.label}</h2><div class="card">${esc(error.message)}<br>schema-v2.sql dosyasını çalıştırdınız mı?</div>`; return; }
  $("#m").innerHTML = `<div class="row"><h2 style="margin:0">${t.label} <small class="hint">${data.length} kayıt</small></h2><span style="display:flex;gap:.6rem"><input id="srch" placeholder="Ara..." style="width:200px">${t.f ? '<button class="b" id="new">+ Yeni ekle</button>' : ""}</span></div>
  <div class="tw"><table><tr>${t.cols.map(c => `<th>${FL[c] || c}</th>`).join("")}<th></th></tr>${data.map((r, i) => `<tr>${t.cols.map(c => `<td>${cell(c, r[c])}</td>`).join("")}<td class="ac">${t.order ? `<button class="b i" data-m="${i},-1">▲</button> <button class="b i" data-m="${i},1">▼</button> ` : ""}${t.f ? `<button class="b s" data-e="${r.id}">Düzenle</button>` : ""}<button class="b g" data-d="${r.id}">Sil</button></td></tr>`).join("")}</table></div>`;
  $("#srch").oninput = e => document.querySelectorAll("table tr:not(:first-child)").forEach(tr => tr.classList.toggle("hid", !tr.textContent.toLowerCase().includes(e.target.value.toLowerCase())));
  if (t.f) $("#new").onclick = () => edit({ sort: (data.length + 1) * 10 });
  document.querySelectorAll("[data-e]").forEach(b => b.onclick = () => edit(data.find(r => String(r.id) === b.dataset.e)));
  document.querySelectorAll("[data-d]").forEach(b => b.onclick = async () => { if (confirm("Silinsin mi?")) { await db.from(cur).delete().eq("id", b.dataset.d); toast("Silindi"); list(); } });
  document.querySelectorAll("[data-m]").forEach(b => b.onclick = async () => {
    const [i, d] = b.dataset.m.split(",").map(Number), j = i + d; if (j < 0 || j >= data.length) return;
    const a = [...data]; [a[i], a[j]] = [a[j], a[i]];
    await Promise.all(a.map((r, k) => db.from(cur).update({ sort: (k + 1) * 10 }).eq("id", r.id))); list();
  });
}

function upload(root) {
  root.querySelectorAll("[data-up]").forEach(i => i.onchange = async () => {
    const f = i.files[0]; if (!f) return;
    const p = Date.now() + "-" + f.name.replace(/[^\w.-]/g, "_");
    const { error } = await db.storage.from("media").upload(p, f);
    if (error) return alert(error.message);
    const el = root.querySelector(`[name=${i.dataset.up}]`); el.value = db.storage.from("media").getPublicUrl(p).data.publicUrl; el.dispatchEvent(new Event("input", { bubbles: true })); toast("Görsel yüklendi");
  });
}
async function edit(row) {
  const t = T[cur], isNew = row.id == null, d = $("#dlg");
  const links = ["#neler", "#hizmetler", "hizmetler.html", "urunler.html", "#haberler", "haberler.html", "#iletisim"];
  if (Object.values(t.f).includes("link")) ((await db.from("pages").select("slug")).data || []).forEach(p => links.push("sayfa.html?s=" + p.slug));
  const input = (k, spec) => {
    const [ty, opt] = [].concat(spec), v = row[k];
    return ty === "area" ? `<textarea name="${k}" rows="5">${esc(v)}</textarea>`
      : ty === "check" ? `<input type="checkbox" name="${k}" ${v === false ? "" : "checked"}>`
      : ty === "select" ? `<select name="${k}">${opt.map(([a, b]) => `<option value="${a}" ${a === (v ?? opt[0][0]) ? "selected" : ""}>${b}</option>`).join("")}</select>`
      : ty === "image" ? `<input name="${k}" value="${esc(v)}" placeholder="https://... veya aşağıdan yükleyin"><input type="file" accept="image/*" data-up="${k}">`
      : ty === "link" ? `<input name="${k}" value="${esc(v)}" list="lk">`
      : `<input name="${k}" type="${ty}" value="${esc(v)}" step="any">`;
  };
  d.innerHTML = `<form><h3 style="margin:0">${t.label}: ${isNew ? "Yeni kayıt" : "Düzenle"}</h3><datalist id="lk">${links.map(l => `<option value="${l}">`).join("")}</datalist>${Object.entries(t.f).map(([k, s]) => `<label>${FL[k] || k}${input(k, s)}</label>`).join("")}<div class="row" style="margin:0"><button type="button" class="b s" id="cx">Vazgeç</button><button class="b">Kaydet</button></div></form>`;
  d.showModal(); upload(d); $("#cx").onclick = () => d.close();
  d.querySelector("form").onsubmit = async e => {
    e.preventDefault(); const o = {};
    for (const [k, s] of Object.entries(t.f)) { const ty = [].concat(s)[0], el = e.target[k]; o[k] = ty === "check" ? el.checked : ty === "number" ? (el.value === "" ? null : Number(el.value)) : el.value; }
    t.pre?.(o);
    const { error } = isNew ? await db.from(cur).insert(o) : await db.from(cur).update(o).eq("id", row.id);
    if (error) return alert(error.message);
    d.close(); toast("Kaydedildi"); list();
  };
}

let stab = "genel";
async function settingsView() {
  const { data } = await db.from("settings").select("*");
  const S = { ...B.DEF, ...Object.fromEntries((data || []).filter(r => r.value).map(r => [r.key, r.value])) };
  const colorKeys = [false, true].flatMap(d => B.ROLES.map(r => B.key(r, d)));
  // elle belirlenmiş renkler; diğerleri "otomatik" (başka renkten türetilir)
  const custom = new Set(colorKeys.filter(k => B.hex(S[k], null)));
    const fld = ([k, l, ty, o]) => `<label>${l}${ty === "range" ? `<input type="range" name="${k}" min="${o[0]}" max="${o[1]}" value="${S[k]}">`
    : ty === "select" ? `<select name="${k}">${o.map(([a, b]) => `<option value="${a}" ${a === String(S[k]) ? "selected" : ""}>${b}</option>`).join("")}</select>`
    : ty === "area" ? `<textarea name="${k}" rows="${k === "custom_css" ? 8 : 3}" ${k === "custom_css" ? 'spellcheck="false" placeholder=".pc h3 { letter-spacing: 0; }"' : ""}>${esc(S[k])}</textarea>`
    : ty === "image" ? `<input name="${k}" value="${esc(S[k])}" placeholder="Boşsa varsayılan logo"><input type="file" accept="image/*" data-up="${k}">`
    : `<input name="${k}" value="${esc(S[k])}">`}</label>`;
  const crow = (r, dark) => { const k = B.key(r, dark); return `<div class="cr"><span class="cl">${B.ROLE_LABEL[r]}</span><div class="cw"><input type="color" name="${k}" data-color="${k}" data-role="${r}" data-dark="${dark ? 1 : 0}" aria-label="${B.ROLE_LABEL[r]}"><input class="hx" data-hex="${k}" maxlength="7" spellcheck="false" aria-label="Renk kodu"><span class="ct" data-ct="${k}"></span><button type="button" class="b i" data-auto="${k}" title="Otomatiğe / varsayılana döndür">↺</button></div></div>`; };
  const modeBox = dark => `<fieldset><legend>${dark ? "Gece modu" : "Gündüz modu"}</legend>
    <label>Arka plan türü<select name="${STYLE_KEYS[dark]}">${BGS.map(([a, b]) => `<option value="${a}" ${a === S[STYLE_KEYS[dark]] ? "selected" : ""}>${b}</option>`).join("")}</select></label>
    ${B.ROLE_GROUPS.map(([n, rs]) => `<h5>${n}</h5><div class="pal">${rs.map(r => crow(r, dark)).join("")}</div>`).join("")}
    <button type="button" class="b s" data-resetmode="${dark ? 1 : 0}">${dark ? "Gece" : "Gündüz"} paletini varsayılana döndür</button></fieldset>`;
  const palette = `<p class="hint">Her renk için sol kutudan seçin ya da kod yazın (örn. <b>#ce0304</b>). <b>otomatik</b> yazan renkler başka bir renkten türetilir; elle değiştirdiğiniz an sabitlenir, ↺ ile geri dönersiniz. Soldaki sayı yazı ile zemin arasındaki kontrasttır (4.5 ve üstü rahat okunur).</p>
    <fieldset><legend>Ortak</legend><label>Slider yazı rengi<span class="cw"><input type="color" name="color_hero" value="${B.hex(S.color_hero, "#ffffff")}"></span></label></fieldset>${modeBox(false)}${modeBox(true)}`;
  $("#m").innerHTML = `<div class="row"><h2 style="margin:0">Site Ayarları</h2><button class="b" id="save">Kaydet</button></div>
  <div class="tabs" role="tablist">${TABS.map(([id, t]) => `<button type="button" role="tab" data-tab="${id}" class="${id === stab ? "on" : ""}">${t}</button>`).join("")}</div>
  <div class="split"><form id="sf">${TABS.map(([id, , gs]) => `<div class="tab" data-t="${id}" ${id === stab ? "" : "hidden"}>${id === "renk" ? palette : gs.map(([n, fs]) => `<fieldset><legend>${n}</legend>${fs.map(fld).join("")}</fieldset>`).join("")}</div>`).join("")}</form>
  <aside class="pvbox"><h4 style="margin-top:0">Canlı önizleme</h4><div class="pvs">${[["pvl", "GÜNDÜZ MODU"], ["pvd", "GECE MODU"]].map(([id, t]) => `<div class="pvm" id="${id}"><span class="lb">${t}</span><div class="nv"><b>BBS AUTO</b><span>Hizmetler &nbsp; Ürünler</span></div><div class="hero">AKÜ VE ELEKTRİK</div><div class="hlb"><b>NELER YAPIYORUZ?</b><span class="bt2">RANDEVU AL</span></div><div class="in"><h3></h3><p></p><div class="c"><i>Kategori</i><b>Ürün adı</b><span>Kart açıklaması burada görünür.</span><strong>640 €</strong></div><span class="bt">BUTON</span></div><div class="ft">© BBS AUTO</div></div>`).join("")}</div><p class="hint">Değişiklikler burada anında görünür. Kaydedince tüm sitede uygulanır.</p></aside></div>`;

  const f = $("#sf");
  const vals = () => { const v = { ...S, ...Object.fromEntries(new FormData(f)) }; colorKeys.forEach(k => { if (!custom.has(k)) v[k] = ""; }); return v; };
  const pv = () => {
    const v = vals();
    ["font_head", "font_card", "font_hero", "font_btn", "font_body"].forEach(k => B.loadFont(v[k]));
    [["pvl", false], ["pvd", true]].forEach(([id, dark]) => {
      const el = $("#" + id), c = B.resolve(v, dark);
      Object.entries({ ...B.sizeVars(v), ...B.colorVars(v, dark, false) }).forEach(([k, x]) => el.style.setProperty(k, x));
      el.querySelector("h3").textContent = v.sec_svc_title || v.site_title;
      el.querySelector("p").textContent = v.tagline;
      // renk kutularını güncelle (özel olmayanlar türetilen değeri gösterir)
      f.querySelectorAll(`[data-color][data-dark="${dark ? 1 : 0}"]`).forEach(inp => {
        const r = inp.dataset.role, k = inp.dataset.color, val = c[r];
        if (document.activeElement !== inp) inp.value = val;
        const hx = f.querySelector(`[data-hex="${k}"]`); if (document.activeElement !== hx) hx.value = val;
        const row = inp.closest(".cr"); row.classList.toggle("auto", !custom.has(k));
        const ct = f.querySelector(`[data-ct="${k}"]`);
        if (B.PAIRS[r]) { const q = B.ratio(c[r], c[B.PAIRS[r]]); ct.textContent = q.toFixed(1); ct.className = "ct " + (q >= 4.5 ? "ok" : q >= 3 ? "mid" : "bad"); ct.title = "Zemin: " + B.ROLE_LABEL[B.PAIRS[r]]; } else { ct.textContent = ""; ct.className = "ct"; }
      });
    });
  };
  f.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.color) custom.add(t.dataset.color);
    if (t.dataset.hex) {
      const h = B.hex(t.value, null);
      if (h) { const ci = f.querySelector(`[data-color="${t.dataset.hex}"]`); ci.value = h; custom.add(t.dataset.hex); }
    }
    pv();
  });
  f.querySelectorAll("[data-auto]").forEach(b => b.onclick = () => { custom.delete(b.dataset.auto); pv(); });
  f.querySelectorAll("[data-resetmode]").forEach(b => b.onclick = () => {
    const d = b.dataset.resetmode === "1"; B.ROLES.forEach(r => custom.delete(B.key(r, d)));
    f.elements[STYLE_KEYS[d]].value = "solid"; pv(); toast("Palet varsayılana döndü, Kaydet'e basın");
  });
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    stab = b.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("on", x === b));
    f.querySelectorAll(".tab").forEach(t => t.hidden = t.dataset.t !== stab);
  });
  // kayıtlı renkleri kutulara yükle (yoksa tarayıcı #000000 ile başlatır ve kaydederken bozardı)
  colorKeys.forEach(k => { if (custom.has(k)) { f.elements[k].value = S[k]; f.querySelector(`[data-hex="${k}"]`).value = S[k]; } });
  pv(); upload(f);
  $("#save").onclick = async () => {
    const v = Object.fromEntries(new FormData(f));
    const rows = [...f.elements].filter(el => el.name).map(el => el.name).filter((k, i, a) => a.indexOf(k) === i)
      .map(k => ({ key: k, value: colorKeys.includes(k) ? (custom.has(k) ? B.hex(v[k], "") : "") : String(v[k] ?? "") }));
    const { error } = await db.from("settings").upsert(rows);
    error ? alert(error.message) : toast("Ayarlar kaydedildi");
  };
}
start();
