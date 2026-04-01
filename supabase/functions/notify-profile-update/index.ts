/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />
import nodemailer from "npm:nodemailer@6.9.16";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  const allowed = ["https://embaixadores.marciosager.com", "http://localhost:5173"];
  return allowed.includes(origin) ? origin : allowed[0];
}

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

let _req: Request;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(_req), "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

const LOGO_URL = "https://embaixadores.marciosager.com/logo-legendarios.png";

function buildEmailHtml(nome: string, locale: string) {
  const messages: Record<string, { title: string; body: string; footer: string }> = {
    pt: {
      title: "Perfil Atualizado!",
      body: `<p>Olá <strong>${nome}</strong>,</p>
        <p>Seus dados de perfil foram atualizados com sucesso no sistema dos Embaixadores dos Legendários.</p>
        <p>Se você não fez essa alteração, entre em contato com a equipe de gestão imediatamente.</p>
        <p style="margin-top:24px;color:#86868b;font-size:12px;">Este é um email automático, não é necessário responder.</p>`,
      footer: "Legendarios - Amor, Honra, Unidade",
    },
    es: {
      title: "¡Perfil Actualizado!",
      body: `<p>Hola <strong>${nome}</strong>,</p>
        <p>Tus datos de perfil fueron actualizados con éxito en el sistema de Embajadores de los Legendarios.</p>
        <p>Si no realizaste este cambio, contacta al equipo de gestión inmediatamente.</p>
        <p style="margin-top:24px;color:#86868b;font-size:12px;">Este es un email automático, no es necesario responder.</p>`,
      footer: "Legendarios - Amor, Honor, Unidad",
    },
    en: {
      title: "Profile Updated!",
      body: `<p>Hello <strong>${nome}</strong>,</p>
        <p>Your profile data has been successfully updated in the Ambassadors of the Legendários system.</p>
        <p>If you didn't make this change, please contact the management team immediately.</p>
        <p style="margin-top:24px;color:#86868b;font-size:12px;">This is an automated email, no need to reply.</p>`,
      footer: "Legendarios - Love, Honor, Unity",
    },
  };

  const m = messages[locale] || messages.pt;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="${LOGO_URL}" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">${m.title}</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">${m.body}</div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">${m.footer}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildWhatsAppMessage(nome: string, locale: string): string {
  const messages: Record<string, string> = {
    pt: `✅ *Perfil Atualizado!*\n\nOlá ${nome}, seus dados foram salvos com sucesso no sistema dos Embaixadores dos Legendários.\n\nSe você não fez essa alteração, entre em contato com a equipe.`,
    es: `✅ *¡Perfil Actualizado!*\n\nHola ${nome}, tus datos fueron guardados con éxito en el sistema de Embajadores de los Legendarios.\n\nSi no realizaste este cambio, contacta al equipo.`,
    en: `✅ *Profile Updated!*\n\nHello ${nome}, your data has been successfully saved in the Ambassadors of the Legendários system.\n\nIf you didn't make this change, please contact the team.`,
  };
  return messages[locale] || messages.pt;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  _req = req;

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const { nome, email, telefone, locale = "pt" } = await req.json();

    if (!nome) {
      return json({ error: "nome obrigatorio" }, 400);
    }

    const results = {
      whatsapp: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
    };

    // -----------------------------------------------------------------------
    // Send WhatsApp confirmation to ambassador
    // -----------------------------------------------------------------------
    if (telefone) {
      const instanceId = (Deno.env.get("ZAPI_INSTANCE_ID") || "").trim();
      const zapiToken = (Deno.env.get("ZAPI_TOKEN") || "").trim();
      const clientToken = (Deno.env.get("ZAPI_CLIENT_TOKEN") || "").trim();

      if (instanceId && zapiToken) {
        try {
          const zapiBaseUrl = `https://api.z-api.io/instances/${instanceId}/token/${zapiToken}`;
          const zapiHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (clientToken) zapiHeaders["Client-Token"] = clientToken;

          const cleanPhone = telefone.replace(/\D/g, "");
          const message = buildWhatsAppMessage(nome, locale);

          const res = await fetch(`${zapiBaseUrl}/send-text`, {
            method: "POST",
            headers: zapiHeaders,
            body: JSON.stringify({ phone: cleanPhone, message }),
          });

          results.whatsapp.sent = res.ok;
          if (!res.ok) results.whatsapp.error = res.statusText;
        } catch (err: any) {
          results.whatsapp.error = err.message;
        }
      } else {
        results.whatsapp.error = "Z-API nao configurado";
      }
    }

    // -----------------------------------------------------------------------
    // Send email confirmation to ambassador
    // -----------------------------------------------------------------------
    if (email) {
      const smtpHost = (Deno.env.get("SMTP_HOST") || "smtp.hostinger.com").trim();
      const smtpPort = parseInt((Deno.env.get("SMTP_PORT") || "465").trim());
      const smtpUser = (Deno.env.get("SMTP_USER") || "").trim();
      const smtpPass = (Deno.env.get("SMTP_PASSWORD") || "").trim();
      const smtpFromAddr = (Deno.env.get("SMTP_FROM") || smtpUser).trim();
      const smtpFrom = `Embaixadores dos Legendarios <${smtpFromAddr}>`;

      if (smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const subjects: Record<string, string> = {
            pt: "Perfil atualizado com sucesso",
            es: "Perfil actualizado con éxito",
            en: "Profile updated successfully",
          };

          await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject: subjects[locale] || subjects.pt,
            text: buildWhatsAppMessage(nome, locale),
            html: buildEmailHtml(nome, locale),
          });

          results.email.sent = true;
        } catch (err: any) {
          results.email.error = err.message;
        }
      } else {
        results.email.error = "SMTP nao configurado";
      }
    }

    return json({ success: true, results });
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
});
