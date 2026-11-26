// Site ve panelin ortak yardımcıları: kaçış, renk paleti (gündüz/gece), yazı tipleri, Supabase yükleyici
window.BBS = (() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const DEF = {
    site_title: "BBS AUTO", tagline: "Oto servis ve yedek parça", logo_url: "", footer_text: "", announcement: "", currency: "€",
    logo_height: "36", logo_title: "1", social_place: "auto", card_gap: "8", sec_gap: "100", radius: "10", meta_desc: "", show_mbar: "1", news_detail: "button",
    show_hl: "1", show_svc: "1", show_prod: "1", show_news: "1", show_brands: "1", show_faq: "1", brands_bg: "white",
    sec_brands_title: "Hizmet Verdiğimiz Markalar", sec_brands_text: "Bu markaların servis ve yedek parça işlerini yapıyoruz.",
    sec_faq_title: "Sık Sorulan Sorular", sec_faq_text: "Aklınıza takılanların cevapları burada.",
    color_hero: "#ffffff", bg_style: "solid", dark_bg_style: "solid", auto_contrast: "0", custom_css: "",
    font_head: "Space Grotesk", font_card: "Space Grotesk", font_hero: "Space Grotesk", font_btn: "Space Grotesk", font_body: "Plus Jakarta Sans", font_size: "16", head_size: "100",
    svc_limit: "6", prod_limit: "4", news_limit: "4",
    sec_svc_title: "Hizmetlerimiz", sec_svc_text: "Atölyede en çok yaptığımız işler.",
    sec_prod_title: "Öne Çıkan Ürünler", sec_prod_text: "Detay, fiyat ve stok durumu. Satış mağazada, sipariş için arayın.",
    sec_news_title: "Haberler & Blog", sec_news_text: "Aracınızın ömrünü uzatan pratik bilgiler.",
    sec_contact_title: "Randevu / Mesaj", sec_find_title: "Bizi bulun",
    hl_title: "Neler yapıyoruz?", hl_text: "Yağ değişiminden motor onarımına, fren, lastik ve akü servisine kadar aracınızın ihtiyacı olan her işi tek çatı altında yapıyoruz. Önce arızayı gösterir, sonra onarırız.",
    hl_btn_text: "Randevu al", hl_btn_link: "#iletisim",
    stat1_num: "10+", stat1_label: "yıllık tecrübe", stat2_num: "5000+", stat2_label: "servis edilen araç", stat3_num: "100%", stat3_label: "şeffaf fiyat",
    phone: "", email: "", hours: "", address: "", map_lat: "", map_lng: "", whatsapp: "", facebook: "", instagram: "",
    lang_main: "tr", langs: "", lang_switcher: "1", share_pages: "1", visit_counter: "1",
    legal_name: "", legal_tax: "", legal_email: "", legal_updated: "", require_consent: "1", cookie_notice: "1",
    consent_label: "{link}'ni okudum, anladım.", review_consent_label: "Adımın ve yorumumun sitede yayınlanmasını kabul ediyorum; {link}'ni okudum.", kvkk_link_text: "KVKK Aydınlatma Metni",
    cookie_text: "Bu sitede reklam veya takip çerezi kullanılmaz; yalnızca tema ve dil tercihinizi hatırlayan zorunlu depolama vardır.",
    show_reviews: "1", reviews_open: "1", reviews_limit: "6", google_review_url: "", sec_rev_title: "Müşteri Yorumları", sec_rev_text: "Hizmet alan müşterilerimizin görüşleri."
  };

  // ---- RENK ROLLERİ ----
  // Her rol gündüz için "color_<rol>", gece için "dark_color_<rol>" anahtarıyla saklanır.
  // Panelde elle değiştirilmemiş roller "otomatik"tir: başka bir rolden türetilir (aşağıda).
  const ROLE_LABEL = {
    bg: "Sayfa arka planı", bg2: "Arka plan 2 (gradyan/radyal için)", alt: "Dönüşümlü bölüm zemini", line: "Çizgi ve kenarlık",
    text: "Genel yazı", mute: "Soluk yazı (alt yazılar)", heading: "Bölüm başlıkları",
    card: "Kart, popup, form zemini", ctext: "Kart yazısı", cmute: "Kart soluk yazı", cheading: "Kart başlığı", ccat: "Kart kategori rengi", cprice: "Kart fiyat rengi",
    primary: "Ana renk (buton, bant)", onprimary: "Buton / ana renk üstündeki yazı", accent: "Vurgu (bağlantı üzerine gelme, iletişim başlıkları)",
    hl_bg: "“Neler yapıyoruz” bandı zemini", hl_text: "“Neler yapıyoruz” bandı yazısı",
    nav_bg: "Menü çubuğu zemini", nav_text: "Menü çubuğu yazısı", top_bg: "Üst şerit zemini", top_text: "Üst şerit yazısı", foot_bg: "Alt bilgi zemini", foot_text: "Alt bilgi yazısı"
  };
  const ROLE_GROUPS = [
    ["Sayfa", ["bg", "bg2", "alt", "line", "text", "mute", "heading"]],
    ["Kartlar, popup ve formlar", ["card", "ctext", "cmute", "cheading", "ccat", "cprice"]],
    ["Ana renk ve vurgu", ["primary", "onprimary", "accent"]],
    ["Bantlar ve çubuklar", ["hl_bg", "hl_text", "nav_bg", "nav_text", "top_bg", "top_text", "foot_bg", "foot_text"]]
  ];
  const ROLES = ROLE_GROUPS.flatMap(g => g[1]);
  // yazı rolü -> üzerinde durduğu zemin rolü (kontrast ölçümü için)
  const PAIRS = { text: "bg", mute: "bg", heading: "bg", ctext: "card", cmute: "card", cheading: "card", ccat: "card", cprice: "card", accent: "bg", onprimary: "primary", hl_text: "hl_bg", nav_text: "nav_bg", top_text: "top_bg", foot_text: "foot_bg" };
  const BASE = {
    light: { bg: "#f4f5f7", bg2: "#e4e7ec", card: "#ffffff", text: "#15181e", heading: "#0d1015", primary: "#d4141b", onprimary: "#ffffff", top_bg: "#0d1015", top_text: "#e9ecf1", foot_bg: "#0d1015", foot_text: "#e9ecf1" },
    dark: { bg: "#0f1115", bg2: "#171a21", card: "#171a20", text: "#e9ecf1", heading: "#ffffff", primary: "#d4141b", onprimary: "#ffffff", top_bg: "#090a0d", top_text: "#e9ecf1", foot_bg: "#090a0d", foot_text: "#e9ecf1" }
  };
  const key = (r, dark) => (dark ? "dark_" : "") + "color_" + r;

  const hex = (v, d) => { v = String(v || "").trim(); if (/^[0-9a-f]{6}$/i.test(v)) v = "#" + v; return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d; };
  const num = (v, d, a, b) => { v = parseFloat(v); return isNaN(v) ? d : Math.min(b, Math.max(a, v)); };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = h => { const [r, g, b] = rgb(h).map(c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mix = (a, b, t) => "#" + rgb(a).map((c, i) => Math.round(c * (1 - t) + rgb(b)[i] * t).toString(16).padStart(2, "0")).join("");
  const rgba = (h, a) => `rgba(${rgb(h).join(",")},${a})`;
  // yalnızca "Otomatik okunabilirlik" açıkken kullanılır: rengi aynı tonda açar/koyulaştırır
  const tone = (c, bg, min) => {
    if (ratio(c, bg) >= min) return c;
    const to = lum(bg) < .4 ? "#ffffff" : "#000000";
    for (let t = .1; t <= 1.001; t += .1) { const x = mix(c, to, t); if (ratio(x, bg) >= min) return x; }
    return to;
  };

  // Ayarlardan (s) bir modun tüm renklerini çözer. Elle girilmemiş roller türetilir:
  //   mute/line/alt/ctext/cmute/cheading/ccat/cprice/accent/hl_*/nav_* -> bg, text, card, heading, primary'den
  const resolve = (s, dark) => {
    const D = BASE[dark ? "dark" : "light"], c = {};
    const own = r => {
      let v = hex(s[key(r, dark)], null);
      if (!v && dark && r === "primary") v = hex(s.color_primary, null); // eski tek ana renk ayarı
      return v;
    };
    ["bg", "bg2", "card", "text", "heading", "primary", "onprimary", "top_bg", "top_text", "foot_bg", "foot_text"].forEach(r => c[r] = own(r) || D[r]);
    c.mute = own("mute") || mix(c.text, c.bg, .38);
    c.line = own("line") || mix(c.text, c.bg, .82);
    c.alt = own("alt") || mix(c.bg, c.text, .05);
    c.ctext = own("ctext") || c.text;
    c.cmute = own("cmute") || mix(c.ctext, c.card, .38);
    c.cheading = own("cheading") || c.heading;
    const lift = dark ? mix(c.primary, "#ffffff", .22) : c.primary;
    c.ccat = own("ccat") || lift; c.cprice = own("cprice") || lift; c.accent = own("accent") || lift;
    c.hl_bg = own("hl_bg") || c.primary; c.hl_text = own("hl_text") || c.onprimary;
    c.nav_bg = own("nav_bg") || c.bg; c.nav_text = own("nav_text") || c.text;
    if (s.auto_contrast === "1") Object.entries(PAIRS).forEach(([f, b]) => { c[f] = tone(c[f], c[b], 4.5); });
    return c;
  };

  const stack = f => {
    f = /^[\w ]{2,40}$/.test(f || "") ? f : "system-ui";
    if (f === "system-ui") return "system-ui,'Segoe UI',Roboto,Arial,sans-serif";
    if (f === "Arial Narrow") return "'Arial Narrow','Barlow Condensed','Liberation Sans Narrow',Arial,sans-serif";
    return `'${f}',system-ui,'Segoe UI',Arial,sans-serif`;
  };
  const bgCSS = (c, style, fx) => style === "linear" ? `linear-gradient(160deg,${c.bg},${c.bg2})` : style === "radial" ? `radial-gradient(ellipse at 50% 0%,${c.bg2} 0%,${c.bg} 72%)${fx ? " fixed" : ""}` : c.bg;

  const colorVars = (s, dark, fx) => {
    const c = resolve(s, dark);
    return {
      "color-scheme": dark ? "dark" : "light",
      "--red": c.primary, "--on-red": c.onprimary, "--accent": c.accent, "--ccat": c.ccat, "--cprice": c.cprice,
      "--ink": c.text, "--hd": c.heading, "--mute": c.mute, "--cink": c.ctext, "--chd": c.cheading, "--cmute": c.cmute,
      "--paper": c.bg, "--bg": bgCSS(c, s[dark ? "dark_bg_style" : "bg_style"], fx), "--alt": c.alt, "--card": c.card, "--line": c.line,
      "--hl-bg": c.hl_bg, "--hl-text": c.hl_text, "--nav-bg": c.nav_bg, "--nav-text": c.nav_text,
      "--top-bg": c.top_bg, "--top-text": c.top_text, "--foot-bg": c.foot_bg, "--foot-text": c.foot_text
    };
  };
  const sizeVars = s => ({
    "--fh": stack(s.font_head), "--fc": stack(s.font_card || s.font_head), "--fhero": stack(s.font_hero || s.font_head), "--fbtn": stack(s.font_btn || s.font_head), "--fb": stack(s.font_body),
    "--fs": num(s.font_size, 16, 12, 24), "--hs": num(s.head_size, 100, 50, 200) / 100,
    "--r": num(s.radius, 10, 0, 28) + "px", "--cgap": num(s.card_gap, 8, 0, 40) + "px", "--sg": num(s.sec_gap, 100, 40, 200) / 100, "--logo-h": num(s.logo_height, 36, 20, 80) + "px",
    "--hero": hex(s.color_hero, DEF.color_hero)
  });
  const cssText = o => Object.entries(o).map(([k, v]) => k + ":" + v).join(";");

  const GF = ["Space Grotesk", "Plus Jakarta Sans", "Manrope", "Sora", "DM Sans", "Barlow Condensed", "Oswald", "Rajdhani", "Bebas Neue", "Montserrat", "Poppins", "Roboto", "Playfair Display"];
  const SYS = ["Arial Narrow", "Arial", "Georgia", "Impact", "Trebuchet MS", "Verdana", "system-ui"];
  const FONTS = [...SYS, ...GF].map(f => [f, f === "system-ui" ? "Sistem yazı tipi" : f]);
  const loadFont = f => {
    if (f === "Arial Narrow") f = "Barlow Condensed";
    if (!GF.includes(f) || document.querySelector(`link[data-f="${f}"]`)) return;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.f = f;
    l.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}${f === "Bebas Neue" ? "" : ":wght@400;600;700"}&display=swap`; document.head.appendChild(l);
  };

  const themeEl = () => {
    let el = document.getElementById("bbs-theme");
    if (!el) { el = document.createElement("style"); el.id = "bbs-theme"; document.head.appendChild(el); }
    return el;
  };
  const applyTheme = s => {
    ["font_head", "font_card", "font_hero", "font_btn", "font_body"].forEach(k => loadFont(s[k]));
    const css = `:root{${cssText({ ...sizeVars(s), ...colorVars(s, false, true) })}}\n[data-theme=dark]{${cssText(colorVars(s, true, true))}}\n${String(s.custom_css || "")}`;
    themeEl().textContent = css;
    try { localStorage.setItem("bbs_css", css); } catch (e) { }
  };
  // Ayarlar internetten gelene kadar son kaydedilen temayı göster (beyaz/siyah yanıp sönmeyi önler)
  if (document.body && document.body.dataset.page) {
    try { const c = localStorage.getItem("bbs_css"); if (c) themeEl().textContent = c; } catch (e) { }
  }

  // ---- İKONLAR (24x24, çizgi stili; rengi bulunduğu yerin yazı rengini alır) ----
  const ICONS = {
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    x: '<path d="M4 4l11.7 16H20L8.3 4H4z"/><path d="M4 20l6.8-6.8M20 4l-6.8 6.8"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M9.2 8.3c-.3.6-.2 1.5.7 2.9 1 1.5 2.4 2.7 3.9 3.2.8.3 1.4 0 1.7-.5l.3-.6-1.9-1-.7.8c-.9-.4-2.1-1.5-2.5-2.5l.8-.7-.9-1.9z"/>',
    telegram: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    pinterest: '<circle cx="12" cy="12" r="10"/><path d="M9.5 20.5l2-8"/><path d="M9.3 11.4c-.6-2.3 1-4.4 3.2-4.4 1.9 0 3 1.3 3 3 0 2.2-1.2 4.2-3 4.2-.9 0-1.6-.6-1.4-1.6"/>',
    snapchat: '<path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>',
    twitch: '<path d="M21 2H3v16h5v4l4-4h5l4-4V2z"/><path d="M11 11V7M16 11V7"/>',
    discord: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5z"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.3-1 7-.8 10 .9"/><path d="M7.5 12.8c2.7-.8 5.7-.5 8 .9"/><path d="M8 16c2-.5 4.2-.3 6 .6"/>',
    threads: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    drop: '<path d="M12 2.7s6 6.3 6 10.6a6 6 0 0 1-12 0C6 9 12 2.7 12 2.7z"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    engine: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    tire: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5"/>',
    battery: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M7 12h4M9 10v4"/>',
    bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    snow: '<path d="M12 2v20M4.9 7l14.2 10M19.1 7L4.9 17"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    route: '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.link}</svg>`;
  const ICON_LIST = [["facebook", "Facebook"], ["instagram", "Instagram"], ["x", "X (Twitter)"], ["youtube", "YouTube"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"], ["telegram", "Telegram"], ["linkedin", "LinkedIn"], ["pinterest", "Pinterest"], ["snapchat", "Snapchat"], ["twitch", "Twitch"], ["discord", "Discord"], ["spotify", "Spotify"], ["threads", "Threads"], ["mail", "E-posta"], ["phone", "Telefon"], ["globe", "Web sitesi"], ["pin", "Konum"], ["link", "Genel bağlantı"], ["custom", "Kendi görselim (yükle)"]];
  // sosyal medya bağlantısı: yalnızca http(s), mailto, tel
  const socUrl = u => /^(https?:\/\/|mailto:|tel:)[^\s'"<>\\]+$/i.test(u || "") ? u : "";


  // ---- ZENGİN İÇERİK: panelden girilen HTML'i güvenli hale getirir (yalnızca izin verilen etiketler) ----
  const OK_TAGS = new Set("p br strong b em i u s h2 h3 h4 ul ol li blockquote a img hr table thead tbody tr th td figure figcaption div span".split(" "));
  const DROP = new Set("script style iframe object embed link meta form input button textarea select svg math noscript template".split(" "));
  const okUrl = (u, img) => { u = String(u || "").trim(); return img ? (/^https?:\/\/[^\s'"<>\\]+$/i.test(u) ? u : "") : (/^(https?:\/\/|mailto:|tel:|#|(?!\/\/)[\w\-./?=%&#]+$)/i.test(u) ? u : ""); };
  const clean = html => {
    const doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1) return n.remove();
        const t = n.tagName.toLowerCase();
        if (DROP.has(t)) return n.remove();
        walk(n);
        if (!OK_TAGS.has(t)) { n.replaceWith(...n.childNodes); return; }
        const keep = {};
        if (t === "a") { const h = okUrl(n.getAttribute("href")); if (h) keep.href = h; if (/^https?:/i.test(h)) { keep.target = "_blank"; keep.rel = "noopener noreferrer"; } }
        if (t === "img") { const u = okUrl(n.getAttribute("src"), true); if (!u) return n.remove(); keep.src = u; keep.alt = n.getAttribute("alt") || ""; keep.loading = "lazy"; }
        if (t === "td" || t === "th") ["colspan", "rowspan"].forEach(a => { if (/^\d{1,2}$/.test(n.getAttribute(a) || "")) keep[a] = n.getAttribute(a); });
        const al = (n.getAttribute("style") || "").match(/text-align\s*:\s*(left|center|right|justify)/i); if (al) keep.style = "text-align:" + al[1].toLowerCase();
        [...n.attributes].forEach(a => n.removeAttribute(a.name));
        Object.entries(keep).forEach(([k, v]) => n.setAttribute(k, v));
      });
    };
    walk(doc.body);
    return doc.body.innerHTML.trim();
  };
  const isHtml = t => /<\/?[a-z][\s\S]*>/i.test(String(t || ""));
  const plainHtml = t => esc(t).split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join("");
  // düz yazı ya da HTML, hangisi kayıtlıysa güvenli HTML döndürür
  const rich = t => isHtml(t) ? clean(t) : plainHtml(t);
  const textOf = t => isHtml(t) ? (new DOMParser().parseFromString(clean(t), "text/html").body.textContent || "").replace(/\s+/g, " ").trim() : String(t || "").replace(/\s+/g, " ").trim();

  const loadLib = () => new Promise((ok, no) => {
    if (window.supabase) return ok();
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
    s.onload = ok; s.onerror = no; document.head.appendChild(s);
  });
  return { clean, rich, isHtml, textOf, esc, DEF, FONTS, ICONS, icon, ICON_LIST, socUrl, hex, num, stack, ratio, resolve, key, ROLES, ROLE_GROUPS, ROLE_LABEL, PAIRS, colorVars, sizeVars, loadFont, applyTheme, loadLib };
})();
