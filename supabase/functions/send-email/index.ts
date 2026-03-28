import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">${title}</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">${body}</div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authenticated user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Nao autorizado" }, 401);

    const { to, subject, title, body } = await req.json();
    if (!to || !subject || !title || !body) {
      return json({ error: "to, subject, title e body sao obrigatorios" }, 400);
    }

    const smtpHost = (Deno.env.get("SMTP_HOST") || "smtp.hostinger.com").trim();
    const smtpPort = parseInt((Deno.env.get("SMTP_PORT") || "465").trim());
    const smtpUser = (Deno.env.get("SMTP_USER") || "").trim();
    const smtpPass = (Deno.env.get("SMTP_PASSWORD") || "").trim();
    const smtpFrom = (Deno.env.get("SMTP_FROM") || smtpUser).trim();

    if (!smtpUser || !smtpPass) {
      return json({ error: "SMTP nao configurado" }, 500);
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      text: title,
      html: buildEmailHtml(title, body),
    });

    return json({ success: true, message: `Email enviado para ${to}` });

  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
