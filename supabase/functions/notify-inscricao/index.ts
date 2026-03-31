/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
// Email template (same branding as notify-all)
// ---------------------------------------------------------------------------

const LOGO_URL = "https://embaixadores.marciosager.com/logo-legendarios.png";
const ADMIN_PANEL_URL = "https://embaixadores.marciosager.com/inscricoes";

function buildEmailHtml(title: string, body: string, buttonText?: string, buttonUrl?: string) {
  const footer = "Legendarios - Amor, Honra, Unidade";
  const buttonHtml = buttonText && buttonUrl
    ? `<div style="text-align:center;padding:24px 0 8px;">
        <a href="${buttonUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">${buttonText}</a>
      </div>`
    : "";
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
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">${title}</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">${body}</div>
        ${buttonHtml}
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">${footer}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Inscription data shape (from inscricoes table row)
// ---------------------------------------------------------------------------

interface InscricaoRow {
  id: number;
  nomeCompleto: string;
  email: string;
  telefone: string;
  instagram?: string;
  numeroLegendario?: string;
  topSede?: string;
  indicadoPorEmb?: boolean;
  nomeIndicador?: string;
  cidade?: string;
  estado?: string;
  profissao?: string;
  createdAt?: string;
}

/**
 * Extract the inscription row from either:
 *  - A database webhook payload: { type: "INSERT", table: "inscricoes", record: {...} }
 *  - A direct HTTP POST:        { ...inscricao fields }
 */
function extractInscricao(body: Record<string, unknown>): InscricaoRow {
  // Database webhook format (pg_net or Supabase Database Webhooks)
  if (body.type === "INSERT" && body.record) {
    return body.record as unknown as InscricaoRow;
  }
  // Supabase Database Webhook (alternative shape)
  if (body.table === "inscricoes" && body.record) {
    return body.record as unknown as InscricaoRow;
  }
  // Direct POST with inscription data
  return body as unknown as InscricaoRow;
}

// ---------------------------------------------------------------------------
// Build notification messages
// ---------------------------------------------------------------------------

function buildWhatsAppMessage(ins: InscricaoRow): string {
  const lines: string[] = [
    `*Nova Inscricao Recebida!*`,
    ``,
    `*Nome:* ${ins.nomeCompleto}`,
    `*Email:* ${ins.email}`,
    `*Telefone:* ${ins.telefone}`,
  ];

  if (ins.cidade || ins.estado) {
    lines.push(`*Cidade/Estado:* ${ins.cidade || "—"}/${ins.estado || "—"}`);
  }
  if (ins.numeroLegendario) {
    lines.push(`*Legendario #:* ${ins.numeroLegendario}`);
  }
  if (ins.topSede) {
    lines.push(`*TOP/Sede:* ${ins.topSede}`);
  }
  if (ins.indicadoPorEmb && ins.nomeIndicador) {
    lines.push(`*Indicado por:* ${ins.nomeIndicador}`);
  }
  if (ins.profissao) {
    lines.push(`*Profissao:* ${ins.profissao}`);
  }
  if (ins.instagram) {
    lines.push(`*Instagram:* ${ins.instagram}`);
  }

  lines.push(``);
  lines.push(`Ver no painel: ${ADMIN_PANEL_URL}`);

  return lines.join("\n");
}

function buildEmailBody(ins: InscricaoRow): string {
  const rows: string[] = [
    `<strong>Nome:</strong> ${ins.nomeCompleto}`,
    `<strong>Email:</strong> <a href="mailto:${ins.email}" style="color:#FF6B00;">${ins.email}</a>`,
    `<strong>Telefone:</strong> ${ins.telefone}`,
  ];

  if (ins.cidade || ins.estado) {
    rows.push(`<strong>Cidade/Estado:</strong> ${ins.cidade || "—"} / ${ins.estado || "—"}`);
  }
  if (ins.numeroLegendario) {
    rows.push(`<strong>Legendario #:</strong> ${ins.numeroLegendario}`);
  }
  if (ins.topSede) {
    rows.push(`<strong>TOP/Sede:</strong> ${ins.topSede}`);
  }
  if (ins.indicadoPorEmb && ins.nomeIndicador) {
    rows.push(`<strong>Indicado por:</strong> ${ins.nomeIndicador}`);
  }
  if (ins.profissao) {
    rows.push(`<strong>Profissao:</strong> ${ins.profissao}`);
  }
  if (ins.instagram) {
    rows.push(`<strong>Instagram:</strong> ${ins.instagram}`);
  }

  return rows.join("<br>");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * notify-inscricao — sends WhatsApp + email to admins when a new inscription
 * is submitted.
 *
 * Triggered by:
 *   1. Database webhook (INSERT on inscricoes) — no auth required, validated
 *      via service-role Authorization header set by pg_net.
 *   2. Direct HTTP POST with inscription data — no auth required (internal).
 *
 * Admin recipients come from env vars:
 *   ADMIN_PHONES  — comma-separated phone numbers (e.g. "5511999999999,5521888888888")
 *   ADMIN_EMAILS  — comma-separated emails (e.g. "admin@example.com,other@example.com")
 *
 * If those are not set, the function queries the users table for role='admin'
 * and fetches their auth email.
 */
Deno.serve(async (req) => {
  _req = req;

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const body = await req.json();
    const inscricao = extractInscricao(body);

    if (!inscricao.nomeCompleto || !inscricao.email) {
      return json({ error: "Dados da inscricao incompletos (nomeCompleto e email obrigatorios)" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // -----------------------------------------------------------------------
    // Resolve admin recipients
    // -----------------------------------------------------------------------
    const adminPhones: string[] = [];
    const adminEmails: string[] = [];

    const envPhones = (Deno.env.get("ADMIN_PHONES") || "").trim();
    const envEmails = (Deno.env.get("ADMIN_EMAILS") || "").trim();

    if (envPhones) {
      adminPhones.push(...envPhones.split(",").map(p => p.trim()).filter(Boolean));
    }
    if (envEmails) {
      adminEmails.push(...envEmails.split(",").map(e => e.trim()).filter(Boolean));
    }

    // Fallback: query admin users from database if env vars are not set
    if (adminPhones.length === 0 && adminEmails.length === 0) {
      const { data: adminUsers } = await supabaseAdmin
        .from("users")
        .select("openId, role")
        .eq("role", "admin");

      if (adminUsers && adminUsers.length > 0) {
        // Fetch auth emails for admin users
        for (const au of adminUsers) {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(au.openId);
          if (user?.email) {
            adminEmails.push(user.email);
          }
          if (user?.phone) {
            adminPhones.push(user.phone);
          }
        }
      }
    }

    const results = {
      whatsapp: { sent: 0, failed: 0, errors: [] as string[] },
      email: { sent: 0, failed: 0, errors: [] as string[] },
    };

    // -----------------------------------------------------------------------
    // Send WhatsApp notifications
    // -----------------------------------------------------------------------
    if (adminPhones.length > 0) {
      const instanceId = (Deno.env.get("ZAPI_INSTANCE_ID") || "").trim();
      const zapiToken = (Deno.env.get("ZAPI_TOKEN") || "").trim();
      const clientToken = (Deno.env.get("ZAPI_CLIENT_TOKEN") || "").trim();

      if (!instanceId || !zapiToken) {
        results.whatsapp.errors.push("Z-API nao configurado");
      } else {
        const zapiBaseUrl = `https://api.z-api.io/instances/${instanceId}/token/${zapiToken}`;
        const zapiHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (clientToken) zapiHeaders["Client-Token"] = clientToken;

        const message = buildWhatsAppMessage(inscricao);

        await Promise.allSettled(
          adminPhones.map(async (phone) => {
            try {
              const cleanPhone = phone.replace(/\D/g, "");
              const res = await fetch(`${zapiBaseUrl}/send-text`, {
                method: "POST",
                headers: zapiHeaders,
                body: JSON.stringify({ phone: cleanPhone, message }),
              });
              if (res.ok) {
                results.whatsapp.sent++;
              } else {
                results.whatsapp.failed++;
                results.whatsapp.errors.push(`${phone}: ${res.statusText}`);
              }
            } catch (err: any) {
              results.whatsapp.failed++;
              results.whatsapp.errors.push(`${phone}: ${err.message}`);
            }
          })
        );
      }
    }

    // -----------------------------------------------------------------------
    // Send email notifications
    // -----------------------------------------------------------------------
    if (adminEmails.length > 0) {
      const smtpHost = (Deno.env.get("SMTP_HOST") || "smtp.hostinger.com").trim();
      const smtpPort = parseInt((Deno.env.get("SMTP_PORT") || "465").trim());
      const smtpUser = (Deno.env.get("SMTP_USER") || "").trim();
      const smtpPass = (Deno.env.get("SMTP_PASSWORD") || "").trim();
      const smtpFromAddr = (Deno.env.get("SMTP_FROM") || smtpUser).trim();
      const smtpFrom = `Embaixadores dos Legendarios <${smtpFromAddr}>`;

      if (!smtpUser || !smtpPass) {
        results.email.errors.push("SMTP nao configurado");
      } else {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const emailBody = buildEmailBody(inscricao);
          const emailSubject = `Nova Inscricao: ${inscricao.nomeCompleto}`;
          const emailTitle = "Nova Inscricao Recebida";
          const plainText = buildWhatsAppMessage(inscricao);

          await Promise.allSettled(
            adminEmails.map(async (to) => {
              try {
                await transporter.sendMail({
                  from: smtpFrom,
                  to,
                  subject: emailSubject,
                  text: plainText,
                  html: buildEmailHtml(emailTitle, emailBody, "Ver Inscricao", ADMIN_PANEL_URL),
                });
                results.email.sent++;
              } catch (err: any) {
                results.email.failed++;
                results.email.errors.push(`${to}: ${err.message}`);
              }
            })
          );
        } catch (err: any) {
          results.email.errors.push(`SMTP connection: ${err.message}`);
        }
      }
    }

    return json({
      success: true,
      inscricao: { id: inscricao.id, nome: inscricao.nomeCompleto },
      recipients: { phones: adminPhones.length, emails: adminEmails.length },
      results,
    });
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
});
