// Site ve panelin ortak yardımcıları: kaçış, tema (gündüz/gece renkleri, font, arka plan), Supabase yükleyici
window.BBS = (() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const DEF = {
    site_title: "BBS AUTO", tagline: "Oto servis ve yedek parça", logo_url: "", footer_text: "", announcement: "", currency: "€",
    // ortak renkler
    color_primary: "#ce0304", color_hero: "#ffffff",
    // gündüz modu
    bg_style: "solid", color_bg: "#f3f2ef", color_bg2: "#e2ded6", color_card: "#ffffff", color_text: "#17191e", color_heading: "#17191e",
    // gece modu
    dark_bg_style: "solid", dark_color_bg: "#14161a", dark_color_bg2: "#1d2026", dark_color_card: "#1c1f25", dark_color_text: "#f1efeb", dark_color_heading: "#ffffff",
    // yazı
    font_head: "Arial Narrow", font_hero: "Arial Narrow", font_body: "system-ui", font_size: "16", head_size: "100",
    // anasayfa bölümleri
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

  const GF = ["Barlow Condensed", "Oswald", "Rajdhani", "Bebas Neue", "Montserrat", "Poppins", "Roboto", "Playfair Display"];
  const SYS = ["Arial Narrow", "Arial", "Georgia", "Impact", "Trebuchet MS", "Verdana", "system-ui"];
  const FONTS = [...SYS, ...GF].map(f => [f, f === "system-ui" ? "Sistem yazı tipi" : f]);

  // ---- renk yardımcıları ----
  const hex = (v, d) => /^#[0-9a-f]{6}$/i.test(v || "") ? v.toLowerCase() : d;
  const num = (v, d, a, b) => { v = parseFloat(v); return isNaN(v) ? d : Math.min(b, Math.max(a, v)); };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = h => { const [r, g, b] = rgb(h).map(c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  // Seçilen yazı rengi zemin üzerinde okunmuyorsa otomatik olarak beyaz/siyaha çevirir
  const readable = (fg, bg, min = 4.5) => ratio(fg, bg) >= min ? fg : (ratio("#ffffff", bg) >= ratio("#111111", bg) ? "#ffffff" : "#111111");
  // Ana renk zeminde yeterince okunmuyorsa (özellikle koyu zeminde) rengi aynı tonda açar/koyulaştırır
  const tone = (c, bg, min) => {
    if (ratio(c, bg) >= min) return c;
    const to = lum(bg) < .4 ? "#ffffff" : "#000000";
    for (let t = .1; t <= 1.001; t += .1) { const x = mix(c, to, t); if (ratio(x, bg) >= min) return x; }
    return to;
  };
  const mix = (a, b, t) => "#" + rgb(a).map((c, i) => Math.round(c * (1 - t) + rgb(b)[i] * t).toString(16).padStart(2, "0")).join("");
  const rgba = (h, a) => `rgba(${rgb(h).join(",")},${a})`;

  const stack = f => {
    f = /^[\w ]{2,40}$/.test(f || "") ? f : "system-ui";
    if (f === "system-ui") return "system-ui,'Segoe UI',Roboto,Arial,sans-serif";
    // Arial Narrow telefonlarda yok; yoksa geniş bir yazı tipine düşüp her şeyi büyütüyordu
    if (f === "Arial Narrow") return "'Arial Narrow','Barlow Condensed','Liberation Sans Narrow',Arial,sans-serif";
    return `'${f}',sans-serif`;
  };

  const bgCSS = (s, fx, dark) => {
    const k = n => (dark ? "dark_" : "") + n;
    const a = hex(s[k("color_bg")], DEF[k("color_bg")]), b = hex(s[k("color_bg2")], DEF[k("color_bg2")]), st = s[k("bg_style")];
    return st === "linear" ? `linear-gradient(160deg,${a},${b})` : st === "radial" ? `radial-gradient(ellipse at 50% 0%,${b} 0%,${a} 72%)${fx ? " fixed" : ""}` : a;
  };

  // Bir mod (gündüz/gece) için tüm renk değişkenleri; yazı/zemin çiftleri her zaman okunur kalır
  const colorVars = (s, dark, fx) => {
    const k = n => (dark ? "dark_" : "") + n, d = n => DEF[k(n)];
    const a = hex(s[k("color_bg")], d("color_bg")), card = hex(s[k("color_card")], d("color_card"));
    const text = readable(hex(s[k("color_text")], d("color_text")), a);
    const head = readable(hex(s[k("color_heading")], d("color_heading")), a);
    const ctext = readable(text, card), chead = readable(head, card);
    const pr = hex(s.color_primary, DEF.color_primary);
    const m = mix(text, a, .38), cm = mix(ctext, card, .38);
    return {
      "--red": pr, "--on-red": readable("#ffffff", pr),
      "--accent": tone(pr, mix(a, text, .07), 4.5), "--caccent": tone(pr, card, 4.5),
      "--ink": text, "--hd": head, "--mute": ratio(m, a) >= 4.5 ? m : text,
      "--cink": ctext, "--chd": chead, "--cmute": ratio(cm, card) >= 4.5 ? cm : ctext,
      "--paper": a, "--bg": bgCSS(s, fx, dark), "--alt": rgba(text, .05), "--card": card, "--line": mix(text, a, .82)
    };
  };
  const sizeVars = s => ({
    "--fh": stack(s.font_head), "--fhero": stack(s.font_hero || s.font_head), "--fb": stack(s.font_body),
    "--fs": num(s.font_size, 16, 12, 24), "--hs": num(s.head_size, 100, 50, 200) / 100,
    "--hero": readable(hex(s.color_hero, DEF.color_hero), "#101114")
  });
  const cssText = o => Object.entries(o).map(([k, v]) => k + ":" + v).join(";");

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
    loadFont(s.font_head); loadFont(s.font_hero); loadFont(s.font_body);
    const css = `:root{${cssText({ ...sizeVars(s), ...colorVars(s, false, true) })}}\n[data-theme=dark]{${cssText(colorVars(s, true, true))}}`;
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
  return { esc, DEF, FONTS, hex, num, stack, bgCSS, colorVars, sizeVars, loadFont, applyTheme, loadLib };
})();
