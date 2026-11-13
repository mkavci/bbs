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
const HINT = "Okunmayan bir renk seçerseniz site o alanı otomatik olarak okunur bir renge çevirir.";
// [başlık, alanlar, sıfırlanabilir mi, açıklama]
const G = [
  ["Genel", [["site_title", "Site başlığı", "text"], ["tagline", "Slogan", "text"], ["logo_url", "Logo", "image"], ["announcement", "Duyuru çubuğu (boşsa görünmez)", "text"], ["footer_text", "Alt bilgi yazısı", "text"], ["currency", "Para birimi (€, ₺, $)", "text"]]],
  ["Ortak renkler", [["color_primary", "Ana renk (buton, kırmızı alan, vurgular)", "color"], ["color_hero", "Slider yazı rengi", "color"]], true],
  ["Gündüz modu", [["bg_style", "Arka plan türü", "select", BGS], ["color_bg", "Arka plan rengi 1", "color"], ["color_bg2", "Arka plan rengi 2 (gradyan/radyal)", "color"], ["color_card", "Kart ve popup arka planı", "color"], ["color_text", "Yazı rengi", "color"], ["color_heading", "Başlık rengi", "color"]], true, HINT],
  ["Gece modu", [["dark_bg_style", "Arka plan türü", "select", BGS], ["dark_color_bg", "Arka plan rengi 1", "color"], ["dark_color_bg2", "Arka plan rengi 2 (gradyan/radyal)", "color"], ["dark_color_card", "Kart ve popup arka planı", "color"], ["dark_color_text", "Yazı rengi", "color"], ["dark_color_heading", "Başlık rengi", "color"]], true, HINT],
  ["Yazı tipi ve boyut", [["font_head", "Başlık yazı tipi (bölüm ve kart başlıkları)", "select", B.FONTS], ["font_hero", "Büyük başlık yazı tipi (slider, Neler yapıyoruz)", "select", B.FONTS], ["font_body", "Metin yazı tipi", "select", B.FONTS], ["font_size", "Genel boyut (px) — her şeyi büyütür/küçültür", "range", [13, 22]], ["head_size", "Başlık boyutu (%)", "range", [70, 140]]], true],
  ["Anasayfa bölümleri", [["svc_limit", "Anasayfada gösterilecek hizmet sayısı", "select", CNT("hizmet")], ["prod_limit", "Anasayfada gösterilecek ürün sayısı", "select", CNT("ürün")], ["news_limit", "Anasayfada gösterilecek haber sayısı", "select", CNT("haber")], ["sec_svc_title", "Hizmetler başlığı", "text"], ["sec_svc_text", "Hizmetler alt yazısı", "text"], ["sec_prod_title", "Ürünler başlığı", "text"], ["sec_prod_text", "Ürünler alt yazısı", "text"], ["sec_news_title", "Haberler başlığı", "text"], ["sec_news_text", "Haberler alt yazısı", "text"], ["sec_contact_title", "Mesaj formu başlığı", "text"], ["sec_find_title", "İletişim bilgisi başlığı", "text"]]],
  ["Anasayfa: Neler yapıyoruz", [["hl_title", "Başlık", "text"], ["hl_text", "Açıklama", "area"], ["hl_btn_text", "Buton yazısı", "text"], ["hl_btn_link", "Buton bağlantısı", "text"], ["stat1_num", "1. sayı (örn 10+)", "text"], ["stat1_label", "1. etiket", "text"], ["stat2_num", "2. sayı", "text"], ["stat2_label", "2. etiket", "text"], ["stat3_num", "3. sayı", "text"], ["stat3_label", "3. etiket", "text"]]],
  ["İletişim ve harita", [["phone", "Telefon", "text"], ["email", "E-posta", "text"], ["hours", "Çalışma saatleri", "text"], ["address", "Adres", "area"], ["map_lat", "Enlem (Google Haritalar'da konuma sağ tıklayıp kopyalayın)", "text"], ["map_lng", "Boylam", "text"], ["whatsapp", "WhatsApp numarası (ülke koduyla, örn 905551112233)", "text"]]],
  ["Sosyal medya", [["facebook", "Facebook adresi (https://...)", "text"], ["instagram", "Instagram adresi (https://...)", "text"]]]
];
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

async function settingsView() {
  const { data } = await db.from("settings").select("*");
  const S = { ...B.DEF, ...Object.fromEntries((data || []).filter(r => r.value).map(r => [r.key, r.value])) };
  const fld = ([k, l, ty, o]) => `<label>${l}${ty === "color" ? `<input type="color" name="${k}" value="${B.hex(S[k], B.hex(B.DEF[k], "#000000"))}">`
    : ty === "range" ? `<input type="range" name="${k}" min="${o[0]}" max="${o[1]}" value="${S[k]}">`
    : ty === "select" ? `<select name="${k}">${o.map(([a, b]) => `<option value="${a}" ${a === String(S[k]) ? "selected" : ""}>${b}</option>`).join("")}</select>`
    : ty === "area" ? `<textarea name="${k}" rows="3">${esc(S[k])}</textarea>`
    : ty === "image" ? `<input name="${k}" value="${esc(S[k])}" placeholder="Boşsa varsayılan logo"><input type="file" accept="image/*" data-up="${k}">`
    : `<input name="${k}" value="${esc(S[k])}">`}</label>`;
  const grp = ([n, fs, rs, hint], gi) => `<fieldset><legend>${n}</legend>${hint ? `<p class="hint">${hint}</p>` : ""}${fs.map(fld).join("")}${rs ? `<button type="button" class="b s" data-reset="${gi}">Bu bölümü varsayılana döndür</button>` : ""}</fieldset>`;
  $("#m").innerHTML = `<div class="row"><h2 style="margin:0">Site Ayarları</h2><button class="b" id="save">Kaydet</button></div><div class="split"><form id="sf">${G.map(grp).join("")}</form><aside class="pvbox"><h4 style="margin-top:0">Canlı önizleme</h4><div class="pvs">${[["pvl", "GÜNDÜZ MODU"], ["pvd", "GECE MODU"]].map(([id, t]) => `<div class="pvm" id="${id}"><span class="lb">${t}</span><div class="hero">AKÜ VE ELEKTRİK</div><div class="in"><h3></h3><p></p><div class="c"><i>Bakım</i><b>Lastik bakımı</b><span>Yazar: Ahmet Usta · 640 €</span></div><span class="bt">RANDEVU AL</span></div></div>`).join("")}</div><p class="hint">Renk, yazı tipi ve boyut değişimleri burada anında görünür. Kaydedince tüm sitede uygulanır.</p></aside></div>`;
  const f = $("#sf"), pv = () => {
    const v = { ...S, ...Object.fromEntries(new FormData(f)) };
    B.loadFont(v.font_head); B.loadFont(v.font_hero); B.loadFont(v.font_body);
    [["pvl", false], ["pvd", true]].forEach(([id, dark]) => {
      const el = $("#" + id);
      Object.entries({ ...B.sizeVars(v), ...B.colorVars(v, dark, false) }).forEach(([k, x]) => el.style.setProperty(k, x));
      el.querySelector("h3").textContent = v.sec_svc_title || v.site_title;
      el.querySelector("p").textContent = v.tagline;
    });
  };
  f.addEventListener("input", pv); pv(); upload(f);
  f.querySelectorAll("[data-reset]").forEach(b => b.onclick = () => {
    G[b.dataset.reset][1].forEach(([k]) => { const el = f.elements[k]; if (el) el.value = B.DEF[k]; });
    pv(); toast("Varsayılana döndü, Kaydet'e basın");
  });
  $("#save").onclick = async () => {
    const v = Object.fromEntries(new FormData(f)), rows = G.flatMap(([, fs]) => fs).map(([k]) => ({ key: k, value: String(v[k] ?? "") }));
    const { error } = await db.from("settings").upsert(rows);
    error ? alert(error.message) : toast("Ayarlar kaydedildi");
  };
}
start();
