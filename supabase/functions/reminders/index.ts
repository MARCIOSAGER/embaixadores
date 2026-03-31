/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const LOGO_URL = "https://embaixadores.marciosager.com/logo-legendarios.png";

function buildEmailHtml(title: string, body: string) {
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

// ── Helpers ──────────────────────────────────────────────────────────

function nowBRT(): Date {
  // Current time in BRT (UTC-3)
  const now = new Date();
  return now;
}

function startOfDayBRT(date: Date): Date {
  const d = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateOnly(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatTimeOnly(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function daysBetween(fromMs: number, toMs: number): number {
  return Math.ceil((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

// ── Z-API WhatsApp sender ───────────────────────────────────────────

interface ZApiConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

function getZApiConfig(): ZApiConfig | null {
  const instanceId = (Deno.env.get("ZAPI_INSTANCE_ID") || "").trim();
  const zapiToken = (Deno.env.get("ZAPI_TOKEN") || "").trim();
  const clientToken = (Deno.env.get("ZAPI_CLIENT_TOKEN") || "").trim();

  if (!instanceId || !zapiToken) return null;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  return {
    baseUrl: `https://api.z-api.io/instances/${instanceId}/token/${zapiToken}`,
    headers,
  };
}

async function sendWhatsApp(
  config: ZApiConfig,
  phone: string,
  message: string,
): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const res = await fetch(`${config.baseUrl}/send-text`, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify({ phone: cleanPhone, message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── SMTP email sender ───────────────────────────────────────────────

function getSmtpTransporter() {
  const smtpHost = (Deno.env.get("SMTP_HOST") || "smtp.hostinger.com").trim();
  const smtpPort = parseInt((Deno.env.get("SMTP_PORT") || "465").trim());
  const smtpUser = (Deno.env.get("SMTP_USER") || "").trim();
  const smtpPass = (Deno.env.get("SMTP_PASSWORD") || "").trim();

  if (!smtpUser || !smtpPass) return null;

  const smtpFromAddr = (Deno.env.get("SMTP_FROM") || smtpUser).trim();
  const smtpFrom = `Embaixadores dos Legendarios <${smtpFromAddr}>`;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  return { transporter, smtpFrom };
}

async function sendEmail(
  transporter: any,
  from: string,
  to: string,
  subject: string,
  textBody: string,
  htmlTitle: string,
  htmlBody: string,
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: textBody,
      html: buildEmailHtml(htmlTitle, htmlBody),
    });
    return true;
  } catch {
    return false;
  }
}

// ── Reminder types ──────────────────────────────────────────────────

type ReminderType = "payments" | "renewals" | "birthdays" | "events";

interface ReminderSummary {
  payments: number;
  renewals: number;
  birthdays: number;
  events: number;
  errors: string[];
}

async function processPaymentReminders(
  supabase: any,
  zapiConfig: ZApiConfig | null,
  smtp: { transporter: any; smtpFrom: string } | null,
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;

  try {
    const now = Date.now();
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;

    // Payments pending with due date within next 3 days (and not already past)
    const { data, error } = await supabase
      .from("pagamentos")
      .select("*, embaixadores!inner(nomeCompleto, email, telefone)")
      .eq("status", "pendente")
      .gte("dataVencimento", now)
      .lte("dataVencimento", threeDaysFromNow);

    if (error) {
      errors.push(`Query pagamentos: ${error.message}`);
      return { sent, errors };
    }

    if (!data || data.length === 0) return { sent, errors };

    for (const pag of data) {
      const emb = pag.embaixadores;
      const dias = daysBetween(now, pag.dataVencimento);
      const diasLabel = dias <= 0 ? "hoje" : dias === 1 ? "1 dia" : `${dias} dias`;
      const vencimento = formatDateOnly(pag.dataVencimento);

      const waMsg = `Ola ${emb.nomeCompleto}, seu pagamento de R$ ${pag.valor} vence em ${diasLabel} (${vencimento}).`;
      const emailSubject = `Lembrete de pagamento - vence em ${diasLabel}`;
      const emailBody = `<p>Ola <strong>${emb.nomeCompleto}</strong>,</p>
<p>Seu pagamento de <strong>R$ ${pag.valor}</strong> vence em <strong>${diasLabel}</strong> (${vencimento}).</p>
<p>Por favor, regularize para manter seu status de embaixador ativo.</p>`;

      if (zapiConfig && emb.telefone) {
        const ok = await sendWhatsApp(zapiConfig, emb.telefone, waMsg);
        if (ok) sent++;
        else errors.push(`WhatsApp falhou: ${emb.nomeCompleto}`);
      }

      if (smtp && emb.email) {
        const ok = await sendEmail(
          smtp.transporter, smtp.smtpFrom, emb.email,
          emailSubject, waMsg, "Lembrete de Pagamento", emailBody,
        );
        if (ok) sent++;
        else errors.push(`Email falhou: ${emb.nomeCompleto}`);
      }
    }
  } catch (err: any) {
    errors.push(`Pagamentos error: ${err.message}`);
  }

  return { sent, errors };
}

async function processRenewalReminders(
  supabase: any,
  zapiConfig: ZApiConfig | null,
  smtp: { transporter: any; smtpFrom: string } | null,
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;

  try {
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const { data, error } = await supabase
      .from("embaixadores")
      .select("id, nomeCompleto, email, telefone, dataRenovacao")
      .eq("status", "ativo")
      .not("dataRenovacao", "is", null)
      .gte("dataRenovacao", now)
      .lte("dataRenovacao", thirtyDaysFromNow);

    if (error) {
      errors.push(`Query embaixadores renovacao: ${error.message}`);
      return { sent, errors };
    }

    if (!data || data.length === 0) return { sent, errors };

    for (const emb of data) {
      const dias = daysBetween(now, emb.dataRenovacao);
      const diasLabel = dias <= 0 ? "hoje" : dias === 1 ? "1 dia" : `${dias} dias`;
      const dataRenov = formatDateOnly(emb.dataRenovacao);

      const waMsg = `Ola ${emb.nomeCompleto}, sua renovacao como embaixador vence em ${diasLabel} (${dataRenov}).`;
      const emailSubject = `Renovacao de embaixador - vence em ${diasLabel}`;
      const emailBody = `<p>Ola <strong>${emb.nomeCompleto}</strong>,</p>
<p>Sua renovacao como embaixador vence em <strong>${diasLabel}</strong> (${dataRenov}).</p>
<p>Entre em contato para renovar e continuar fazendo parte dos Embaixadores dos Legendarios.</p>`;

      if (zapiConfig && emb.telefone) {
        const ok = await sendWhatsApp(zapiConfig, emb.telefone, waMsg);
        if (ok) sent++;
        else errors.push(`WhatsApp falhou: ${emb.nomeCompleto}`);
      }

      if (smtp && emb.email) {
        const ok = await sendEmail(
          smtp.transporter, smtp.smtpFrom, emb.email,
          emailSubject, waMsg, "Renovacao de Embaixador", emailBody,
        );
        if (ok) sent++;
        else errors.push(`Email falhou: ${emb.nomeCompleto}`);
      }
    }
  } catch (err: any) {
    errors.push(`Renovacao error: ${err.message}`);
  }

  return { sent, errors };
}

async function processBirthdayGreetings(
  supabase: any,
  zapiConfig: ZApiConfig | null,
  smtp: { transporter: any; smtpFrom: string } | null,
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;

  try {
    // Get all active embaixadores with dataNascimento set
    const { data, error } = await supabase
      .from("embaixadores")
      .select("id, nomeCompleto, email, telefone, dataNascimento")
      .eq("status", "ativo")
      .not("dataNascimento", "is", null);

    if (error) {
      errors.push(`Query embaixadores aniversario: ${error.message}`);
      return { sent, errors };
    }

    if (!data || data.length === 0) return { sent, errors };

    // Get today's day/month in BRT
    const now = new Date();
    const todayBRT = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayDay = todayBRT.getDate();
    const todayMonth = todayBRT.getMonth(); // 0-indexed

    const birthdayPeople = data.filter((emb: any) => {
      const birth = new Date(emb.dataNascimento);
      const birthBRT = new Date(birth.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      return birthBRT.getDate() === todayDay && birthBRT.getMonth() === todayMonth;
    });

    for (const emb of birthdayPeople) {
      const waMsg = `Feliz aniversario, ${emb.nomeCompleto}! \u{1F382} Os Embaixadores dos Legendarios desejam um dia abencoado.`;
      const emailSubject = `Feliz Aniversario, ${emb.nomeCompleto}!`;
      const emailBody = `<p style="font-size:16px;">Feliz aniversario, <strong>${emb.nomeCompleto}</strong>! \u{1F382}</p>
<p>Os Embaixadores dos Legendarios desejam um dia abencoado, repleto de alegria e gracas.</p>
<p>Que Deus continue te guiando e fortalecendo nesta jornada!</p>`;

      if (zapiConfig && emb.telefone) {
        const ok = await sendWhatsApp(zapiConfig, emb.telefone, waMsg);
        if (ok) sent++;
        else errors.push(`WhatsApp falhou: ${emb.nomeCompleto}`);
      }

      if (smtp && emb.email) {
        const ok = await sendEmail(
          smtp.transporter, smtp.smtpFrom, emb.email,
          emailSubject, waMsg, "Feliz Aniversario! \u{1F382}", emailBody,
        );
        if (ok) sent++;
        else errors.push(`Email falhou: ${emb.nomeCompleto}`);
      }
    }
  } catch (err: any) {
    errors.push(`Aniversario error: ${err.message}`);
  }

  return { sent, errors };
}

async function processEventReminders(
  supabase: any,
  zapiConfig: ZApiConfig | null,
  smtp: { transporter: any; smtpFrom: string } | null,
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;

  try {
    const now = Date.now();
    const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000;

    // Events happening within the next 24 hours
    const { data: eventos, error: evError } = await supabase
      .from("eventos")
      .select("id, titulo, data, local, linkMeet")
      .eq("status", "agendado")
      .gte("data", now)
      .lte("data", twentyFourHoursFromNow);

    if (evError) {
      errors.push(`Query eventos: ${evError.message}`);
      return { sent, errors };
    }

    if (!eventos || eventos.length === 0) return { sent, errors };

    for (const evento of eventos) {
      // Fetch participants for this event
      const { data: participantes, error: partError } = await supabase
        .from("evento_participantes")
        .select("nomeCompleto, email, telefone")
        .eq("eventoId", evento.id)
        .eq("status", "confirmado");

      if (partError) {
        errors.push(`Query participantes evento ${evento.id}: ${partError.message}`);
        continue;
      }

      if (!participantes || participantes.length === 0) continue;

      const horaStr = formatTimeOnly(evento.data);
      const localStr = evento.local || "a definir";

      for (const part of participantes) {
        const waMsg = `Lembrete: o evento ${evento.titulo} acontece amanha as ${horaStr} em ${localStr}.${evento.linkMeet ? `\nMeet: ${evento.linkMeet}` : ""}`;
        const emailSubject = `Lembrete: ${evento.titulo} - amanha`;
        const emailBody = `<p>Ola <strong>${part.nomeCompleto}</strong>,</p>
<p>Lembrete: o evento <strong>${evento.titulo}</strong> acontece amanha as <strong>${horaStr}</strong> em <strong>${localStr}</strong>.</p>
${evento.linkMeet ? `<p><a href="${evento.linkMeet}" style="color:#FF6B00;">Entrar na reuniao (Google Meet)</a></p>` : ""}`;

        if (zapiConfig && part.telefone) {
          const ok = await sendWhatsApp(zapiConfig, part.telefone, waMsg);
          if (ok) sent++;
          else errors.push(`WhatsApp falhou: ${part.nomeCompleto}`);
        }

        if (smtp && part.email) {
          const ok = await sendEmail(
            smtp.transporter, smtp.smtpFrom, part.email,
            emailSubject, waMsg, "Lembrete de Evento", emailBody,
          );
          if (ok) sent++;
          else errors.push(`Email falhou: ${part.nomeCompleto}`);
        }
      }
    }
  } catch (err: any) {
    errors.push(`Eventos error: ${err.message}`);
  }

  return { sent, errors };
}

// ── Main handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Parse request body (optional type param)
    let reminderType: string = "all";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.type) reminderType = body.type;
      } catch {
        // No body or invalid JSON — default to "all"
      }
    }

    const validTypes = ["payments", "renewals", "birthdays", "events", "all"];
    if (!validTypes.includes(reminderType)) {
      return new Response(
        JSON.stringify({ error: `type deve ser: ${validTypes.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Service role client for querying all data
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Initialize channels
    const zapiConfig = getZApiConfig();
    const smtp = getSmtpTransporter();

    const summary: ReminderSummary = {
      payments: 0,
      renewals: 0,
      birthdays: 0,
      events: 0,
      errors: [],
    };

    const shouldRun = (type: ReminderType) =>
      reminderType === "all" || reminderType === type;

    // Process each reminder type independently — failures don't block others
    if (shouldRun("payments")) {
      const result = await processPaymentReminders(supabase, zapiConfig, smtp);
      summary.payments = result.sent;
      summary.errors.push(...result.errors);
    }

    if (shouldRun("renewals")) {
      const result = await processRenewalReminders(supabase, zapiConfig, smtp);
      summary.renewals = result.sent;
      summary.errors.push(...result.errors);
    }

    if (shouldRun("birthdays")) {
      const result = await processBirthdayGreetings(supabase, zapiConfig, smtp);
      summary.birthdays = result.sent;
      summary.errors.push(...result.errors);
    }

    if (shouldRun("events")) {
      const result = await processEventReminders(supabase, zapiConfig, smtp);
      summary.events = result.sent;
      summary.errors.push(...result.errors);
    }

    console.log(`[reminders] Summary:`, JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`[reminders] Fatal error:`, err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
