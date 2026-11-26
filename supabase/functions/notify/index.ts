// Yeni mesaj / yorum geldiğinde e-posta, Telegram ve WhatsApp bildirimi gönderir.
// Dağıtım:  supabase functions deploy notify --no-verify-jwt
// (Yetkilendirmeyi fonksiyon kendisi yapar: veritabanı tetikleyicisi "x-webhook-secret" gönderir,
//  panelden "Test gönder" ise oturum açmış yöneticinin belirteciyle gelir.)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows } = await sb.from("notify_config").select("key,value");
  const c: Record<string, string> = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value ?? ""]));

  let body: any = {};
  try { body = await req.json(); } catch { /* boş gövde */ }

  // ---- yetki
  const isTest = body?.test === true;
  if (isTest) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data } = await sb.auth.getUser(jwt);
    if (!data?.user) return json({ error: "yetkisiz" }, 401);
  } else if (!c.webhook_secret || req.headers.get("x-webhook-secret") !== c.webhook_secret) {
    return json({ error: "yetkisiz" }, 401);
  }

  // ---- hangi olay?
  const table: string = isTest ? "test" : body?.table;
  const rec = body?.record ?? {};
  if (table === "messages" && c.ev_messages === "0") return json({ skipped: "mesaj bildirimi kapalı" });
  if (table === "reviews" && c.ev_reviews === "0") return json({ skipped: "yorum bildirimi kapalı" });
  if (!["messages", "reviews", "test"].includes(table)) return json({ skipped: "ilgisiz tablo" });

  const { data: st } = await sb.from("settings").select("value").eq("key", "site_title").maybeSingle();
  const site = st?.value || "BBS AUTO";
  const full = c.notify_content !== "minimal";
  const admin = c.admin_url ? `\nYönetim: ${c.admin_url.replace(/\/$/, "")}/admin/` : "";

  let subject = "", text = "";
  if (table === "test") {
    subject = `${site}: test bildirimi`;
    text = `✅ Test bildirimi. Bildirim ayarlarınız çalışıyor.`;
  } else if (table === "messages") {
    subject = `${site}: yeni mesaj`;
    text = full
      ? `📩 Yeni mesaj — ${site}\nAd: ${rec.name ?? ""}\nTelefon: ${rec.phone || "-"}\nE-posta: ${rec.email || "-"}\n\n${rec.message ?? ""}${admin}`
      : `📩 ${site}: yeni bir mesajınız var.${admin}`;
  } else {
    subject = `${site}: yeni yorum (onay bekliyor)`;
    text = full
      ? `⭐ Yeni yorum (onay bekliyor) — ${site}\n${rec.name ?? ""} · ${"★".repeat(rec.rating ?? 0)}${"☆".repeat(5 - (rec.rating ?? 0))}\n\n${rec.comment ?? ""}${admin}`
      : `⭐ ${site}: onay bekleyen yeni bir yorum var.${admin}`;
  }

  // ---- kanallar
  const jobs: Record<string, Promise<unknown>> = {};

  if (c.email_on === "1" && c.email_to && c.resend_key) {
    jobs.email = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${c.resend_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: c.email_from || "onboarding@resend.dev",
        to: c.email_to.split(",").map((s) => s.trim()).filter(Boolean),
        subject,
        text,
        html: `<pre style="font:15px/1.5 system-ui,sans-serif;white-space:pre-wrap">${esc(text)}</pre>`,
      }),
    }).then(async (r) => { if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 160)}`); return "ok"; });
  }

  if (c.tg_on === "1" && c.tg_token && c.tg_chat) {
    jobs.telegram = fetch(`https://api.telegram.org/bot${c.tg_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: c.tg_chat, text, disable_web_page_preview: true }),
    }).then(async (r) => { if (!r.ok) throw new Error(`Telegram ${r.status}: ${(await r.text()).slice(0, 160)}`); return "ok"; });
  }

  if (c.wa_on === "1" && c.wa_phone && c.wa_key) {
    // CallMeBot (ücretsiz, kişisel kullanım). Kurumsal kullanım için WhatsApp Cloud API / Twilio ile değiştirilebilir.
    const u = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(c.wa_phone.replace(/\D/g, ""))}` +
      `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(c.wa_key)}`;
    jobs.whatsapp = fetch(u).then(async (r) => { if (!r.ok) throw new Error(`CallMeBot ${r.status}: ${(await r.text()).slice(0, 160)}`); return "ok"; });
  }

  const names = Object.keys(jobs);
  const settled = await Promise.allSettled(Object.values(jobs));
  const results: Record<string, string> = {};
  settled.forEach((s, i) => { results[names[i]] = s.status === "fulfilled" ? "ok" : String((s as PromiseRejectedResult).reason?.message ?? s.reason); });
  if (!names.length) results.bilgi = "Etkin kanal yok (e-posta / Telegram / WhatsApp ayarlarını ve açma düğmelerini kontrol edin).";
  return json({ results });
});
