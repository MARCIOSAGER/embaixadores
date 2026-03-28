import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

/**
 * notify-all: Sends WhatsApp and/or Email to all active embaixadores.
 *
 * Body: {
 *   channel: "whatsapp" | "email" | "both",
 *   subject: string,        // email subject
 *   title: string,          // displayed title
 *   message: string,        // plain text (WhatsApp) + email body (HTML)
 *   meetLink?: string,      // optional Meet link to append
 * }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authenticated user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: "Nao autorizado" }, 401);

    const { channel, subject, title, message, meetLink } = await req.json();

    if (!channel || !subject || !title || !message) {
      return json({ error: "channel, subject, title e message sao obrigatorios" }, 400);
    }

    if (!["whatsapp", "email", "both"].includes(channel)) {
      return json({ error: "channel deve ser: whatsapp, email, both" }, 400);
    }

    // Fetch all active embaixadores using service role (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: embaixadores, error: fetchError } = await supabaseAdmin
      .from("embaixadores")
      .select("nomeCompleto, email, telefone")
      .eq("status", "ativo");

    if (fetchError) throw fetchError;
    if (!embaixadores || embaixadores.length === 0) {
      return json({ error: "Nenhum embaixador ativo encontrado" }, 404);
    }

    const results = { whatsapp: { sent: 0, failed: 0, errors: [] as string[] }, email: { sent: 0, failed: 0, errors: [] as string[] } };

    // Build full message with Meet link
    const fullMessage = meetLink
      ? `${message}\n\nLink da reuniao: ${meetLink}`
      : message;

    const fullBody = meetLink
      ? `${message}<br><br><a href="${meetLink}" style="color:#FF6B00;text-decoration:underline;">Entrar na reuniao (Google Meet)</a>`
      : message;

    // Send WhatsApp via Z-API
    if (channel === "whatsapp" || channel === "both") {
      const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
      const zapiToken = Deno.env.get("ZAPI_TOKEN");
      const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

      if (!instanceId || !zapiToken) {
        results.whatsapp.errors.push("Z-API nao configurado");
      } else {
        const zapiBaseUrl = `https://api.z-api.io/instances/${instanceId}/token/${zapiToken}`;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (clientToken) headers["Client-Token"] = clientToken;

        const phonesToSend = embaixadores
          .filter(e => e.telefone)
          .map(e => ({ name: e.nomeCompleto, phone: e.telefone!.replace(/\D/g, "") }));

        for (const { name, phone } of phonesToSend) {
          try {
            const res = await fetch(`${zapiBaseUrl}/send-text`, {
              method: "POST",
              headers,
              body: JSON.stringify({ phone, message: fullMessage }),
            });
            if (res.ok) {
              results.whatsapp.sent++;
            } else {
              results.whatsapp.failed++;
              results.whatsapp.errors.push(`${name}: ${res.statusText}`);
            }
          } catch (err) {
            results.whatsapp.failed++;
            results.whatsapp.errors.push(`${name}: ${err.message}`);
          }
        }
      }
    }

    // Send Email via SMTP
    if (channel === "email" || channel === "both") {
      const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
      const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
      const smtpUser = Deno.env.get("SMTP_USER") || "";
      const smtpPass = Deno.env.get("SMTP_PASSWORD") || "";
      const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;

      if (!smtpUser || !smtpPass) {
        results.email.errors.push("SMTP nao configurado");
      } else {
        const emailsToSend = embaixadores
          .filter(e => e.email)
          .map(e => ({ name: e.nomeCompleto, email: e.email! }));

        try {
          const client = new SmtpClient();
          await client.connectTLS({
            hostname: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPass,
          });

          for (const { name, email } of emailsToSend) {
            try {
              await client.send({
                from: smtpFrom,
                to: email,
                subject,
                content: title,
                html: buildEmailHtml(title, fullBody),
              });
              results.email.sent++;
            } catch (err) {
              results.email.failed++;
              results.email.errors.push(`${name}: ${err.message}`);
            }
          }

          await client.close();
        } catch (err) {
          results.email.errors.push(`SMTP connection: ${err.message}`);
        }
      }
    }

    return json({
      success: true,
      total: embaixadores.length,
      results,
    });

  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
