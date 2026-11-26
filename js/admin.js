const C = window.BBS_CONFIG, B = window.BBS, esc = B.esc, app = document.getElementById("app"), $ = s => document.querySelector(s);
if (!C.SUPABASE_URL) { app.innerHTML = "<p style='padding:2rem'>js/config.js içine Supabase bilgilerini girin.</p>"; throw 0; }
let db, cur = "dash";
const toast = m => { const t = document.createElement("div"); t.id = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };

const FL = { comment: "Yorum", title: "Başlık", text: "Açıklama", image_url: "Görsel", btn_text: "Buton yazısı", btn_link: "Buton bağlantısı", sort: "Sıra", active: "Yayında", label: "Menü adı", href: "Bağlantı", visible: "Görünür", slug: "Adres (örn: hakkimizda)", body: "İçerik", published: "Yayında", description: "Açıklama", category: "Kategori", price: "Fiyat", stock: "Stok durumu", featured: "Öne çıkan", author: "Yazar", excerpt: "Özet", name: "Ad", phone: "Telefon", email: "E-posta", message: "Mesaj", created_at: "Tarih", question: "Soru", answer: "Cevap", url: "Adres (https://... , e-posta veya telefon da olur)", icon: "İkon", icon_url: "Özel ikon görseli", in_nav: "Menüde / üst şeritte göster", in_footer: "Alt bilgide göster", logo_url: "Logo", sku: "Ürün kodu", rating: "Puan", reply: "Yanıtınız (sitede yorumun altında görünür)", consent: "KVKK onayı" };
const fixUrl = u => { u = (u || "").trim(); if (!u || /^(https?:\/\/|mailto:|tel:)/i.test(u)) return u; if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(u)) return "mailto:" + u; if (/^\+?[\d\s()-]{7,}$/.test(u)) return "tel:" + u.replace(/[\s()-]/g, ""); return "https://" + u.replace(/^\/+/, ""); };
const STOCK = [["var", "Stokta"], ["sinirli", "Sınırlı stok"], ["yok", "Tükendi"]];
// Yeni içerik türü eklemek için buraya bir satır eklemek yeterli
const T = {
  dash: { label: "Panel", i: "▦" },
  slides: { label: "Slider", i: "▭", order: 1, cols: ["image_url", "title", "btn_text", "active", "sort"], f: { title: "text", text: "area", image_url: "image", btn_text: "text", btn_link: "link", active: "check", sort: "number" } },
  menu: { label: "Menü", i: "☰", order: 1, cols: ["label", "href", "visible", "sort"], f: { label: "text", href: "link", visible: "check", sort: "number" } },
  pages: { label: "Sayfalar", i: "▤", cols: ["title", "slug", "published"], f: { title: "text", slug: "text", body: "rich", published: "check" }, pre: o => { o.slug = o.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""); } },
  services: { label: "Hizmetler", i: "⚙", order: 1, cols: ["title", "sort"], f: { title: "text", description: "area", sort: "number" } },
  products: { label: "Ürünler", i: "◫", cols: ["image_url", "title", "sku", "category", "price", "stock", "featured", "published"], f: { title: "text", sku: "text", category: "text", price: "number", stock: ["select", STOCK], description: "area", image_url: "gallery", featured: "check", published: "check" } },
  posts: { label: "Haberler / Blog", i: "✎", cols: ["image_url", "title", "category", "published"], f: { title: "text", category: "text", author: "text", excerpt: "area", body: "rich", image_url: "gallery", published: "check" } },
  reviews: { label: "Yorumlar", i: "☆", nonew: 1, cols: ["created_at", "name", "rating", "comment", "published"], show: ["name", "comment"], f: { reply: "area", published: "check" } },
  socials: { label: "Sosyal Medya", i: "◎", order: 1, req: ["name", "url"], cols: ["name", "icon", "url", "in_footer", "visible", "sort"], f: { name: "text", url: "text", icon: ["select", B.ICON_LIST], icon_url: "image", in_footer: "check", visible: "check", sort: "number" }, pre: o => { o.url = fixUrl(o.url); } },
  faq: { label: "Sık Sorulan Sorular", i: "?", order: 1, req: ["question"], cols: ["question", "visible", "sort"], f: { question: "text", answer: "area", visible: "check", sort: "number" } },
  brands: { label: "Markalar", i: "▣", order: 1, req: ["name"], cols: ["name", "logo_url", "visible", "sort"], f: { name: "text", logo_url: "image", url: "text", visible: "check", sort: "number" }, pre: o => { o.url = fixUrl(o.url); } },
  messages: { label: "Mesajlar", i: "✉", cols: ["created_at", "name", "phone", "email", "message", "consent"], f: null },
  notify: { label: "Bildirimler", i: "☏" },
  langs: { label: "Diller", i: "⚑" },
  security: { label: "Güvenlik", i: "◈" },
  settings: { label: "Site Ayarları", i: "★" }
};
const CNT = n => [4, 6, 8, 10, 12, 16, 20].map(x => [String(x), x + " " + n]);
const BGS = [["solid", "Düz renk"], ["linear", "Gradyan"], ["radial", "Radyal"]];
const SHOW = [["1", "Göster"], ["0", "Gizle"]];
// Görsel yükleme önerileri ve sınırları (w,h: bundan büyükse otomatik küçültülür; min: bundan küçükse uyarılır)
const SPEC = {
  "settings.logo_url": { w: 800, h: 300, min: [160, 40], ratio: [.6, 6], ratioMsg: "Logo çok uzun ya da çok dar; menüde küçük görünebilir. Yatay (3:1 civarı) logo önerilir.", max1mb: 1, hint: "Önerilen: yatay logo, yaklaşık 400×120 px (en az 160 px geniş), şeffaf PNG / SVG / WebP, en fazla 1 MB. Daha büyük görseller otomatik küçültülür. Menüdeki boyutu aşağıdaki «Logo yüksekliği» belirler; çok büyük logo bile siteyi bozmaz." },
  "brands.logo_url": { w: 600, h: 300, min: [100, 40], max1mb: 1, hint: "Önerilen: yaklaşık 300×150 px, şeffaf PNG / SVG. Kutuya sığacak şekilde küçültülerek gösterilir." },
  "socials.icon_url": { w: 256, h: 256, min: [32, 32], max1mb: 1, hint: "Önerilen: 64×64 px kare, şeffaf PNG / SVG. Yalnızca ikon listesinde «Kendi görselim» seçiliyse kullanılır." },
  "slides.image_url": { w: 2000, h: 1000, min: [1200, 400], hint: "Önerilen: 1920×800 px yatay fotoğraf (JPG / WebP). Büyük dosyalar otomatik küçültülür." },
  "products.image_url": { w: 1400, h: 1000, min: [480, 300], hint: "Birden fazla görsel seçebilirsiniz (en fazla 8). İlk görsel kartta görünür; ★ ile ana görseli değiştirin, ‹ › ile sıralayın. Önerilen: 1000×700 px. Büyük dosyalar otomatik küçültülür." },
  "posts.image_url": { w: 1600, h: 1100, min: [480, 300], hint: "Birden fazla görsel seçebilirsiniz (en fazla 8). İlk görsel kapak olur, diğerleri haber sayfasında galeri olarak görünür. Önerilen: 1200×750 px." }
};
// Sekmeler: [id, başlık, [[fieldset başlığı, alanlar]]]; "renk" sekmesi ayrıca özel çizilir. ["_", metin, "note"] açıklama satırıdır.
const TABS = [
  ["genel", "Genel", [["Site bilgileri", [["site_title", "Site başlığı", "text"], ["tagline", "Slogan", "text"], ["announcement", "Duyuru çubuğu (boşsa görünmez)", "text"], ["footer_text", "Alt bilgi yazısı", "text"], ["currency", "Para birimi (€, ₺, $)", "text"], ["meta_desc", "Arama sonuçlarında görünen açıklama (SEO, 150 karakter civarı)", "area"]]], ["Logo", [["logo_url", "Logo", "image"], ["logo_height", "Logo yüksekliği (px) — genişlik orantılı ayarlanır, en fazla 220 px", "range", [24, 72]], ["logo_title", "Logonun yanında site adı", "select", SHOW]]], ["Paylaşım ve istatistik", [["share_pages", "Ürün / haber paylaşılınca zengin önizleme (WhatsApp, Facebook, X)", "select", SHOW], ["visit_counter", "Çerezsiz ziyaretçi sayacı", "select", SHOW], ["_", "Zengin önizleme için GitHub'daki «Paylaşım sayfaları ve sitemap'i yenile» işi çalışmalıdır (6 saatte bir kendiliğinden; hemen yenilemek için Actions > Run workflow).", "note"]]]]],
  ["renk", "Renk paletleri", []],
  ["yazi", "Yazı, boyut ve boşluk", [["Yazı tipleri", [["font_head", "Bölüm başlıkları", "select", B.FONTS], ["font_card", "Kart, popup ve hizmet başlıkları (ürün adı, fiyat dahil)", "select", B.FONTS], ["font_hero", "Büyük başlıklar (slider, Neler yapıyoruz, sayılar)", "select", B.FONTS], ["font_btn", "Butonlar", "select", B.FONTS], ["font_body", "Genel metin", "select", B.FONTS]]], ["Boyut", [["font_size", "Genel boyut (px) — tüm site büyür/küçülür", "range", [13, 22]], ["head_size", "Başlık boyutu (%)", "range", [70, 140]], ["radius", "Köşe yuvarlaklığı (px) — kartlar, butonlar, pencereler", "range", [0, 28]]]], ["Boşluklar", [["card_gap", "Kartlarda başlık ile açıklama arası (px) — hizmet, ürün, haber kartları ve popup'lar", "range", [0, 24]], ["sec_gap", "Bölümler arası boşluk (%)", "range", [50, 150]]]]]],
  ["bolum", "Bölümler", [["Anasayfa bölümlerini aç / kapat", [["show_hl", "Neler yapıyoruz bandı", "select", SHOW], ["show_svc", "Hizmetler", "select", SHOW], ["show_prod", "Öne çıkan ürünler", "select", SHOW], ["show_news", "Haberler & Blog", "select", SHOW], ["show_brands", "Hizmet verdiğimiz markalar", "select", SHOW], ["show_faq", "Sık sorulan sorular", "select", SHOW], ["show_reviews", "Müşteri yorumları", "select", SHOW], ["show_mbar", "Telefonda alttaki hızlı Ara / WhatsApp çubuğu (tüm sayfalar)", "select", SHOW], ["_", "Markalar ve Sık sorulan sorular bölümleri, içlerine hiç kayıt eklemediğiniz sürece zaten görünmez. Kayıtları soldaki menüdeki «Markalar» ve «Sık Sorulan Sorular» bölümlerinden yönetirsiniz.", "note"]]], ["Kaç tane gösterilsin?", [["svc_limit", "Hizmet sayısı", "select", CNT("hizmet")], ["prod_limit", "Ürün sayısı", "select", CNT("ürün")], ["news_limit", "Haber sayısı", "select", CNT("haber")]]], ["Haberler", [["news_detail", "Haber kartına tıklanınca ne olsun?", "select", [["button", "Küçük pencere açılsın, içinde «Haberin tamamını oku» butonu olsun"], ["page", "Doğrudan haberin kendi sayfası açılsın"], ["popup", "Yalnızca küçük pencere açılsın (tüm yazı pencerede)"]]]]], ["Markalar", [["brands_bg", "Marka kutularının zemini", "select", [["white", "Beyaz kutu (logolar her modda net görünür)"], ["card", "Kart rengi"], ["none", "Kutu yok (saydam)"]]]]]]],
  ["metin", "Anasayfa metinleri", [["Bölüm başlıkları", [["sec_svc_title", "Hizmetler başlığı", "text"], ["sec_svc_text", "Hizmetler alt yazısı", "text"], ["sec_prod_title", "Ürünler başlığı", "text"], ["sec_prod_text", "Ürünler alt yazısı", "text"], ["sec_news_title", "Haberler başlığı", "text"], ["sec_news_text", "Haberler alt yazısı", "text"], ["sec_brands_title", "Markalar başlığı", "text"], ["sec_brands_text", "Markalar alt yazısı", "text"], ["sec_faq_title", "Sık sorulan sorular başlığı", "text"], ["sec_faq_text", "Sık sorulan sorular alt yazısı", "text"], ["sec_rev_title", "Yorumlar başlığı", "text"], ["sec_rev_text", "Yorumlar alt yazısı", "text"], ["sec_contact_title", "Mesaj formu başlığı", "text"], ["sec_find_title", "İletişim bilgisi başlığı", "text"]]], ["Neler yapıyoruz bandı", [["hl_title", "Başlık", "text"], ["hl_text", "Açıklama", "area"], ["hl_btn_text", "Buton yazısı", "text"], ["hl_btn_link", "Buton bağlantısı", "text"], ["stat1_num", "1. sayı (örn 10+)", "text"], ["stat1_label", "1. etiket", "text"], ["stat2_num", "2. sayı", "text"], ["stat2_label", "2. etiket", "text"], ["stat3_num", "3. sayı", "text"], ["stat3_label", "3. etiket", "text"]]]]],
  ["iletisim", "İletişim ve sosyal", [["İletişim ve harita", [["phone", "Telefon", "text"], ["email", "E-posta", "text"], ["hours", "Çalışma saatleri", "text"], ["address", "Adres", "area"], ["map_lat", "Enlem (Google Haritalar'da konuma sağ tıklayıp kopyalayın)", "text"], ["map_lng", "Boylam", "text"], ["whatsapp", "WhatsApp numarası (ülke koduyla, örn 905551112233)", "text"]]], ["Sosyal medya ikonları", [["_", "Hesapları eklemek, ikon seçmek, sıralamak ve kendi ikon görselinizi yüklemek için soldaki menüden «Sosyal Medya» bölümüne gidin. İkonlar sitenin en altındaki alt bilgi bölümünde görünür.", "note"]]]]],
  ["yorum", "Yorumlar", [["Müşteri yorumları", [["reviews_open", "Ziyaretçiler yorum yazabilsin", "select", SHOW], ["reviews_limit", "Anasayfada gösterilecek yorum sayısı", "select", CNT("yorum")], ["google_review_url", "Google yorum bağlantısı (boş bırakılırsa düğme görünmez)", "text"], ["_", "Yorumlar siz «Yorumlar» bölümünden onaylayana kadar yayınlanmaz. Gerçek müşterilerden yorum almak için hizmet sonrası onlara şu bağlantıyı WhatsApp'tan gönderin: alanadiniz.com/?yorum=1 (yorum penceresi kendiliğinden açılır).", "note"]]]]],
  ["yasal", "Yasal ve gizlilik", [["Firma bilgileri (KVKK, Gizlilik ve Çerez sayfalarına otomatik yazılır)", [["legal_name", "Ticari ünvan", "text"], ["legal_tax", "Vergi no / MERSİS no", "text"], ["legal_email", "KVKK başvuru e-postası (boşsa genel e-posta kullanılır)", "text"], ["legal_updated", "Metinlerde yazan «son güncelleme» tarihi", "text"], ["_", "Metinler «Sayfalar» bölümünde (kvkk, gizlilik, cerez) TASLAK olarak bekler. Bir avukata kontrol ettirin, sonra «Yayında» kutusunu işaretleyin. Yayınlanınca iletişim formundaki onay kutusunda ve alt bilgide bağlantı olarak görünürler.", "note"]]], ["Onay kutusu", [["require_consent", "İletişim ve yorum formunda onay kutusu", "select", [["1", "Göster ve işaretlemeden gönderilmesin"], ["0", "Gösterme"]]], ["kvkk_link_text", "Bağlantı yazısı", "text"], ["consent_label", "İletişim formu onay metni ({link} yerine bağlantı gelir)", "area"], ["review_consent_label", "Yorum formu onay metni", "area"]]], ["Çerez bildirimi", [["cookie_notice", "Küçük bilgilendirme çubuğu", "select", SHOW], ["cookie_text", "Bildirim metni", "area"]]]]],
  ["gelismis", "Gelişmiş", [["Gelişmiş", [["auto_contrast", "Otomatik okunabilirlik düzeltmesi", "select", [["0", "Kapalı — seçtiğim renkler aynen uygulansın"], ["1", "Açık — okunmayan yazı renkleri otomatik açılıp koyulaşsın"]]], ["custom_css", "Özel CSS (en son uygulanır, panel ayarlarının üstüne yazar)", "area"]]]]]
];
const STYLE_KEYS = { false: "bg_style", true: "dark_bg_style" };

const safeImg = u => /^https?:\/\/[^\s'"()<>\\]+$/.test(u || "") ? esc(u) : "";
const cell = (k, v) => v === true ? '<span class="bd on">Evet</span>' : v === false ? '<span class="bd">Hayır</span>'
  : k === "image_url" || k === "logo_url" ? (safeImg(String(v || "").split("\n")[0].trim()) ? `<img class="th" src="${safeImg(String(v).split("\n")[0].trim())}" alt="" loading="lazy">${String(v).split(/\n+/).filter(Boolean).length > 1 ? `<small class="hint">+${String(v).split(/\n+/).filter(Boolean).length - 1}</small>` : ""}` : "–")
  : k === "rating" ? `<span style="color:#f5a623;white-space:nowrap">${"★".repeat(+v || 0)}${"☆".repeat(5 - (+v || 0))}</span>`
  : k === "icon" ? esc((B.ICON_LIST.find(x => x[0] === v) || ["", v ?? ""])[1])
  : k === "created_at" ? (v ? new Date(v).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "")
  : k === "stock" ? (STOCK.find(s => s[0] === v) || ["", v ?? ""])[1]
  : k === "phone" && v ? `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ""))}">${esc(v)}</a>`
  : k === "email" && v ? `<a href="mailto:${esc(v)}">${esc(v)}</a>`
  : esc(String(v ?? "").slice(0, 90));

async function start() {
  try { await B.loadLib(); } catch (e) { app.textContent = "Supabase kütüphanesi yüklenemedi (internet bağlantısını kontrol edin)."; return; }
  db = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  (await db.auth.getSession()).data.session ? await window.BBS_X.gate(shell, login) : login();
}
function login() {
  app.innerHTML = `<form class="login"><img src="../image/bbslogo.png" alt=""><h2>Yönetici girişi</h2><p>BBS AUTO site yönetimi</p><label>E-posta<input name="e" type="email" required autocomplete="username"></label><label>Şifre<input name="p" type="password" required autocomplete="current-password"></label><button class="b">Giriş yap</button><small id="er" role="alert"></small></form>`;
  app.querySelector("form").onsubmit = async e => {
    e.preventDefault(); const btn = e.target.querySelector("button"); btn.disabled = true; $("#er").textContent = "";
    const { error } = await db.auth.signInWithPassword({ email: e.target.e.value.trim(), password: e.target.p.value });
    btn.disabled = false;
    error ? ($("#er").textContent = "E-posta ya da şifre hatalı.") : window.BBS_X.gate(shell, login);
  };
}
function shell() {
  app.innerHTML = `<div class="shell"><aside class="sb"><div class="logo"><img src="../image/bbslogo.png" alt=""><span>BBS <b>AUTO</b><small>Yönetim paneli</small></span></div>${Object.entries(T).map(([k, v]) => `<button data-k="${k}" class="${k === cur ? "on" : ""}"><span class="gi">${v.i}</span>${v.label}</button>${k === "dash" || k === "products" || k === "brands" || k === "messages" ? "<hr>" : ""}`).join("")}<hr><a href="../index.html" target="_blank" rel="noopener"><span class="gi">↗</span>Siteyi gör</a><button id="out"><span class="gi">⎋</span>Çıkış</button></aside><main id="m"></main></div><dialog id="dlg"></dialog>`;
  app.querySelectorAll("[data-k]").forEach(b => b.onclick = () => go(b.dataset.k));
  $("#out").onclick = async () => { await db.auth.signOut(); login(); };
  window.BBS_X?.afterShell?.();
  ({ dash, settings: settingsView, ...(window.BBS_VIEWS || {}) }[cur] || list)();
}
const go = k => { if (typeof onbeforeunload !== "undefined" && onbeforeunload && onbeforeunload() && !confirm("Kaydedilmemiş değişiklikler var. Yine de çıkılsın mı?")) return; onbeforeunload = null; onkeydown = null; cur = k; shell(); };

async function dash() {
  const ks = ["products", "posts", "services", "messages", "reviews", "slides", "pages", "socials", "faq", "brands"];
  const cs = await Promise.all(ks.map(k => db.from(k).select("*", { count: "exact", head: true }).then(r => r.count ?? "–")));
  const { data: ms } = await db.from("messages").select("*").order("created_at", { ascending: false }).limit(6);
  const h = new Date().getHours(), hi = h < 6 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
  $("#m").innerHTML = `<h2>${hi}</h2><div class="tiles">${ks.map((k, i) => `<div class="tile" data-go="${k}" tabindex="0" role="button"><b>${cs[i]}</b>${T[k].label}</div>`).join("")}</div>
  <div class="row"><span style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="b" data-go="products">+ Ürün ekle</button><button class="b" data-go="posts">+ Haber ekle</button><button class="b s" data-go="slides">Slider düzenle</button><button class="b s" data-go="settings">Site ayarları</button></span></div>
  <div class="card"><div class="row" style="margin-bottom:.4rem"><h3 style="margin:0">Son mesajlar</h3><button class="b s" data-go="messages">Tümünü gör</button></div><ul>${(ms || []).map(x => `<li class="msgi"><div class="mt"><b>${esc(x.name)}</b>${x.phone ? `<a href="tel:${esc(String(x.phone).replace(/[^\d+]/g, ""))}">${esc(x.phone)}</a>` : ""}${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : ""}<small>${x.created_at ? new Date(x.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : ""}</small></div><p>${esc(x.message)}</p></li>`).join("") || '<li class="empty">Henüz mesaj yok.</li>'}</ul></div>`;
  window.BBS_X?.dashExtra?.($("#m"));
  document.querySelectorAll("[data-go]").forEach(b => { b.onclick = () => go(b.dataset.go); b.onkeydown = e => { if (e.key === "Enter") go(b.dataset.go); }; });
}

async function list() {
  const t = T[cur];
  let q = db.from(cur).select("*"); q = t.order ? q.order("sort") : q.order("id", { ascending: false });
  const { data, error } = await q;
  if (error) { $("#m").innerHTML = `<h2>${t.label}</h2><div class="card">${esc(error.message)}<br>${["socials", "faq", "brands"].includes(cur) ? "supabase/schema-v3.sql" : "schema-v2.sql"} dosyasını Supabase SQL Editor'de çalıştırdınız mı?</div>`; return; }
  $("#m").innerHTML = `<div class="row"><h2 style="margin:0">${t.label} <small class="hint">${data.length} kayıt</small></h2><span style="display:flex;gap:.6rem"><input id="srch" placeholder="Ara..." style="width:200px" aria-label="Listede ara">${cur === "messages" ? '<button class="b s" id="csv">CSV indir</button>' : ""}${t.f && !t.nonew ? '<button class="b" id="new">+ Yeni ekle</button>' : ""}</span></div>
  <div class="tw"><table><thead><tr>${t.cols.map(c => `<th>${FL[c] || c}</th>`).join("")}<th></th></tr></thead><tbody>${data.map((r, i) => `<tr${cur === "messages" ? ` class="clk" data-r="${r.id}"` : ""}>${t.cols.map(c => `<td>${cell(c, r[c])}${cur === "messages" && c === "name" && !readSet().has(r.id) ? ' <span class="bd on new">Yeni</span>' : ""}</td>`).join("")}<td class="ac">${cur === "messages" ? '<button class="b s" type="button">Oku</button> ' : ""}${t.order ? `<button class="b i" data-m="${i},-1">▲</button> <button class="b i" data-m="${i},1">▼</button> ` : ""}${t.f ? `<button class="b s" data-e="${r.id}">Düzenle</button>` : ""}<button class="b g" data-d="${r.id}">Sil</button></td></tr>`).join("") || `<tr><td class="empty" colspan="${t.cols.length + 1}">Henüz kayıt yok.${t.f ? " «+ Yeni ekle» ile başlayın." : ""}</td></tr>`}</tbody></table></div>`;
  $("#srch").oninput = e => document.querySelectorAll("tbody tr").forEach(tr => tr.classList.toggle("hid", !tr.textContent.toLowerCase().includes(e.target.value.toLowerCase())));
  if (cur === "messages") $("#csv").onclick = () => {
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"', cols = ["created_at", "name", "phone", "email", "message", "consent"];
    const csv = "\ufeff" + [cols.map(c => FL[c]).map(q).join(";"), ...data.map(r => cols.map(c => q(r[c])).join(";"))].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "mesajlar-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (t.f && !t.nonew) $("#new").onclick = () => edit({ sort: (data.length + 1) * 10 });
  window.BBS_X?.afterList?.(cur, data);
  document.querySelectorAll("tr[data-r]").forEach(tr => tr.onclick = e => { if (e.target.closest("a, [data-d]")) return; const r = data.find(x => String(x.id) === tr.dataset.r); if (r) openMsg(r); });
  document.querySelectorAll("[data-e]").forEach(b => b.onclick = () => edit(data.find(r => String(r.id) === b.dataset.e)));
  document.querySelectorAll("[data-d]").forEach(b => b.onclick = async () => { if (confirm("Silinsin mi?")) { await db.from(cur).delete().eq("id", b.dataset.d); toast("Silindi"); list(); } });
  document.querySelectorAll("[data-m]").forEach(b => b.onclick = async () => {
    const [i, d] = b.dataset.m.split(",").map(Number), j = i + d; if (j < 0 || j >= data.length) return;
    const a = [...data]; [a[i], a[j]] = [a[j], a[i]];
    await Promise.all(a.map((r, k) => db.from(cur).update({ sort: (k + 1) * 10 }).eq("id", r.id))); list();
  });
}

// ---- görsel yükleme: boyut kontrolü, uyarı ve otomatik küçültme ----
const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB";
const loadImg = f => new Promise((ok, no) => { const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => { URL.revokeObjectURL(u); no(); }; im.src = u; });
async function prepare(f, spec) {
  const out = { blob: f, name: f.name, notes: [], warns: [] };
  if (!/^image\//.test(f.type)) { out.warns.push("Bu bir görsel dosyası değil."); return out; }
  if (/svg|gif/.test(f.type)) { out.notes.push(kb(f.size)); if (f.size > 1048576) out.warns.push(`Dosya ${kb(f.size)}; 1 MB altı önerilir.`); return out; }
  let im; try { im = await loadImg(f); } catch (e) { out.warns.push("Görsel okunamadı, olduğu gibi yüklendi."); return out; }
  const w = im.naturalWidth, h = im.naturalHeight; out.notes.push(`${w}×${h} px`);
  if (spec.min && (w < spec.min[0] || h < spec.min[1])) out.warns.push(`Görsel küçük (${w}×${h} px); bulanık görünebilir. En az ${spec.min[0]}×${spec.min[1]} px önerilir.`);
  if (spec.ratio && (w / h > spec.ratio[1] || w / h < spec.ratio[0])) out.warns.push(spec.ratioMsg);
  const k = Math.min(1, spec.w / w, spec.h / h);
  if (k < 1 || (f.type === "image/jpeg" && f.size > 1048576)) {
    const cw = Math.round(w * k), ch = Math.round(h * k), cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    cv.getContext("2d").drawImage(im, 0, 0, cw, ch);
    const type = f.type === "image/jpeg" ? "image/jpeg" : f.type === "image/webp" ? "image/webp" : "image/png";
    const blob = await new Promise(r => cv.toBlob(r, type, .88));
    if (blob && blob.size < f.size) { out.blob = blob; out.name = f.name.replace(/\.[^.]+$/, "") + { "image/jpeg": ".jpg", "image/webp": ".webp", "image/png": ".png" }[type]; out.notes.push(`${cw}×${ch} px'e küçültüldü (${kb(f.size)} → ${kb(blob.size)})`); }
  }
  if (spec.max1mb && out.blob.size > 1048576) out.warns.push(`Dosya ${kb(out.blob.size)}; 1 MB altı önerilir.`);
  return out;
}

async function putFile(f, spec) {
  const o = await prepare(f, spec);
  const p = Date.now() + "-" + Math.random().toString(36).slice(2, 6) + "-" + o.name.replace(/[^\w.-]/g, "_");
  const { error } = await db.storage.from("media").upload(p, o.blob, { contentType: o.blob.type || f.type });
  if (error) throw error;
  return { url: db.storage.from("media").getPublicUrl(p).data.publicUrl, o };
}
// ---- çoklu görsel: adresler image_url alanında satır satır saklanır (ilki ana görsel)
const MAXIMG = 8;
const galleryField = k => { const sp = SPEC[cur + "." + k]; return `<div class="gal" data-gal="${k}"><input type="hidden" name="${k}"><div class="gl"></div><input type="file" accept="image/*" multiple>${sp ? `<small class="hint">${sp.hint}</small>` : ""}<small class="up-st"></small></div>`; };
function gallery(root, row) {
  root.querySelectorAll(".gal").forEach(g => {
    const k = g.dataset.gal, hid = g.querySelector("input[type=hidden]"), box = g.querySelector(".gl"), st = g.querySelector(".up-st"), fi = g.querySelector("[type=file]");
    let list = String(row[k] || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
    const sync = () => {
      hid.value = list.join("\n");
      box.innerHTML = list.map((u, i) => `<div class="gt"><img src="${esc(u)}" alt=""><em>${i ? i + 1 : "Ana"}</em><div class="ga">${i ? `<button type="button" data-a="main" data-i="${i}" title="Ana görsel yap">★</button><button type="button" data-a="l" data-i="${i}" title="Sola al">‹</button>` : ""}${i < list.length - 1 ? `<button type="button" data-a="r" data-i="${i}" title="Sağa al">›</button>` : ""}<button type="button" data-a="x" data-i="${i}" title="Kaldır">×</button></div></div>`).join("") || '<p class="hint" style="margin:0">Henüz görsel yok.</p>';
    };
    box.onclick = e => {
      const b = e.target.closest("[data-a]"); if (!b) return; const i = +b.dataset.i, a = b.dataset.a;
      if (a === "x") list.splice(i, 1); else if (a === "main") list.unshift(...list.splice(i, 1)); else { const j = a === "l" ? i - 1 : i + 1;[list[i], list[j]] = [list[j], list[i]]; }
      sync();
    };
    fi.onchange = async () => {
      const files = [...fi.files].slice(0, Math.max(0, MAXIMG - list.length)), warns = []; if (!fi.files.length) return;
      if (!files.length) { st.textContent = `En fazla ${MAXIMG} görsel eklenebilir.`; st.className = "up-st warn"; fi.value = ""; return; }
      let n = 0;
      for (const f of files) {
        st.className = "up-st"; st.textContent = `Yükleniyor ${n + 1}/${files.length}…`;
        try { const r = await putFile(f, specFor(k)); list.push(r.url); n++; warns.push(...r.o.warns); sync(); } catch (err) { warns.push((f.name || "Görsel") + ": " + (err.message || "yüklenemedi")); }
      }
      fi.value = ""; st.textContent = `${n} görsel yüklendi.` + (warns.length ? "  ⚠ " + [...new Set(warns)].join(" ⚠ ") : ""); st.className = "up-st" + (warns.length ? " warn" : ""); toast(n ? "Görseller yüklendi" : "Yüklenemedi");
    };
    sync();
  });
}
// ---- metin editörü (kalın, başlık, liste, bağlantı, görsel...) ----
const RT = [["bold", "<b>K</b>", "Kalın"], ["italic", "<i>İ</i>", "İtalik"], ["underline", "<u>A</u>", "Altı çizili"], ["|"], ["formatBlock", "H2", "Büyük başlık", "h2"], ["formatBlock", "H3", "Alt başlık", "h3"], ["formatBlock", "¶", "Normal paragraf", "p"], ["|"], ["insertUnorderedList", "• Liste", "Madde işaretli liste"], ["insertOrderedList", "1. Liste", "Numaralı liste"], ["formatBlock", "❝", "Alıntı", "blockquote"], ["|"], ["justifyLeft", "⇤", "Sola yasla"], ["justifyCenter", "↔", "Ortala"], ["|"], ["createLink", "Bağlantı", "Seçili yazıya bağlantı ekle"], ["unlink", "Bağlantıyı kaldır", "Bağlantıyı kaldır"], ["image", "Görsel ekle", "Görsel yükle ve ekle"], ["insertHorizontalRule", "—", "Ayırıcı çizgi"], ["|"], ["removeFormat", "Biçimi temizle", "Seçili yazının biçimini temizle"], ["undo", "↶", "Geri al"], ["redo", "↷", "Yinele"]];
const richField = (k, v) => `<div class="re" data-re="${k}"><div class="rt" role="toolbar" aria-label="Biçimlendirme">${RT.map(([c, l, t, a]) => c === "|" ? '<i class="sep"></i>' : `<button type="button" data-c="${c}" ${a ? `data-arg="${a}"` : ""} title="${t}">${l}</button>`).join("")}</div><div class="rb" contenteditable="true" spellcheck="true">${B.rich(v)}</div><input type="hidden" name="${k}"><input type="file" accept="image/*" hidden data-rimg><small class="up-st"></small></div>`;
function editors(root) {
  try { document.execCommand("defaultParagraphSeparator", false, "p"); document.execCommand("styleWithCSS", false, false); } catch (e) { }
  root.querySelectorAll(".re").forEach(re => {
    const rb = re.querySelector(".rb"), tb = re.querySelector(".rt"), fi = re.querySelector("[data-rimg]"), st = re.querySelector(".up-st");
    let saved = null;
    const keep = () => { const sel = getSelection(); if (sel.rangeCount && rb.contains(sel.anchorNode)) saved = sel.getRangeAt(0).cloneRange(); };
    const back = () => { rb.focus(); if (saved) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(saved); } };
    ["keyup", "mouseup", "input"].forEach(ev => rb.addEventListener(ev, keep));
    tb.addEventListener("mousedown", e => { if (e.target.closest("button")) e.preventDefault(); });
    tb.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return; const c = b.dataset.c; back();
      if (c === "createLink") { let u = prompt("Bağlantı adresi (https://..., telefon, e-posta veya sayfa.html?s=hakkimizda):"); if (!u) return; u = /^(#|[\w-]+\.html)/.test(u.trim()) ? u.trim() : fixUrl(u); back(); document.execCommand("createLink", false, u); }
      else if (c === "image") fi.click();
      else if (c === "formatBlock") document.execCommand(c, false, "<" + b.dataset.arg + ">");
      else document.execCommand(c, false, null);
      keep();
    });
    fi.onchange = async () => {
      const f = fi.files[0]; if (!f) return; st.className = "up-st"; st.textContent = "Görsel yükleniyor…";
      try { const r = await putFile(f, { w: 1600, h: 1600 }); back(); document.execCommand("insertImage", false, r.url); st.textContent = "Görsel eklendi." + (r.o.warns.length ? "  ⚠ " + r.o.warns.join(" ⚠ ") : ""); if (r.o.warns.length) st.className = "up-st warn"; }
      catch (err) { st.textContent = "Yüklenemedi: " + (err.message || ""); st.className = "up-st warn"; }
      fi.value = "";
    };
    // yapıştırınca bozuk biçimleri (Word vb.) temizle
    rb.addEventListener("paste", e => { e.preventDefault(); const h = e.clipboardData.getData("text/html"), t = e.clipboardData.getData("text/plain"); document.execCommand("insertHTML", false, h ? B.clean(h) : B.rich(t)); });
  });
}
const readSet = () => { try { return new Set(JSON.parse(localStorage.getItem("bbs_read") || "[]")); } catch (e) { return new Set(); } };
const markRead = id => { const r = readSet(); r.add(id); try { localStorage.setItem("bbs_read", JSON.stringify([...r].slice(-500))); } catch (e) { } };
const waNum = p => { let d = String(p || "").replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); else if (d.startsWith("0")) d = "90" + d.slice(1); return d; };
function openMsg(r) {
  const d = $("#dlg"), m = String(r.message || "").match(/^\[Konu: ([^\]]+)\]\s*/), topic = m ? m[1] : "", body = m ? r.message.slice(m[0].length) : (r.message || ""), tel = String(r.phone || "").replace(/[^\d+]/g, "");
  d.style.width = "";
  d.innerHTML = `<form method="dialog"><h3 style="margin:0">${esc(r.name)}</h3><div class="msgmeta">${r.created_at ? new Date(r.created_at).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" }) : ""}${topic ? ` <span class="bd on">Konu: ${esc(topic)}</span>` : ""}</div><div class="mbody">${esc(body)}</div><div class="macts">${r.phone ? `<a class="b" href="tel:${esc(tel)}">Ara: ${esc(r.phone)}</a><a class="b s" target="_blank" rel="noopener" href="https://wa.me/${waNum(r.phone)}">WhatsApp</a>` : ""}${r.email ? `<a class="b s" href="mailto:${esc(r.email)}">E-posta gönder</a>` : ""}<button type="button" class="b s" id="cp">Mesajı kopyala</button><button class="b s">Kapat</button></div></form>`;
  d.showModal(); $("#cp").onclick = () => navigator.clipboard?.writeText(body).then(() => toast("Kopyalandı"));
  markRead(r.id); document.querySelectorAll(`tr[data-r="${r.id}"] .new`).forEach(x => x.remove());
}

const specFor = k => SPEC[cur + "." + k] || { w: 1600, h: 1600 };
function upload(root) {
  root.querySelectorAll("[data-up]").forEach(i => i.onchange = async () => {
    const f = i.files[0]; if (!f) return;
    const key = i.dataset.up, st = root.querySelector(`[data-st="${key}"]`), setSt = (t, warn) => { if (st) { st.textContent = t; st.className = "up-st" + (warn ? " warn" : ""); } };
    setSt("İşleniyor…");
    const o = await prepare(f, specFor(key));
    const p = Date.now() + "-" + o.name.replace(/[^\w.-]/g, "_");
    const { error } = await db.storage.from("media").upload(p, o.blob, { contentType: o.blob.type || f.type });
    if (error) { setSt("Yüklenemedi: " + error.message, true); return alert(error.message); }
    const el = root.querySelector(`[name=${key}]`); el.value = db.storage.from("media").getPublicUrl(p).data.publicUrl; el.dispatchEvent(new Event("input", { bubbles: true }));
    setSt("Yüklendi: " + o.notes.join(" · ") + (o.warns.length ? "  ⚠ " + o.warns.join(" ⚠ ") : ""), o.warns.length);
    toast(o.warns.length ? "Yüklendi, uyarıya bakın" : "Görsel yüklendi");
  });
}
const imgField = (k, v, ph) => { const sp = SPEC[cur + "." + k]; return `<input name="${k}" value="${esc(v)}" placeholder="${ph}"><input type="file" accept="image/*" data-up="${k}">${sp ? `<small class="hint">${sp.hint}</small>` : ""}<small class="up-st" data-st="${k}"></small>`; };
async function edit(row) {
  const t = T[cur], isNew = row.id == null, d = $("#dlg");
  const links = ["#neler", "#hizmetler", "hizmetler.html", "urunler.html", "#haberler", "haberler.html", "#iletisim"];
  if (Object.values(t.f).includes("link")) ((await db.from("pages").select("slug")).data || []).forEach(p => links.push("sayfa.html?s=" + p.slug));
  const input = (k, spec) => {
    const [ty, opt] = [].concat(spec), v = row[k], rq = t.req?.includes(k) ? "required" : "";
    return ty === "rich" ? richField(k, v) : ty === "gallery" ? galleryField(k)
      : ty === "area" ? `<textarea name="${k}" rows="5" ${rq}>${esc(v)}</textarea>`
      : ty === "check" ? `<input type="checkbox" name="${k}" ${v === false ? "" : "checked"}>`
      : ty === "select" ? (k === "icon" ? '<span class="icrow">' : "") + `<select name="${k}">${opt.map(([a, b]) => `<option value="${a}" ${a === (v ?? opt[0][0]) ? "selected" : ""}>${b}</option>`).join("")}</select>` + (k === "icon" ? '<span class="icprev" id="icprev"></span></span>' : "")
      : ty === "image" ? imgField(k, v, "https://... veya aşağıdan yükleyin")
      : ty === "link" ? `<input name="${k}" value="${esc(v)}" list="lk">`
      : `<input name="${k}" type="${ty}" value="${esc(v)}" step="any" ${rq} ${k === "url" ? 'placeholder="https://..."' : ""}>`;
  };
  d.innerHTML = `<form><h3 style="margin:0">${t.label}: ${isNew ? "Yeni kayıt" : "Düzenle"}</h3>${t.show ? `<div class="mbody">${t.show.map(k => esc(row[k] ?? "")).join("\n")}</div>` : ""}<datalist id="lk">${links.map(l => `<option value="${l}">`).join("")}</datalist>${Object.entries(t.f).map(([k, s]) => /^(rich|gallery)$/.test([].concat(s)[0]) ? `<div class="fl"><span class="fl-t">${FL[k] || k}</span>${input(k, s)}</div>` : `<label>${FL[k] || k}${input(k, s)}</label>`).join("")}<div class="row" style="margin:0"><button type="button" class="b s" id="cx">Vazgeç</button><button class="b">Kaydet</button></div></form>`;
  d.style.width = Object.values(t.f).includes("rich") ? "min(920px,96vw)" : "";
  d.showModal(); upload(d); gallery(d, row); editors(d); $("#cx").onclick = () => d.close();
  if (cur === "socials") {
    const sel = d.querySelector("[name=icon]"), iu = d.querySelector("[name=icon_url]"), lab = iu.closest("label"), pvw = $("#icprev");
    const sync = () => { lab.hidden = sel.value !== "custom"; pvw.innerHTML = sel.value === "custom" && /^https?:/.test(iu.value) ? `<img src="${esc(iu.value)}" alt="">` : B.icon(sel.value === "custom" ? "link" : sel.value); };
    sel.onchange = sync; iu.addEventListener("input", sync); sync();
  }
  d.querySelector("form").onsubmit = async e => {
    e.preventDefault(); const o = {};
    d.querySelectorAll(".re").forEach(re => { const rb = re.querySelector(".rb"); re.querySelector("input[type=hidden]").value = (rb.textContent.trim() || rb.querySelector("img,hr")) ? B.clean(rb.innerHTML) : ""; });
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
    const fld = ([k, l, ty, o]) => ty === "note" ? `<p class="hint">${l}</p>` : `<label>${l}${ty === "range" ? `<input type="range" name="${k}" min="${o[0]}" max="${o[1]}" value="${S[k]}">`
    : ty === "select" ? `<select name="${k}">${o.map(([a, b]) => `<option value="${a}" ${a === String(S[k]) ? "selected" : ""}>${b}</option>`).join("")}</select>`
    : ty === "area" ? `<textarea name="${k}" rows="${k === "custom_css" ? 8 : 3}" ${k === "custom_css" ? 'spellcheck="false" placeholder=".pc h3 { letter-spacing: 0; }"' : ""}>${esc(S[k])}</textarea>`
    : ty === "image" ? imgField(k, S[k], "Boşsa varsayılan logo")
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
      const nb = el.querySelector(".nv b"); nb.textContent = "";
      if (/^https?:\/\/[^\s'"()<>\\]+$/.test(v.logo_url || "")) { const im = document.createElement("img"); im.src = v.logo_url; im.alt = ""; nb.appendChild(im); }
      if (v.logo_title !== "0" || !nb.firstChild) nb.append(v.site_title);
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
  let dirty = false; const mark = () => { if (!dirty) { dirty = true; const h = $("#m h2"); if (h && !$("#dirty")) h.insertAdjacentHTML("afterend", '<span class="dirty" id="dirty">● Kaydedilmemiş değişiklik</span>'); } };
  f.addEventListener("input", mark); f.addEventListener("change", mark);
  onbeforeunload = () => dirty ? "Kaydedilmemiş değişiklikler var." : null;
  onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && $("#save")) { e.preventDefault(); $("#save").click(); } };
  $("#save").onclick = async () => {
    const v = Object.fromEntries(new FormData(f));
    const rows = [...f.elements].filter(el => el.name).map(el => el.name).filter((k, i, a) => a.indexOf(k) === i)
      .map(k => ({ key: k, value: colorKeys.includes(k) ? (custom.has(k) ? B.hex(v[k], "") : "") : String(v[k] ?? "") }));
    const { error } = await db.from("settings").upsert(rows);
    if (error) return alert(error.message); dirty = false; $("#dirty")?.remove(); toast("Ayarlar kaydedildi");
  };
}
document.addEventListener("DOMContentLoaded", () => start());
