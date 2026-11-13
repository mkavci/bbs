// Site ve panelin ortak yardımcıları: kaçış, renk paleti (gündüz/gece), yazı tipleri, Supabase yükleyici
window.BBS = (() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const DEF = {
    site_title: "BBS AUTO", tagline: "Oto servis ve yedek parça", logo_url: "", footer_text: "", announcement: "", currency: "€",
    color_hero: "#ffffff", bg_style: "solid", dark_bg_style: "solid", auto_contrast: "0", custom_css: "",
    font_head: "Arial Narrow", font_card: "Arial Narrow", font_hero: "Arial Narrow", font_btn: "Arial Narrow", font_body: "system-ui", font_size: "16", head_size: "100",
    svc_limit: "6", prod_limit: "4", news_limit: "4",
    sec_svc_title: "Hizmetlerimiz", sec_svc_text: "Atölyede en çok yaptığımız işler.",
    sec_prod_title: "Öne Çıkan Ürünler", sec_prod_text: "Detay, fiyat ve stok durumu. Satış mağazada, sipariş için arayın.",
    sec_news_title: "Haberler & Blog", sec_news_text: "Aracınızın ömrünü uzatan pratik bilgiler.",
    sec_contact_title: "Randevu / Mesaj", sec_find_title: "Bizi bulun",
    hl_title: "Neler yapıyoruz?", hl_text: "Yağ değişiminden motor onarımına, fren, lastik ve akü servisine kadar aracınızın ihtiyacı olan her işi tek çatı altında yapıyoruz. Önce arızayı gösterir, sonra onarırız.",
    hl_btn_text: "RANDEVU AL", hl_btn_link: "#iletisim",
    stat1_num: "10+", stat1_label: "yıllık tecrübe", stat2_num: "5000+", stat2_label: "servis edilen araç", stat3_num: "100%", stat3_label: "şeffaf fiyat",
    phone: "", email: "", hours: "", address: "", map_lat: "", map_lng: "", whatsapp: "", facebook: "", instagram: ""
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
    light: { bg: "#f3f2ef", bg2: "#e2ded6", card: "#ffffff", text: "#17191e", heading: "#17191e", primary: "#ce0304", onprimary: "#ffffff", top_bg: "#17191e", top_text: "#f1efeb", foot_bg: "#17191e", foot_text: "#f1efeb" },
    dark: { bg: "#14161a", bg2: "#1d2026", card: "#1c1f25", text: "#f1efeb", heading: "#ffffff", primary: "#ce0304", onprimary: "#ffffff", top_bg: "#0c0d10", top_text: "#f1efeb", foot_bg: "#0c0d10", foot_text: "#f1efeb" }
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
    c.ccat = own("ccat") || c.primary; c.cprice = own("cprice") || c.primary; c.accent = own("accent") || c.primary;
    c.hl_bg = own("hl_bg") || c.primary; c.hl_text = own("hl_text") || c.onprimary;
    c.nav_bg = own("nav_bg") || c.bg; c.nav_text = own("nav_text") || c.text;
    if (s.auto_contrast === "1") Object.entries(PAIRS).forEach(([f, b]) => { c[f] = tone(c[f], c[b], 4.5); });
    return c;
  };

  const stack = f => {
    f = /^[\w ]{2,40}$/.test(f || "") ? f : "system-ui";
    if (f === "system-ui") return "system-ui,'Segoe UI',Roboto,Arial,sans-serif";
    if (f === "Arial Narrow") return "'Arial Narrow','Barlow Condensed','Liberation Sans Narrow',Arial,sans-serif";
    return `'${f}',sans-serif`;
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
    "--hero": hex(s.color_hero, DEF.color_hero)
  });
  const cssText = o => Object.entries(o).map(([k, v]) => k + ":" + v).join(";");

  const GF = ["Barlow Condensed", "Oswald", "Rajdhani", "Bebas Neue", "Montserrat", "Poppins", "Roboto", "Playfair Display"];
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

  const loadLib = () => new Promise((ok, no) => {
    if (window.supabase) return ok();
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
    s.onload = ok; s.onerror = no; document.head.appendChild(s);
  });
  return { esc, DEF, FONTS, hex, num, stack, ratio, resolve, key, ROLES, ROLE_GROUPS, ROLE_LABEL, PAIRS, colorVars, sizeVars, loadFont, applyTheme, loadLib };
})();
