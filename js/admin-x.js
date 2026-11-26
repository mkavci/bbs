// Yönetim paneli eklentileri: 2 adımlı doğrulama, ziyaretçi istatistiği, Excel/CSV ürün aktarımı,
// bildirim ayarları, diller ve çeviri aktarımı. admin.js'ten sonra yüklenir (db, T, FL, toast, go, app orada tanımlıdır).
(() => {
  const B = window.BBS, esc = B.esc, $ = (s) => document.querySelector(s);
  const X = (window.BBS_X = {}), V = (window.BBS_VIEWS = {});
  const IDX = { en: 0, nl: 1, fr: 2 };

  // ================================================================ yardımcılar
  const nrm = (s) => String(s ?? "").toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, " ").trim();
  const fetchAll = async (tb, ord = "id") => {
    let all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from(tb).select("*").order(ord).range(from, from + 999);
      if (error) throw error;
      all = all.concat(data);
      if (data.length < 1000) return all;
    }
  };
  const save = (name, blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
  const csvOut = (rows) => "﻿" + rows.map((r) => r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";")).join("\r\n");
  const saveCsv = (name, rows) => save(name, new Blob([csvOut(rows)], { type: "text/csv;charset=utf-8" }));
  const loadXLSX = () => window.XLSX ? Promise.resolve() : new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.onload = ok; s.onerror = () => no(new Error("Excel kütüphanesi yüklenemedi (internet bağlantısını kontrol edin)")); document.head.appendChild(s);
  });
  const saveXlsx = async (name, sheets) => {
    await loadXLSX(); const wb = XLSX.utils.book_new();
    sheets.forEach(([n, rows, widths]) => { const ws = XLSX.utils.aoa_to_sheet(rows); if (widths) ws["!cols"] = widths.map((w) => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, n); });
    XLSX.writeFile(wb, name);
  };
  const parseCSV = (text) => {
    text = text.replace(/^﻿/, "");
    const first = text.split(/\r?\n/)[0] || "", delim = [";", "\t", ","].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
  };
  const readRows = async (file, sheetPref) => {
    const buf = await file.arrayBuffer();
    if (/\.(xlsx|xls|xlsm)$/i.test(file.name)) {
      await loadXLSX(); const wb = XLSX.read(buf, { type: "array" });
      const nm = wb.SheetNames.find((n) => nrm(n) === nrm(sheetPref)) || wb.SheetNames[0];
      return XLSX.utils.sheet_to_json(wb.Sheets[nm], { header: 1, defval: "", raw: true, blankrows: false });
    }
    let txt; try { txt = new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch (e) { txt = new TextDecoder("windows-1254").decode(buf); }
    return parseCSV(txt);
  };
  const dlg = (html, w) => { const d = $("#dlg"); d.innerHTML = `<div class="impbox">${html}</div>`; d.style.width = w || "min(980px,96vw)"; if (!d.open) d.showModal(); return d; };

  // ================================================================ 2 adımlı doğrulama
  X.gate = async (ok, login) => {
    try {
      const { data: a } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
      if (a && a.nextLevel === "aal2" && a.currentLevel !== "aal2") return ask2fa(ok, login);
    } catch (e) { /* MFA kapalıysa doğrudan devam */ }
    ok();
  };
  function ask2fa(ok, login) {
    app.innerHTML = `<form class="login"><img src="../image/bbslogo.png" alt=""><h2>İki adımlı doğrulama</h2><p>Doğrulama uygulamanızdaki 6 haneli kodu girin.</p><label>Doğrulama kodu<input name="c" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label><button class="b">Doğrula</button><small id="er" role="alert"></small><button type="button" class="b g" id="x2">Vazgeç</button></form>`;
    const f = app.querySelector("form"); f.c.focus();
    $("#x2").onclick = async () => { await db.auth.signOut(); login(); };
    f.onsubmit = async (e) => {
      e.preventDefault(); const btn = f.querySelector("button.b"); btn.disabled = true; $("#er").textContent = "";
      const { data } = await db.auth.mfa.listFactors(); let good = false;
      for (const fac of data?.totp || []) { const { error } = await db.auth.mfa.challengeAndVerify({ factorId: fac.id, code: f.c.value.trim() }); if (!error) { good = true; break; } }
      btn.disabled = false;
      good ? ok() : ($("#er").textContent = "Kod hatalı ya da süresi dolmuş. Yeni kodu deneyin.");
    };
  }

  V.security = async () => {
    const m = $("#m"); m.innerHTML = `<h2>Güvenlik</h2><p class="hint">Yükleniyor…</p>`;
    const { data: fs } = await db.auth.mfa.listFactors(); const list = fs?.totp || [];
    const { data: u } = await db.auth.getUser();
    m.innerHTML = `<h2>Güvenlik</h2>
    <div class="card"><h3>İki adımlı doğrulama (2FA) ${list.length ? '<span class="bd on">Açık</span>' : '<span class="bd">Kapalı</span>'}</h3>
      <p class="hint">Şifrenize ek olarak telefondaki uygulamadan 6 haneli kod istenir. Açıkken veritabanı da kodsuz oturumlardan yazmayı reddeder; yani şifre tek başına yetmez.</p>
      <ul>${list.map((f) => `<li class="row" style="margin:0"><span>${esc(f.friendly_name || "Cihaz")} <small class="hint">${new Date(f.created_at).toLocaleDateString("tr-TR")}</small></span><button class="b s" data-rm="${f.id}">Kaldır</button></li>`).join("") || '<li class="hint">Henüz kayıtlı cihaz yok.</li>'}</ul>
      <div id="enr"><button class="b" id="en">${list.length ? "Yedek cihaz ekle" : "Etkinleştir"}</button></div>
      <p class="hint">Google Authenticator, Microsoft Authenticator, Authy veya 1Password kullanabilirsiniz. <b>Telefonu kaybetme riskine karşı ikinci bir cihaz/uygulama da ekleyin</b>; yine de erişim giderse Supabase > Authentication > Users bölümünden faktör silinebilir.</p></div>
    <div class="card"><h3>Şifreyi değiştir</h3><form id="pw" style="display:grid;gap:.7rem;max-width:380px"><label>Yeni şifre (en az 8 karakter)<input type="password" name="p" minlength="8" autocomplete="new-password" required></label><button class="b">Şifreyi değiştir</button></form><p class="hint">Hesap: ${esc(u?.user?.email || "")}</p></div>`;
    m.querySelectorAll("[data-rm]").forEach((b) => b.onclick = async () => {
      if (!confirm("Bu doğrulama cihazı kaldırılsın mı?")) return;
      const { error } = await db.auth.mfa.unenroll({ factorId: b.dataset.rm }); if (error) return alert(error.message);
      toast("Kaldırıldı"); V.security();
    });
    $("#pw").onsubmit = async (e) => { e.preventDefault(); const { error } = await db.auth.updateUser({ password: e.target.p.value }); if (error) return alert(error.message); e.target.reset(); toast("Şifre değişti"); };
    $("#en").onclick = async () => {
      const all = (await db.auth.mfa.listFactors()).data?.all || [];
      for (const f of all.filter((f) => f.status === "unverified")) await db.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: "Cihaz " + new Date().toISOString().slice(0, 16).replace("T", " ") });
      if (error) return alert(error.message);
      $("#enr").innerHTML = `<div style="display:grid;gap:.7rem;max-width:420px"><p>1) Uygulamada «QR kod tara» deyip aşağıdaki kodu okutun:</p><img src="${esc(data.totp.qr_code)}" alt="QR" width="190" height="190" style="background:#fff;padding:.4rem;border-radius:8px"><p class="hint">Okutamazsanız anahtarı elle girin: <code>${esc(data.totp.secret)}</code></p><p>2) Uygulamada görünen 6 haneli kodu yazın:</p><form id="vf" style="display:flex;gap:.6rem"><input name="c" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required autocomplete="one-time-code"><button class="b">Doğrula</button></form></div>`;
      $("#vf").onsubmit = async (e) => {
        e.preventDefault();
        const { error: er } = await db.auth.mfa.challengeAndVerify({ factorId: data.id, code: e.target.c.value.trim() });
        if (er) return alert("Kod hatalı: " + er.message);
        toast("İki adımlı doğrulama açıldı"); V.security();
      };
    };
  };

  // ================================================================ panel dili (kenar çubuğu)
  X.afterShell = () => {
    const sb = app.querySelector("aside.sb"); if (!sb) return;
    sb.insertAdjacentHTML("beforeend", `<label class="adml"><span>Panel dili</span><select id="admlang">${Object.entries(B.ADM_LANGS).map(([c, n]) => `<option value="${c}" ${c === B.admLang ? "selected" : ""}>${n}</option>`).join("")}</select></label>`);
    $("#admlang").onchange = (e) => { try { localStorage.setItem("bbs_adm_lang", e.target.value); } catch (x) { } location.reload(); };
  };

  // ================================================================ panel anasayfası: bekleyen yorumlar + çerezsiz ziyaretçi istatistiği
  X.dashExtra = async (m) => {
    const tiles = m.querySelector(".tiles"); if (!tiles) return;
    const box = document.createElement("div"); tiles.after(box);
    try {
      const { count } = await db.from("reviews").select("*", { count: "exact", head: true }).eq("published", false);
      if (count) { box.insertAdjacentHTML("beforeend", `<div class="card warnc"><b>${count}</b> <span>yorum onayınızı bekliyor.</span> <button class="b s" id="gorev">Yorumlara git</button></div>`); $("#gorev").onclick = () => go("reviews"); }
    } catch (e) { }
    const { data, error } = await db.rpc("visit_stats", { p_days: 30 });
    if (error || !data) { box.insertAdjacentHTML("beforeend", `<div class="card"><h3>Ziyaretçiler</h3><p class="hint">İstatistik için supabase/schema-v4.sql dosyasını çalıştırın.</p></div>`); return; }
    const days = data.days || [], sum = (a, k) => a.reduce((s, x) => s + Number(x[k] || 0), 0), last = days[days.length - 1] || {};
    const max = Math.max(1, ...days.map((d) => Number(d.visitors)));
    const lst = (rows, k, v, ph) => rows.length ? `<ul class="vl">${rows.map((r) => `<li><span>${esc(r[k] || ph)}</span><b>${r[v]}</b></li>`).join("")}</ul>` : '<p class="hint">Henüz veri yok.</p>';
    box.insertAdjacentHTML("beforeend", `<div class="card"><h3>Ziyaretçiler <small class="hint">çerezsiz · IP saklanmaz</small></h3>
      <div class="tiles" style="margin-bottom:.8rem"><div class="tile" style="cursor:default"><b>${last.visitors || 0}</b>Bugün</div><div class="tile" style="cursor:default"><b>${sum(days.slice(-7), "visitors")}</b>Son 7 gün</div><div class="tile" style="cursor:default"><b>${sum(days, "visitors")}</b>Son 30 gün</div><div class="tile" style="cursor:default"><b>${sum(days, "views")}</b>Sayfa görüntüleme (30 gün)</div></div>
      <div class="vbars" role="img" aria-label="Son 30 gün günlük ziyaretçi">${days.map((d) => `<i style="height:${Math.max(3, Math.round(Number(d.visitors) / max * 100))}%" title="${esc(d.day)}: ${d.visitors} ziyaretçi, ${d.views} görüntüleme"></i>`).join("")}</div>
      <div class="vgrid"><div><h5>En çok bakılan sayfalar</h5>${lst(data.pages || [], "path", "views", "/")}</div><div><h5>Nereden geldiler</h5>${lst(data.refs || [], "ref", "visitors", "doğrudan")}</div><div><h5>Cihazlar</h5>${lst(data.devices || [], "device", "visitors", "?")}</div></div>
      <p class="hint">Aynı kişi gün içinde tek sayılır; günler toplanırken aynı kişi her gün ayrı sayılabilir (tanımlayıcı saklanmadığı için).</p></div>`);
  };

  // ================================================================ ürünleri toplu içe / dışa aktarma
  const PCOLS = [["id", "ID"], ["sku", "Ürün kodu"], ["title", "Ürün adı *"], ["category", "Kategori"], ["price", "Fiyat"], ["stock", "Stok durumu"], ["description", "Açıklama"], ["image_url", "Görseller"], ["featured", "Öne çıkan"], ["published", "Yayında"]];
  const ALIAS = {
    id: ["id"], sku: ["urun kodu", "kod", "sku", "parca no", "parca kodu", "oem", "oem no", "stok kodu"], title: ["urun adi", "ad", "baslik", "urun", "title", "name", "urun ismi"],
    category: ["kategori", "category", "grup"], price: ["fiyat", "price", "tutar"], stock: ["stok durumu", "stok", "stock", "durum"], description: ["aciklama", "description", "detay"],
    image_url: ["gorseller", "gorsel", "resim", "resimler", "foto", "fotograf", "image", "images", "image url", "image_url"], featured: ["one cikan", "featured", "vitrin"], published: ["yayinda", "yayin", "published", "aktif", "yayinla"],
  };
  const STK_LBL = { var: "Stokta", sinirli: "Sınırlı stok", yok: "Tükendi" };
  const pBool = (v, d) => { if (typeof v === "boolean") return v; const s = nrm(v); if (!s) return d; if (["evet", "e", "yes", "y", "1", "true", "x", "dogru"].includes(s)) return true; if (["hayir", "h", "no", "n", "0", "false", "yanlis"].includes(s)) return false; return "?"; };
  const pStock = (v) => { const s = nrm(v); if (!s) return ""; if (["stokta", "var", "stok var", "in stock", "1"].includes(s)) return "var"; if (["sinirli", "sinirli stok", "az", "limited"].includes(s)) return "sinirli"; if (["tukendi", "yok", "stok yok", "bitti", "out of stock", "0"].includes(s)) return "yok"; return "?"; };
  const pPrice = (v) => {
    if (typeof v === "number") return isFinite(v) && v >= 0 ? v : "?";
    let s = String(v ?? "").trim(); if (!s) return ""; if (s === "-") return "-";
    s = s.replace(/[^\d.,]/g, ""); if (!s) return "?";
    const lc = s.lastIndexOf(","), ld = s.lastIndexOf(".");
    if (lc >= 0 && ld >= 0) s = lc > ld ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (lc >= 0) s = s.replace(",", ".");
    else if (ld >= 0 && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const n = Number(s); return isFinite(n) && n >= 0 ? n : "?";
  };
  const pImgs = (v) => {
    const s = String(v ?? "").trim(); if (!s) return { v: "", w: [] }; if (s === "-") return { v: "-", w: [] };
    const ok = [], w = [];
    s.split(/[\s|]+/).filter(Boolean).forEach((u) => {
      if (/^https:\/\/[^\s'"()<>\\]+$/i.test(u)) ok.push(u);
      else if (/^http:\/\/[^\s'"()<>\\]+$/i.test(u)) { ok.push(u); w.push("http:// güvenli değil (https:// önerilir)"); }
      else w.push("Geçersiz görsel adresi atlandı: " + u.slice(0, 40));
    });
    if (ok.length > 8) { w.push("8'den fazla görsel; ilk 8'i alındı"); ok.length = 8; }
    return { v: ok.join("\n"), w };
  };

  function analyse(rows, existing) {
    const head = rows[0] || [], idx = {}, fatal = [];
    head.forEach((h, i) => { const k = nrm(h); for (const f in ALIAS) if (idx[f] === undefined && ALIAS[f].includes(k)) idx[f] = i; });
    if (idx.title === undefined) fatal.push("«Ürün adı» sütunu bulunamadı. İlk satır başlık satırı olmalı; «Şablonu indir» ile hazır dosyayı kullanın.");
    const used = new Set(Object.values(idx)), unknown = head.map(String).filter((h, i) => h.trim() && !used.has(i));
    const byId = new Map(existing.map((p) => [String(p.id), p])), bySku = new Map(existing.filter((p) => p.sku).map((p) => [nrm(p.sku), p])), titles = new Set(existing.map((p) => nrm(p.title)));
    const items = [], seen = new Map();
    rows.slice(1).forEach((r, n) => {
      const line = n + 2, raw = {}, errs = [], warns = [], ch = {};
      for (const f in idx) raw[f] = r[idx[f]];
      const title = String(raw.title ?? "").trim(), rid = String(raw.id ?? "").trim(), skuV = String(raw.sku ?? "").trim();
      let target = null;
      if (rid) { target = byId.get(rid) || null; if (!target) warns.push(`ID ${rid} bulunamadı; yeni ürün olarak eklenecek`); }
      if (!target && skuV && skuV !== "-") target = bySku.get(nrm(skuV)) || null;
      if (!title && !target) errs.push("Ürün adı boş");
      const set = (f, v, clear) => { if (v === "" || v === undefined) return; ch[f] = v === "-" ? clear : v; };
      if (title) { ch.title = title.slice(0, 150); if (title.length > 150) warns.push("Ürün adı 150 karaktere kısaltıldı"); }
      set("sku", skuV.slice(0, 60), null); set("category", String(raw.category ?? "").trim().slice(0, 60), ""); set("description", String(raw.description ?? "").trim(), "");
      const pr = pPrice(raw.price); if (pr === "?") errs.push(`Fiyat anlaşılamadı: «${raw.price}» (örn. 1250 ya da 1.250,50)`); else set("price", pr, null);
      const sk = pStock(raw.stock); if (sk === "?") errs.push(`Stok durumu anlaşılamadı: «${raw.stock}» (Stokta / Sınırlı stok / Tükendi yazın)`); else set("stock", sk, "var");
      const im = pImgs(raw.image_url); warns.push(...im.w); set("image_url", im.v, "");
      ["featured", "published"].forEach((f) => { const b = pBool(raw[f], undefined); if (b === "?") errs.push(`«${f === "featured" ? "Öne çıkan" : "Yayında"}» için Evet / Hayır yazın: «${raw[f]}»`); else if (b !== undefined) ch[f] = b; });
      const key = rid || (skuV && nrm(skuV)) || nrm(title);
      if (key) { if (seen.has(key)) warns.push(`Dosyada aynı ürün satır ${seen.get(key)}'de de var`); else seen.set(key, line); }
      if (!target && title && titles.has(nrm(title))) warns.push("Aynı adlı bir ürün zaten var; kopyası oluşacak (güncellemek için ID veya Ürün kodu yazın)");
      items.push({ line, title: title || target?.title || "", errs, warns, target, ch, raw });
    });
    return { items, fatal, unknown };
  }

  async function runImport(items, doUpdate, onProg) {
    const DEF = { sku: null, category: "", description: "", price: null, stock: "var", image_url: "", featured: false, published: true };
    const good = items.filter((x) => !x.errs.length), ins = good.filter((x) => !x.target || !doUpdate), upMap = new Map();
    good.filter((x) => x.target && doUpdate).forEach((x) => upMap.set(x.target.id, { ...(upMap.get(x.target.id) || x.target), ...x.ch }));
    const insRows = ins.map((x) => ({ ...DEF, ...x.ch })), upRows = [...upMap.values()], total = insRows.length + upRows.length; let done = 0, fail = [];
    for (let i = 0; i < insRows.length; i += 100) {
      const { error } = await db.from("products").insert(insRows.slice(i, i + 100));
      if (error) fail.push(`Ekleme (${i + 1}–${i + 100}. kayıt): ${error.message}`); else done += Math.min(100, insRows.length - i);
      onProg(done, total);
    }
    for (let i = 0; i < upRows.length; i += 100) {
      const { error } = await db.from("products").upsert(upRows.slice(i, i + 100), { onConflict: "id" });
      if (error) fail.push(`Güncelleme (${i + 1}–${i + 100}. kayıt): ${error.message}`); else done += Math.min(100, upRows.length - i);
      onProg(done, total);
    }
    return { added: insRows.length, updated: upRows.length, fail };
  }

  const tplRows = () => [PCOLS.map((c) => c[1]),
    ["", "BP-1042", "Ön fren balata seti", "Fren", "1250,50", "Stokta", "Ön takım, seramik balata.", "https://ornek.com/balata-1.jpg | https://ornek.com/balata-2.jpg", "Evet", "Evet"],
    ["", "LS-2210", "Kışlık lastik 205/55 R16", "Lastik", "2890", "Sınırlı stok", "", "", "Hayır", "Evet"],
    ["", "", "Alaşım jant seti 17 inç", "Jant", "", "Tükendi", "Fiyat için arayın.", "", "Hayır", "Evet"]];
  const GUIDE = [["Sütun", "Zorunlu mu?", "Nasıl yazılır"],
    ["ID", "Hayır", "Yeni ürün için BOŞ bırakın. Dışa aktarılan dosyada dolu gelir; aynı ID'li ürün güncellenir. ID'yi değiştirmeyin."],
    ["Ürün kodu", "Hayır", "Parça / OEM numarası. ID boşsa, aynı kodlu ürünü bulup günceller."],
    ["Ürün adı *", "EVET", "En fazla 150 karakter."],
    ["Kategori", "Hayır", "Serbest yazı. Aynı kategoriyi hep aynı yazın (Fren / fren ayrı görünebilir)."],
    ["Fiyat", "Hayır", "Sayı: 1250 ya da 1.250,50. Para birimi (€, ₺) yazmayın. Boş = «Fiyat sorunuz» görünür."],
    ["Stok durumu", "Hayır", "Stokta / Sınırlı stok / Tükendi. Boş = Stokta."],
    ["Açıklama", "Hayır", "Düz yazı."],
    ["Görseller", "Hayır", "https:// ile başlayan adres. Birden fazlaysa | ile ayırın (en fazla 8); ilki ana görsel. Dosya yüklemek için ürünü panelden düzenleyin."],
    ["Öne çıkan", "Hayır", "Evet / Hayır. Boş = Hayır."],
    ["Yayında", "Hayır", "Evet / Hayır. Boş = Evet."],
    ["", "", ""],
    ["Kurallar", "", "1) İlk satır başlık olmalı; sütun sırası önemli değil. 2) Güncellemede BOŞ hücre mevcut değeri değiştirmez; silmek için hücreye - (tire) yazın. 3) Hatalı satırlar atlanır, doğru olanlar yüklenir; yüklemeden önce önizleme görürsünüz. 4) CSV kaydederken «CSV UTF-8» seçin (Türkçe karakterler için). 5) Büyük yüklemeden önce «Dışa aktar» ile yedek alın."]];

  async function exportProducts(kind, tpl) {
    try {
      const rows = tpl ? tplRows() : [PCOLS.map((c) => c[1]), ...(await fetchAll("products")).map((p) => [p.id, p.sku ?? "", p.title ?? "", p.category ?? "", p.price ?? "", STK_LBL[p.stock] || "Stokta", p.description ?? "", String(p.image_url || "").split(/\n+/).filter(Boolean).join(" | "), p.featured ? "Evet" : "Hayır", p.published === false ? "Hayır" : "Evet"])];
      const day = new Date().toISOString().slice(0, 10), nm = tpl ? "urun-sablonu" : "urunler-" + day;
      if (kind === "csv") saveCsv(nm + ".csv", rows);
      else await saveXlsx(nm + ".xlsx", [["Ürünler", rows, [8, 14, 34, 16, 10, 14, 40, 50, 11, 10]], ["Açıklama", GUIDE, [16, 14, 110]]]);
      toast(tpl ? "Şablon indirildi" : `${rows.length - 1} ürün dışa aktarıldı`);
    } catch (e) { alert(e.message || e); }
  }

  function importDialog() {
    const d = dlg(`<div class="row" style="margin:0"><h3 style="margin:0">Ürünleri toplu yükle</h3><button class="b s" id="ix" type="button">Kapat</button></div>
    <details class="hints" open><summary>Dosya nasıl hazırlanır?</summary>
      <div class="tw"><table><thead><tr><th>Sütun</th><th>Zorunlu mu?</th><th>Nasıl yazılır</th></tr></thead><tbody>${GUIDE.slice(1, 11).map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody></table></div>
      <ul class="hint"><li>İlk satır başlık olmalı; sütun sırası önemli değil.</li><li>Güncellemede <b>boş hücre mevcut değeri değiştirmez</b>; silmek için hücreye <b>-</b> yazın.</li><li>Hatalı satırlar atlanır, doğru olanlar yüklenir. Önce önizleme görürsünüz.</li><li>CSV kaydederken «CSV UTF-8» seçin (Türkçe karakterler için).</li><li>Büyük yüklemeden önce «Dışa aktar» ile yedek alın.</li></ul></details>
    <div class="row" style="margin:0;justify-content:flex-start"><button class="b s" id="itx" type="button">Şablonu indir (Excel)</button><button class="b s" id="itc" type="button">Şablonu indir (CSV)</button></div>
    <label>Dosya seçin (.xlsx, .xls veya .csv)<input type="file" id="ifile" accept=".xlsx,.xls,.csv,.txt"></label><div id="iprev"></div>`);
    $("#ix").onclick = () => d.close(); $("#itx").onclick = () => exportProducts("xlsx", true); $("#itc").onclick = () => exportProducts("csv", true);
    $("#ifile").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return; const pv = $("#iprev"); pv.innerHTML = '<p class="hint">Dosya okunuyor…</p>';
      try {
        const [rows, existing] = await Promise.all([readRows(f, "Ürünler"), fetchAll("products")]);
        const A = analyse(rows, existing); let upd = true;
        const draw = () => {
          const ok = A.items.filter((x) => !x.errs.length), bad = A.items.length - ok.length, nUp = upd ? ok.filter((x) => x.target).length : 0, nNew = ok.length - nUp, nWarn = A.items.filter((x) => !x.errs.length && x.warns.length).length;
          pv.innerHTML = `${A.fatal.map((x) => `<p class="up-st warn">⚠ ${esc(x)}</p>`).join("")}${A.unknown.length ? `<p class="hint">Tanınmayan sütunlar yok sayıldı: ${esc(A.unknown.join(", "))}</p>` : ""}
          ${A.fatal.length ? "" : `<div class="sumchips"><span class="bd">${A.items.length} satır</span><span class="bd on">${nNew} eklenecek</span><span class="bd on">${nUp} güncellenecek</span><span class="bd ${bad ? "bad" : ""}">${bad} hatalı (atlanacak)</span><span class="bd ${nWarn ? "wrn" : ""}">${nWarn} uyarılı</span></div>
          <label style="display:flex;gap:.5rem;align-items:center;font-weight:500"><input type="checkbox" id="iupd" ${upd ? "checked" : ""} style="width:auto"> ID veya ürün kodu eşleşen ürünleri güncelle <span class="hint">(kapalıysa hepsi yeni ürün olarak eklenir)</span></label>
          <div class="tw" style="max-height:38vh;overflow:auto"><table><thead><tr><th>Satır</th><th>Durum</th><th>Ürün</th><th>Fiyat</th><th>Stok</th><th>Not</th></tr></thead><tbody>${A.items.slice(0, 200).map((x) => `<tr><td>${x.line}</td><td>${x.errs.length ? '<span class="bd bad">Hata</span>' : x.target && upd ? '<span class="bd on">Güncelle</span>' : '<span class="bd on">Yeni</span>'}</td><td>${esc(x.title)}</td><td>${x.ch.price ?? ""}</td><td>${esc(STK_LBL[x.ch.stock] || "")}</td><td>${x.errs.map((m) => `<span class="msgbad">${esc(m)}</span>`).join("<br>")}${x.warns.map((m) => `<span class="msgwrn">${esc(m)}</span>`).join("<br>")}</td></tr>`).join("")}</tbody></table></div>${A.items.length > 200 ? `<p class="hint">İlk 200 satır gösteriliyor; tümü işlenir.</p>` : ""}
          <div class="row" style="margin:0;justify-content:flex-start"><button class="b" id="igo" ${ok.length ? "" : "disabled"}>${ok.length} ürünü içe aktar</button>${bad ? '<button class="b s" id="ierr" type="button">Hata raporunu indir</button>' : ""}<span id="iprog" class="hint"></span></div>`}`;
          const cb = $("#iupd"); if (cb) cb.onchange = () => { upd = cb.checked; draw(); };
          const eb = $("#ierr"); if (eb) eb.onclick = () => saveCsv("hata-raporu.csv", [["Satır", "Ürün", "Hata"], ...A.items.filter((x) => x.errs.length).map((x) => [x.line, x.title, x.errs.join(" | ")])]);
          const go2 = $("#igo"); if (go2) go2.onclick = async () => {
            if (!confirm(`${nNew} yeni ürün eklenecek, ${nUp} ürün güncellenecek. Devam edilsin mi?`)) return;
            go2.disabled = true; const r = await runImport(A.items, upd, (a, b) => { $("#iprog").textContent = `Yükleniyor ${a}/${b}…`; });
            pv.innerHTML = `<div class="card"><h3>${r.fail.length ? "Kısmen tamamlandı" : "Tamamlandı"}</h3><p>${r.added} ürün eklendi, ${r.updated} ürün güncellendi, ${bad} satır atlandı.</p>${r.fail.map((x) => `<p class="up-st warn">⚠ ${esc(x)}${/sku|column/i.test(x) ? " — supabase/schema-v4.sql çalıştırıldı mı?" : ""}</p>`).join("")}<button class="b" id="idone">Listeyi yenile</button></div>`;
            $("#idone").onclick = () => { d.close(); list(); };
          };
        };
        draw();
      } catch (err) { pv.innerHTML = `<p class="up-st warn">⚠ ${esc(err.message || err)}</p>`; }
    };
  }
  function exportDialog() {
    const d = dlg(`<div class="row" style="margin:0"><h3 style="margin:0">Ürünleri dışa aktar</h3><button class="b s" id="ex" type="button">Kapat</button></div><p class="hint">Dosyayı düzenleyip aynı yerden geri yükleyebilirsiniz (ID sütunu ürünleri eşleştirir).</p><div class="row" style="margin:0;justify-content:flex-start"><button class="b" id="e1" type="button">Excel (.xlsx) indir</button><button class="b s" id="e2" type="button">CSV indir</button></div>`, "min(480px,94vw)");
    $("#ex").onclick = () => d.close(); $("#e1").onclick = () => exportProducts("xlsx"); $("#e2").onclick = () => exportProducts("csv");
  }
  X.afterList = (k) => {
    if (k !== "products") return; const nb = $("#new"); if (!nb) return;
    nb.insertAdjacentHTML("beforebegin", '<button class="b s" id="pimp" type="button">Excel/CSV içe aktar</button><button class="b s" id="pexp" type="button">Dışa aktar</button>');
    $("#pimp").onclick = importDialog; $("#pexp").onclick = exportDialog;
  };

  // ================================================================ bildirim ayarları
  V.notify = async () => {
    const m = $("#m"); m.innerHTML = `<h2>Bildirimler</h2><p class="hint">Yükleniyor…</p>`;
    const { data, error } = await db.from("notify_config").select("*");
    if (error) { m.innerHTML = `<h2>Bildirimler</h2><div class="card">${esc(error.message)}<br>supabase/schema-v4.sql dosyasını Supabase SQL Editor'de çalıştırdınız mı?</div>`; return; }
    const c = Object.fromEntries(data.map((r) => [r.key, r.value ?? ""])), defUrl = (window.BBS_CONFIG.SUPABASE_URL || "") + "/functions/v1/notify";
    const SEL = (k, o) => `<select name="${k}">${o.map(([a, b]) => `<option value="${a}" ${(c[k] || o[0][0]) === a ? "selected" : ""}>${b}</option>`).join("")}</select>`;
    const IN = (k, ty = "text", ph = "") => `<input name="${k}" type="${ty}" value="${esc(c[k] || "")}" placeholder="${esc(ph)}" autocomplete="off">`;
    const OO = [["0", "Kapalı"], ["1", "Açık"]];
    m.innerHTML = `<div class="row"><h2 style="margin:0">Bildirimler</h2><span style="display:flex;gap:.6rem"><button class="b s" id="ntest" type="button">Test gönder</button><button class="b" id="nsave" type="button">Kaydet</button></span></div>
    <div class="card"><p>${c.fn_url ? '<span class="bd on">Gönderim açık</span> Yeni mesaj/yorum gelince seçtiğiniz kanallara haber verilir.' : '<span class="bd">Altyapı hazır, gönderim kapalı</span> Aşağıdaki «Fonksiyon adresi» boş olduğu sürece hiçbir bildirim gönderilmez. Edge Function\'ı yayınladıktan sonra adresi yazın (adımlar KURULUM-v4.md içinde).'}</p><div id="nres"></div></div>
    <form id="nf"><fieldset><legend>Genel</legend>
      <label>Fonksiyon adresi <small class="hint">(boş = bildirimler kapalı)</small>${IN("fn_url", "text", defUrl)}</label><button type="button" class="b s" id="ndef">Varsayılan adresi yaz</button>
      <label>Mesaj geldiğinde bildir${SEL("ev_messages", [["1", "Evet"], ["0", "Hayır"]])}</label>
      <label>Yorum geldiğinde bildir${SEL("ev_reviews", [["1", "Evet"], ["0", "Hayır"]])}</label>
      <label>Bildirimde ne yazsın?${SEL("notify_content", [["full", "Ad, telefon ve mesajın tamamı"], ["minimal", "Yalnızca «yeni mesajınız var» (kişisel veri dış servise gitmez)"]])}</label>
      <label>Panel adresiniz <small class="hint">(bildirimde bağlantı olarak eklenir, örn. https://alanadiniz.com)</small>${IN("admin_url", "text", "https://")}</label></fieldset>
    <fieldset><legend>E-posta bildirimi</legend><label>Durum${SEL("email_on", OO)}</label><label>Alıcı e-posta(lar) <small class="hint">virgülle ayırın</small>${IN("email_to")}</label><label>Gönderen adresi <small class="hint">(boşsa onboarding@resend.dev)</small>${IN("email_from", "text", "BBS AUTO <bildirim@alanadiniz.com>")}</label><label>Resend API anahtarı${IN("resend_key", "password")}</label>
      <p class="hint">resend.com'da ücretsiz hesap açın > API Keys. Kendi alan adınızı doğrulayana kadar yalnızca Resend hesabınızın e-postasına gönderebilirsiniz.</p></fieldset>
    <fieldset><legend>Telegram bildirimi</legend><label>Durum${SEL("tg_on", OO)}</label><label>Bot belirteci (token)${IN("tg_token", "password")}</label><label>Sohbet kimliği (chat id)${IN("tg_chat")}</label>
      <p class="hint">1) Telegram'da @BotFather'a /newbot yazın, verdiği token'ı buraya girin. 2) Yeni botunuza bir mesaj yazın. 3) Tarayıcıda api.telegram.org/bot&lt;TOKEN&gt;/getUpdates açın; "chat":{"id": … } değeri chat id'dir.</p></fieldset>
    <fieldset><legend>WhatsApp bildirimi</legend><label>Durum${SEL("wa_on", OO)}</label><label>Telefon (ülke koduyla, örn. 905551112233)${IN("wa_phone")}</label><label>CallMeBot API anahtarı${IN("wa_key", "password")}</label>
      <p class="hint">Ücretsiz CallMeBot hizmeti kendi numaranıza mesaj atar; kurulum için callmebot.com/blog/free-api-whatsapp-messages adresindeki adımları izleyip gelen anahtarı girin. Kurumsal/yoğun kullanım için WhatsApp Business API ya da Twilio gerekir (fonksiyon kolayca uyarlanır).</p></fieldset></form>
    <p class="hint">Anahtarlar yalnızca giriş yapmış yönetici tarafından okunabilen ayrı bir tabloda saklanır; sitede herkese açık «settings» tablosuna yazılmaz.</p>`;
    const collect = () => [...$("#nf").elements].filter((e) => e.name).map((e) => ({ key: e.name, value: e.value.trim() }));
    const saveAll = async () => { const { error: er } = await db.from("notify_config").upsert(collect()); if (er) { alert(er.message); return false; } toast("Kaydedildi"); return true; };
    $("#nsave").onclick = async () => { if (await saveAll()) V.notify(); };
    $("#ndef").onclick = () => { $("#nf").fn_url.value = defUrl; };
    $("#ntest").onclick = async () => {
      if (!(await saveAll())) return; const r = $("#nres"); r.innerHTML = '<p class="hint">Test gönderiliyor…</p>';
      const { data: out, error: er } = await db.functions.invoke("notify", { body: { test: true } });
      if (er) { r.innerHTML = `<p class="up-st warn">⚠ Fonksiyona ulaşılamadı: ${esc(er.message)} (yayınlandı mı? «supabase functions deploy notify --no-verify-jwt»)</p>`; return; }
      r.innerHTML = Object.entries(out?.results || {}).map(([k, v]) => `<p class="${v === "ok" ? "up-st" : "up-st warn"}">${v === "ok" ? "✓" : "⚠"} ${esc(k)}: ${esc(v)}</p>`).join("") || `<p class="up-st warn">${esc(JSON.stringify(out))}</p>`;
    };
  };

  // ================================================================ diller + çeviri aktarımı
  const loadS = async () => { const { data } = await db.from("settings").select("*"); return { ...B.DEF, ...Object.fromEntries((data || []).filter((r) => r.value).map((r) => [r.key, r.value])) }; };
  const loadTrAll = async () => {
    const o = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from("translations").select("lang,ref,value").order("lang").order("ref").range(from, from + 999);
      if (error) throw error;
      data.forEach((r) => { if (r.value) (o[r.lang] ||= {})[r.ref] = r.value; });
      if (data.length < 1000) return o;
    }
  };
  const saveSet = (o) => db.from("settings").upsert(Object.entries(o).map(([key, value]) => ({ key, value: String(value) })));
  const splitL = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  async function sourceRows(S) {
    const out = [];
    for (const [tb, fs] of Object.entries(B.TR.tables)) {
      let rows = []; try { rows = await fetchAll(tb); } catch (e) { continue; }
      rows.forEach((r) => fs.forEach((f) => { const v = r[f]; if (v !== null && v !== undefined && String(v).trim() !== "") out.push({ ref: `${tb}:${r.id}:${f}`, tb, id: r.id, f, grp: T[tb]?.label || tb, lbl: String(r.title || r.label || r.question || r.id).slice(0, 40) + " › " + (FL[f] || f), text: String(v) }); }));
    }
    B.TR.settings.forEach((k) => { if (S[k]) out.push({ ref: "settings:" + k, grp: "Site Ayarları", lbl: k, text: String(S[k]) }); });
    Object.keys(B.UI).forEach((k) => out.push({ ref: "ui:" + k, grp: "Site arayüz metinleri (Türkçe kaynak)", lbl: "", text: k }));
    return out;
  }

  V.langs = async () => {
    const m = $("#m"); m.innerHTML = `<h2>Diller</h2><p class="hint">Yükleniyor…</p>`;
    let S, trs, src;
    try { [S, trs] = await Promise.all([loadS(), loadTrAll()]); src = await sourceRows(S); }
    catch (e) { m.innerHTML = `<h2>Diller</h2><div class="card">${esc(e.message || e)}<br>supabase/schema-v4.sql dosyasını çalıştırdınız mı?</div>`; return; }
    const main = S.lang_main || "tr", extra = splitL(S.langs).filter((c) => c !== main);
    const ui = (lang, text) => (trs[lang] && trs[lang]["ui:" + text]) || (B.UI[text] && B.UI[text][IDX[lang]]) || "";
    const val = (lang, s) => (trs[lang] && trs[lang][s.ref]) || (s.ref.startsWith("ui:") ? ui(lang, s.text) : "");
    const pct = (lang) => src.length ? Math.round(src.filter((s) => val(lang, s)).length / src.length * 100) : 0;
    const noTr = Object.values(trs).every((o) => !Object.keys(o).length);
    const free = Object.entries(B.LANGS).filter(([c]) => c !== main && !extra.includes(c));
    m.innerHTML = `<h2>Diller</h2>
    <div class="card"><h3>Dil ayarları</h3>
      <p><b>Ana dil: ${esc(B.LANGS[main] || main)} (${main})</b> — panelde yazdığınız içerik bu dildedir.</p>
      ${noTr ? `<div class="row" style="margin:0;justify-content:flex-start"><label style="min-width:240px">İçeriği hangi dilde yazdınız?<select id="mainsel">${Object.entries(B.LANGS).map(([c, n]) => `<option value="${c}" ${c === main ? "selected" : ""}>${n}</option>`).join("")}</select></label><button class="b s" id="mainsave" type="button">Ana dili kaydet</button></div>` : `<p class="hint">Çeviri girilmeye başladığı için ana dil burada değiştirilemez; teslim için aşağıdaki «Ana dil yap» düğmesini kullanın.</p>`}
      <div class="tw"><table><thead><tr><th>Dil</th><th>Kod</th><th>Çeviri</th><th></th></tr></thead><tbody>
        <tr><td><b>${esc(B.LANGS[main] || main)}</b> <span class="bd on">ana dil</span></td><td>${main}</td><td>—</td><td></td></tr>
        ${extra.map((c) => `<tr><td>${esc(B.LANGS[c] || c)}</td><td>${c}</td><td><span class="bd ${pct(c) > 95 ? "on" : ""}">%${pct(c)} çevrildi</span></td><td class="ac"><button class="b s" data-ed="${c}" type="button">Çeviri tablosu</button> <button class="b s" data-sw="${c}" type="button">Ana dil yap</button> <button class="b g" data-rm="${c}" type="button">Kaldır</button></td></tr>`).join("")}
      </tbody></table></div>
      <div class="row" style="margin:0;justify-content:flex-start"><label style="min-width:220px">Dil ekle<select id="addsel">${free.map(([c, n]) => `<option value="${c}">${n} (${c})</option>`).join("")}</select></label><button class="b" id="addbtn" type="button">Dil ekle</button>
      <label style="min-width:240px">Ziyaretçilere dil seçici<select id="swsel"><option value="1" ${S.lang_switcher !== "0" ? "selected" : ""}>Göster</option><option value="0" ${S.lang_switcher === "0" ? "selected" : ""}>Gizle</option></select></label></div></div>
    <div class="card"><h3>Çevirileri dışa / içe aktar</h3>
      <p class="hint">Dışa aktarılan dosyada her satır bir metindir: <b>Ref</b> (değiştirmeyin) · Grup · Açıklama · <b>Kaynak metin</b> · her dil için boş (ya da mevcut) sütun. Çevirmen / DeepL / yapay zekâ boş sütunları doldurur, dosyayı buradan geri yüklersiniz. HTML etiketlerini (&lt;p&gt;, &lt;b&gt;) çevirmeyin, yerinde bırakın. <b>Boş hücre mevcut çeviriyi silmez.</b></p>
      <div class="row" style="margin:0;justify-content:flex-start"><button class="b" id="texp" type="button" ${extra.length ? "" : "disabled"}>Excel (.xlsx) indir</button><button class="b s" id="texpc" type="button" ${extra.length ? "" : "disabled"}>CSV indir</button></div>
      <label>Çeviri dosyasını yükle (.xlsx / .csv)<input type="file" id="tfile" accept=".xlsx,.xls,.csv,.txt" ${extra.length ? "" : "disabled"}></label><div id="timp"></div></div>
    <div id="ted"></div>`;
    const reload = () => V.langs();
    $("#addbtn").onclick = async () => { const c = $("#addsel").value; if (!c) return; await saveSet({ langs: [...extra, c].join(",") }); toast("Dil eklendi"); reload(); };
    $("#swsel").onchange = async (e) => { await saveSet({ lang_switcher: e.target.value }); toast("Kaydedildi"); };
    if (noTr) $("#mainsave").onclick = async () => { await saveSet({ lang_main: $("#mainsel").value, langs: extra.filter((c) => c !== $("#mainsel").value).join(",") }); toast("Kaydedildi"); reload(); };
    m.querySelectorAll("[data-rm]").forEach((b) => b.onclick = async () => { if (!confirm(`«${B.LANGS[b.dataset.rm]}» dili sitedan kaldırılsın mı? Çeviriler silinmez.`)) return; await saveSet({ langs: extra.filter((c) => c !== b.dataset.rm).join(",") }); reload(); });
    m.querySelectorAll("[data-ed]").forEach((b) => b.onclick = () => editor(b.dataset.ed));
    m.querySelectorAll("[data-sw]").forEach((b) => b.onclick = () => swapMain(b.dataset.sw));

    // ---- çeviri tablosu
    function editor(lang) {
      const box = $("#ted"), f = { q: "", missing: false, page: 0 };
      const draw = () => {
        const rows = src.filter((s) => (!f.missing || !val(lang, s)) && (!f.q || (s.text + " " + s.lbl).toLowerCase().includes(f.q))), pages = Math.max(1, Math.ceil(rows.length / 30)); f.page = Math.min(f.page, pages - 1);
        const cur = rows.slice(f.page * 30, f.page * 30 + 30);
        box.innerHTML = `<div class="card"><div class="row" style="margin:0"><h3 style="margin:0">Çeviri tablosu: ${esc(B.LANGS[lang] || lang)} <small class="hint">${rows.length} metin</small></h3><span style="display:flex;gap:.6rem;flex-wrap:wrap"><input id="tq" placeholder="Ara..." style="width:200px" value="${esc(f.q)}"><label style="display:flex;gap:.4rem;align-items:center;font-weight:500"><input type="checkbox" id="tmiss" ${f.missing ? "checked" : ""} style="width:auto">Yalnızca eksikler</label></span></div>
          <div class="tw"><table><thead><tr><th style="width:42%">${esc(B.LANGS[main] || main)} (kaynak)</th><th>${esc(B.LANGS[lang] || lang)}</th></tr></thead><tbody>${cur.map((s, i) => `<tr><td><small class="hint">${esc(s.grp)} · ${esc(s.lbl)}</small><div class="trsrc">${esc(s.text.length > 400 ? s.text.slice(0, 400) + "…" : s.text)}</div></td><td><textarea data-i="${i}" rows="${s.text.length > 120 ? 4 : 2}">${esc(val(lang, s))}</textarea></td></tr>`).join("") || '<tr><td colspan="2" class="empty">Gösterilecek metin yok.</td></tr>'}</tbody></table></div>
          <div class="row" style="margin:.8rem 0 0;justify-content:flex-start"><button class="b s" id="tpv" type="button" ${f.page ? "" : "disabled"}>‹ Önceki</button><span class="hint">${f.page + 1} / ${pages}</span><button class="b s" id="tnx" type="button" ${f.page < pages - 1 ? "" : "disabled"}>Sonraki ›</button></div></div>`;
        $("#tq").oninput = (e) => { f.q = e.target.value.toLowerCase(); clearTimeout(draw.t); draw.t = setTimeout(() => { draw(); $("#tq").focus(); $("#tq").setSelectionRange(f.q.length, f.q.length); }, 350); };
        $("#tmiss").onchange = (e) => { f.missing = e.target.checked; f.page = 0; draw(); };
        $("#tpv").onclick = () => { f.page--; draw(); }; $("#tnx").onclick = () => { f.page++; draw(); };
        box.querySelectorAll("textarea[data-i]").forEach((ta) => ta.onchange = async () => {
          const s = cur[+ta.dataset.i], v = ta.value.trim(); (trs[lang] ||= {});
          const { error } = v ? await db.from("translations").upsert({ lang, ref: s.ref, value: v, updated_at: new Date().toISOString() }) : await db.from("translations").delete().eq("lang", lang).eq("ref", s.ref);
          if (error) return alert(error.message); if (v) trs[lang][s.ref] = v; else delete trs[lang][s.ref]; toast("Kaydedildi");
        });
      };
      draw(); box.scrollIntoView({ behavior: "smooth" });
    }

    // ---- dışa aktar
    const exportTr = async (kind) => {
      const head = ["Ref (değiştirmeyin)", "Grup", "Açıklama", `${B.LANGS[main]} (${main}) — KAYNAK`, ...extra.map((c) => `${B.LANGS[c] || c} (${c})`)];
      const rows = [head, ...src.map((s) => [s.ref, s.grp, s.lbl, s.text, ...extra.map((c) => val(c, s))])];
      const day = new Date().toISOString().slice(0, 10);
      if (kind === "csv") return saveCsv(`ceviriler-${day}.csv`, rows);
      await saveXlsx(`ceviriler-${day}.xlsx`, [["Çeviriler", rows, [34, 22, 30, 60, ...extra.map(() => 60)]], ["Açıklama", [["Nasıl kullanılır?"], ["1) Yalnızca dil sütunlarını (örn. Nederlands (nl)) doldurun; Ref, Grup, Açıklama ve KAYNAK sütunlarına dokunmayın."], ["2) HTML etiketlerini (<p>, <b>, <a href=...>) olduğu gibi bırakın, yalnızca aralarındaki yazıyı çevirin."], ["3) {0}, {1}, {link} gibi süslü parantezli yer tutucuları aynen koruyun."], ["4) Boş bıraktığınız hücreler mevcut çeviriyi silmez."], ["5) Dosyayı panelde Diller > Çevirileri içe aktar bölümünden yükleyin."]], [110]]]);
    };
    $("#texp").onclick = () => exportTr("xlsx").catch((e) => alert(e.message)); $("#texpc").onclick = () => exportTr("csv");

    // ---- içe aktar
    $("#tfile").onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return; const box = $("#timp"); box.innerHTML = '<p class="hint">Okunuyor…</p>';
      try {
        const rows = await readRows(file, "Çeviriler"), head = (rows[0] || []).map(String), refCol = head.findIndex((h) => /^ref/i.test(h.trim()));
        if (refCol < 0) throw new Error("«Ref» sütunu bulunamadı. Panelden indirdiğiniz dosyayı kullanın.");
        const cols = head.map((h, i) => { const mm = h.match(/\(([a-z]{2,3})\)\s*$/i) || (/^[a-z]{2,3}$/i.test(h.trim()) ? [0, h.trim()] : null); return mm && i !== refCol && !/KAYNAK/i.test(h) ? { i, lang: mm[1].toLowerCase() } : null; }).filter(Boolean);
        const srcMap = new Map(src.map((s) => [s.ref, s])), ign = cols.filter((c) => !extra.includes(c.lang)).map((c) => c.lang), use = cols.filter((c) => extra.includes(c.lang));
        const tags = (x) => (String(x).match(/<\/?[a-z][^>]*>/gi) || []).length, ph = (x) => (String(x).match(/\{[^}]+\}/g) || []).sort().join();
        const changes = [], warns = []; let unknown = 0, same = 0;
        rows.slice(1).forEach((r) => {
          const ref = String(r[refCol] ?? "").trim(), s = srcMap.get(ref); if (!ref) return; if (!s) { unknown++; return; }
          use.forEach((c) => {
            const v = String(r[c.i] ?? "").trim(); if (!v) return;
            if (v === val(c.lang, s)) { same++; return; }
            changes.push({ lang: c.lang, ref, value: v });
            if (tags(v) !== tags(s.text)) warns.push(`${ref} (${c.lang}): HTML etiket sayısı kaynaktan farklı`); if (ph(v) !== ph(s.text)) warns.push(`${ref} (${c.lang}): {…} yer tutucuları kaynakla uyuşmuyor`);
          });
        });
        const per = use.map((c) => `${B.LANGS[c.lang] || c.lang}: ${changes.filter((x) => x.lang === c.lang).length}`).join(" · ");
        box.innerHTML = `<div class="sumchips"><span class="bd on">${changes.length} çeviri uygulanacak</span><span class="bd">${same} değişmeyen</span>${unknown ? `<span class="bd bad">${unknown} bilinmeyen Ref (atlanacak)</span>` : ""}${warns.length ? `<span class="bd wrn">${warns.length} uyarı</span>` : ""}</div><p class="hint">${esc(per)}${ign.length ? " · Sitede ekli olmayan diller yok sayıldı: " + esc(ign.join(", ")) : ""}</p>${warns.slice(0, 8).map((w) => `<p class="up-st warn">⚠ ${esc(w)}</p>`).join("")}<button class="b" id="tgo" ${changes.length ? "" : "disabled"}>Çevirileri uygula</button>`;
        $("#tgo").onclick = async () => {
          $("#tgo").disabled = true; const now = new Date().toISOString();
          for (let i = 0; i < changes.length; i += 200) { const { error } = await db.from("translations").upsert(changes.slice(i, i + 200).map((x) => ({ ...x, updated_at: now }))); if (error) return alert(error.message); box.querySelector("button").textContent = `${Math.min(i + 200, changes.length)}/${changes.length}…`; }
          toast("Çeviriler kaydedildi"); reload();
        };
      } catch (err) { box.innerHTML = `<p class="up-st warn">⚠ ${esc(err.message || err)}</p>`; }
    };

    // ---- ana dili değiştir (teslim): çeviriyi taban içeriğe taşır, eski ana dili çeviri yapar
    async function swapMain(lang) {
      const cov = pct(lang), name = B.LANGS[lang] || lang;
      const msg = `«${name}» ana dil olacak.\n\nİçerik (ürün, haber, hizmet, sayfa, ayarlar) ${name} çevirilerine dönüştürülür; mevcut ${B.LANGS[main] || main} metinler çeviri olarak saklanır.\nÇeviri oranı: %${cov}${cov < 100 ? " (çevrilmeyenler olduğu gibi kalır ve yanlış dilde görünür!)" : ""}\n\nÖNCE Dışa aktar ile yedek aldığınızdan emin olun. Devam etmek için ONAYLA yazın.`;
      if ((prompt(msg) || "").trim() !== "ONAYLA") return;
      const tNew = trs[lang] || {}, old = main, oldRows = [], delRefs = [], baseUp = {}, setRows = [];
      try {
        for (const [tb, fs] of Object.entries(B.TR.tables)) {
          const rows = await fetchAll(tb);
          rows.forEach((r) => { const ch = {}; fs.forEach((f) => { const ref = `${tb}:${r.id}:${f}`, nv = tNew[ref]; if (nv) { ch[f] = nv; if (r[f]) oldRows.push({ lang: old, ref, value: r[f] }); delRefs.push(ref); } }); if (Object.keys(ch).length) (baseUp[tb] ||= []).push({ id: r.id, ch }); });
        }
        B.TR.settings.forEach((k) => { const ref = "settings:" + k, nv = tNew[ref]; if (nv) { if (S[k]) oldRows.push({ lang: old, ref, value: S[k] }); setRows.push({ key: k, value: nv }); delRefs.push(ref); } });
        toast("Eski dil çeviri olarak saklanıyor…");
        for (let i = 0; i < oldRows.length; i += 200) { const { error } = await db.from("translations").upsert(oldRows.slice(i, i + 200)); if (error) throw error; }
        toast("İçerik güncelleniyor…");
        for (const [tb, list] of Object.entries(baseUp)) for (let i = 0; i < list.length; i += 6) await Promise.all(list.slice(i, i + 6).map(async (x) => { const { error } = await db.from(tb).update(x.ch).eq("id", x.id); if (error) throw error; }));
        if (setRows.length) { const { error } = await db.from("settings").upsert(setRows); if (error) throw error; }
        for (let i = 0; i < delRefs.length; i += 100) { const { error } = await db.from("translations").delete().eq("lang", lang).in("ref", delRefs.slice(i, i + 100)); if (error) throw error; }
        await saveSet({ lang_main: lang, langs: [old, ...extra.filter((c) => c !== lang)].join(",") });
        toast("Ana dil değişti"); reload();
      } catch (e) { alert("İşlem yarıda kaldı: " + (e.message || e) + "\nYedek dosyanızı kontrol edin; işlem tekrar çalıştırılabilir."); reload(); }
    }
  };
})();
