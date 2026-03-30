import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

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

const LOGO_URL = "https://embaixadores.marciosager.com/logo-legendarios.png";

function buildEmailHtml(title: string, body: string, locale: Locale = "pt", buttonText?: string, buttonUrl?: string) {
  const footer = t("footer", locale);
  const buttonHtml = buttonText && buttonUrl ? `<div style="text-align:center;padding:24px 0 8px;">
        <a href="${buttonUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">${buttonText}</a>
      </div>` : "";
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

type Locale = "pt" | "es" | "en";

const i18n: Record<string, Record<Locale, string>> = {
  date: { pt: "Data", es: "Fecha", en: "Date" },
  local: { pt: "Local", es: "Lugar", en: "Location" },
  tbd: { pt: "A definir", es: "Por definir", en: "TBD" },
  meet: { pt: "Entrar na reuniao (Google Meet)", es: "Entrar a la reunion (Google Meet)", en: "Join meeting (Google Meet)" },
  saveCalendar: { pt: "Salvar na agenda", es: "Guardar en la agenda", en: "Save to calendar" },
  tema: { pt: "Tema", es: "Tema", en: "Topic" },
  pregador: { pt: "Pregador", es: "Predicador", en: "Preacher" },
  tercaTitle: { pt: "Terca de Gloria", es: "Martes de Gloria", en: "Tuesday of Glory" },
  candidato: { pt: "Candidato", es: "Candidato", en: "Candidate" },
  indicadoPor: { pt: "Indicado por", es: "Referido por", en: "Referred by" },
  entrevistaTitle: { pt: "Entrevista Agendada", es: "Entrevista Programada", en: "Interview Scheduled" },
  evento: { pt: "Evento", es: "Evento", en: "Event" },
  entrevista: { pt: "Entrevista", es: "Entrevista", en: "Interview" },
  footer: { pt: "Legendarios - Amor, Honra, Unidade", es: "Legendarios - Amor, Honor, Unidad", en: "Legendarios - Love, Honor, Unity" },
};

function t(key: string, locale: Locale): string {
  return i18n[key]?.[locale] || i18n[key]?.pt || key;
}

function formatDate(ts: number, locale: Locale): string {
  const loc = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Date(ts).toLocaleString(loc, {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function buildCalendarLink(title: string, ts: number, tsEnd?: number, location?: string, meetLink?: string): string {
  const start = new Date(ts).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(tsEnd || ts + 3600000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${start}/${end}` });
  if (location) params.set("location", location);
  if (meetLink) params.set("details", `Meet: ${meetLink}`);
  return `https://calendar.google.com/calendar/render?${params}`;
}

// --- SERVER-SIDE TEMPLATES ---

interface EventoData { titulo: string; data: number; dataFim?: number; local?: string; linkMeet?: string; tipo?: string; descricao?: string; }
interface TercaData { tema: string; data: number; pregador?: string; linkMeet?: string; versiculoBase?: string; }
interface EntrevistaData { nomeCandidato: string; dataEntrevista: number; linkMeet?: string; indicadoPor?: string; emailCandidato?: string; telefoneCandidato?: string; entrevistadorId?: number; }

function buildEventoMsg(ev: EventoData, locale: Locale) {
  const dateStr = formatDate(ev.data, locale);
  const calLink = buildCalendarLink(ev.titulo, ev.data, ev.dataFim, ev.local, ev.linkMeet);
  const whatsapp = `*${ev.titulo}*\n${t("date", locale)}: ${dateStr}\n${t("local", locale)}: ${ev.local || t("tbd", locale)}${ev.linkMeet ? `\nMeet: ${ev.linkMeet}` : ""}\n\n${t("saveCalendar", locale)}: ${calLink}`;
  const emailBody = `<strong>${t("date", locale)}:</strong> ${dateStr}<br><strong>${t("local", locale)}:</strong> ${ev.local || t("tbd", locale)}${ev.linkMeet ? `<br><br><a href="${ev.linkMeet}" style="color:#FF6B00;">${t("meet", locale)}</a>` : ""}<br><br><a href="${calLink}" style="color:#FF6B00;">${t("saveCalendar", locale)}</a>`;
  return { whatsapp, emailSubject: `${t("evento", locale)}: ${ev.titulo}`, emailTitle: ev.titulo, emailBody };
}

function buildTercaMsg(tg: TercaData, locale: Locale) {
  const dateStr = formatDate(tg.data, locale);
  const title = `${t("tercaTitle", locale)} - ${tg.tema}`;
  const calLink = buildCalendarLink(title, tg.data, undefined, undefined, tg.linkMeet);
  const whatsapp = `*${t("tercaTitle", locale)}*\n${t("tema", locale)}: ${tg.tema}\n${t("date", locale)}: ${dateStr}\n${t("pregador", locale)}: ${tg.pregador || t("tbd", locale)}${tg.linkMeet ? `\nMeet: ${tg.linkMeet}` : ""}\n\n${t("saveCalendar", locale)}: ${calLink}`;
  const emailBody = `<strong>${t("tema", locale)}:</strong> ${tg.tema}<br><strong>${t("date", locale)}:</strong> ${dateStr}<br><strong>${t("pregador", locale)}:</strong> ${tg.pregador || t("tbd", locale)}${tg.linkMeet ? `<br><br><a href="${tg.linkMeet}" style="color:#FF6B00;">${t("meet", locale)}</a>` : ""}<br><br><a href="${calLink}" style="color:#FF6B00;">${t("saveCalendar", locale)}</a>`;
  return { whatsapp, emailSubject: `${t("tercaTitle", locale)}: ${tg.tema}`, emailTitle: title, emailBody };
}

function buildEntrevistaMsg(ent: EntrevistaData, locale: Locale) {
  const dateStr = formatDate(ent.dataEntrevista, locale);
  const title = `${t("entrevista", locale)} - ${ent.nomeCandidato}`;
  const calLink = buildCalendarLink(title, ent.dataEntrevista, undefined, undefined, ent.linkMeet);
  const whatsapp = `*${t("entrevistaTitle", locale)}*\n${t("candidato", locale)}: ${ent.nomeCandidato}\n${t("date", locale)}: ${dateStr}\n${t("indicadoPor", locale)}: ${ent.indicadoPor || "—"}${ent.linkMeet ? `\nMeet: ${ent.linkMeet}` : ""}\n\n${t("saveCalendar", locale)}: ${calLink}`;
  const emailBody = `<strong>${t("candidato", locale)}:</strong> ${ent.nomeCandidato}<br><strong>${t("date", locale)}:</strong> ${dateStr}<br><strong>${t("indicadoPor", locale)}:</strong> ${ent.indicadoPor || "—"}${ent.linkMeet ? `<br><br><a href="${ent.linkMeet}" style="color:#FF6B00;">${t("meet", locale)}</a>` : ""}<br><br><a href="${calLink}" style="color:#FF6B00;">${t("saveCalendar", locale)}</a>`;
  return { whatsapp, emailSubject: `${t("entrevista", locale)}: ${ent.nomeCandidato}`, emailTitle: title, emailBody };
}

function formatDateOnly(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
}

function formatTimeOnly(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function buildEntrevistaCandidatoMsg(ent: EntrevistaData, entrevistadorNome: string) {
  const dataStr = formatDateOnly(ent.dataEntrevista);
  const horaStr = formatTimeOnly(ent.dataEntrevista);
  const title = `Entrevista - ${ent.nomeCandidato}`;
  const calLink = buildCalendarLink(title, ent.dataEntrevista, undefined, undefined, ent.linkMeet);

  const text = `Prezado ${ent.nomeCandidato},

AHU!

Informamos que recebemos e analisamos seu formulário de candidatura ao corpo de Embaixadores dos Legendários.

Temos a satisfação de comunicar que sua candidatura foi aprovada para a próxima fase do processo.

Você se encontra a dois passos de integrar um ambiente de homens de corações ensináveis, um ambiente espiritual de aliança, onde fé, propósito e excelência caminham juntos. Um lugar preparado por Deus que te levará a um novo nível na sua vida Relacional, Emocional e Espiritual.

O próximo passo consiste em uma conversa com o Embaixador ${entrevistadorNome}, responsável por esses homens Enviados ao Mundo para Baixar Dores. Trata-se de um momento de alinhamento de visão e conhecimento mútuo.

A agenda segue abaixo:
Dia ${dataStr} às ${horaStr}${ent.linkMeet ? `\nGoogle Meet: ${ent.linkMeet}` : ""}

Adicione ao seu calendário: ${calLink}

Permanecemos à disposição.

Respeitosamente,
Embaixadores Legendários`;

  const emailBody = text.replace(/\n/g, "<br>");

  return {
    whatsapp: text,
    emailSubject: `Entrevista - Embaixadores dos Legendários`,
    emailTitle: `Entrevista Agendada`,
    emailBody,
  };
}

function buildEntrevistaEntrevistadorMsg(ent: EntrevistaData) {
  const dataStr = formatDateOnly(ent.dataEntrevista);
  const horaStr = formatTimeOnly(ent.dataEntrevista);
  const title = `Entrevista - ${ent.nomeCandidato}`;
  const calLink = buildCalendarLink(title, ent.dataEntrevista, undefined, undefined, ent.linkMeet);

  const text = `Nova Entrevista Agendada

Candidato: ${ent.nomeCandidato}
Email: ${ent.emailCandidato || "—"}
Telefone: ${ent.telefoneCandidato || "—"}
Indicado por: ${ent.indicadoPor || "—"}
Data: ${dataStr} às ${horaStr}${ent.linkMeet ? `\nGoogle Meet: ${ent.linkMeet}` : ""}

Adicione ao seu calendário: ${calLink}`;

  const emailBody = text.replace(/\n/g, "<br>");

  return {
    whatsapp: text,
    emailSubject: `Nova Entrevista: ${ent.nomeCandidato}`,
    emailTitle: `Nova Entrevista Agendada`,
    emailBody,
  };
}

/**
 * notify-all v2: Server-side templates with admin check.
 *
 * Body: {
 *   type: "evento" | "terca" | "entrevista",
 *   id: number,
 *   channel: "whatsapp" | "email" | "both",
 *   recipients?: "all" | number[],  // "all" = all active embaixadores, number[] = specific embaixador IDs
 *   includeCandidato?: boolean,      // for entrevistas: also notify the candidate directly
 * }
 */
Deno.serve(async (req) => {
  _req = req;
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Verify authenticated ADMIN user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: "Nao autorizado" }, 401);

    // Admin check
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("openId", user.id)
      .single();
    if (userData?.role !== "admin") {
      return json({ error: "Apenas administradores podem enviar notificacoes" }, 403);
    }

    const { type, id, channel, recipients = "all", includeCandidato = true, entrevistadorId: reqEntrevistadorId, locale: reqLocale = "pt" } = await req.json();
    const locale: Locale = ["pt", "es", "en"].includes(reqLocale) ? reqLocale : "pt";

    if (!type || !id || !channel) {
      return json({ error: "type, id e channel sao obrigatorios" }, 400);
    }
    if (!["evento", "terca", "entrevista"].includes(type)) {
      return json({ error: "type deve ser: evento, terca, entrevista" }, 400);
    }
    if (!["whatsapp", "email", "both"].includes(channel)) {
      return json({ error: "channel deve ser: whatsapp, email, both" }, 400);
    }

    // Fetch event data from database
    let eventRecord: any;
    let candidatePhone: string | null = null;
    let candidateEmail: string | null = null;

    if (type === "evento") {
      const { data, error } = await supabaseAdmin.from("eventos").select("*").eq("id", id).single();
      if (error || !data) return json({ error: "Evento nao encontrado" }, 404);
      eventRecord = data;
    } else if (type === "terca") {
      const { data, error } = await supabaseAdmin.from("tercaGloria").select("*").eq("id", id).single();
      if (error || !data) return json({ error: "Reuniao nao encontrada" }, 404);
      eventRecord = data;
    } else {
      const { data, error } = await supabaseAdmin.from("entrevistas").select("*").eq("id", id).single();
      if (error || !data) return json({ error: "Entrevista nao encontrada" }, 404);
      eventRecord = data;
      candidatePhone = data.telefoneCandidato || null;
      candidateEmail = data.emailCandidato || null;
    }

    // Fetch entrevistador details
    let entrevistadorRecord: { id: number; nomeCompleto: string; email: string | null; telefone: string | null } | null = null;
    if (type === "entrevista") {
      const entIdToUse = reqEntrevistadorId || eventRecord.entrevistadorId;
      if (entIdToUse) {
        const { data: entData } = await supabaseAdmin
          .from("embaixadores")
          .select("id, nomeCompleto, email, telefone")
          .eq("id", entIdToUse)
          .single();
        entrevistadorRecord = entData || null;
      }
    }

    // Build messages per locale (cache to avoid rebuilding)
    const msgCache = new Map<Locale, ReturnType<typeof buildEventoMsg>>();
    function getMsgForLocale(loc: Locale) {
      if (msgCache.has(loc)) return msgCache.get(loc)!;
      let msg;
      if (type === "evento") msg = buildEventoMsg(eventRecord, loc);
      else if (type === "terca") msg = buildTercaMsg(eventRecord, loc);
      else msg = buildEntrevistaMsg(eventRecord, loc);
      msgCache.set(loc, msg);
      return msg;
    }

    // Fetch recipients (including their preferred locale)
    let embaixadores: { id: number; nomeCompleto: string; email: string | null; telefone: string | null; idioma: Locale }[];
    if (recipients === "all") {
      const { data, error } = await supabaseAdmin
        .from("embaixadores")
        .select("id, nomeCompleto, email, telefone, idioma")
        .eq("status", "ativo");
      if (error) throw error;
      embaixadores = (data || []).map((e: any) => ({ ...e, idioma: e.idioma || "pt" }));
    } else if (Array.isArray(recipients) && recipients.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("embaixadores")
        .select("id, nomeCompleto, email, telefone, idioma")
        .in("id", recipients);
      if (error) throw error;
      embaixadores = (data || []).map((e: any) => ({ ...e, idioma: e.idioma || "pt" }));
    } else {
      embaixadores = [];
    }

    // Dedup: remove entrevistador from generic list (they get their own template)
    if (type === "entrevista" && entrevistadorRecord) {
      embaixadores = embaixadores.filter(e => e.id !== entrevistadorRecord!.id);
    }

    const results = {
      whatsapp: { sent: 0, failed: 0, errors: [] as string[] },
      email: { sent: 0, failed: 0, errors: [] as string[] },
    };

    // --- SEND WHATSAPP ---
    if (channel === "whatsapp" || channel === "both") {
      const instanceId = (Deno.env.get("ZAPI_INSTANCE_ID") || "").trim();
      const zapiToken = (Deno.env.get("ZAPI_TOKEN") || "").trim();
      const clientToken = (Deno.env.get("ZAPI_CLIENT_TOKEN") || "").trim();

      if (!instanceId || !zapiToken) {
        results.whatsapp.errors.push("Z-API nao configurado");
      } else {
        const zapiBaseUrl = `https://api.z-api.io/instances/${instanceId}/token/${zapiToken}`;
        const zapiHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (clientToken) zapiHeaders["Client-Token"] = clientToken;

        const sendWa = async (phone: string, name: string, msg: string) => {
          try {
            const cleanPhone = phone.replace(/\D/g, "");
            const res = await fetch(`${zapiBaseUrl}/send-text`, {
              method: "POST",
              headers: zapiHeaders,
              body: JSON.stringify({ phone: cleanPhone, message: msg }),
            });
            if (res.ok) results.whatsapp.sent++;
            else { results.whatsapp.failed++; results.whatsapp.errors.push(`${name}: ${res.statusText}`); }
          } catch (err: any) { results.whatsapp.failed++; results.whatsapp.errors.push(`${name}: ${err.message}`); }
        };

        // Send to embaixadores (each in their preferred locale) - parallel in batches
        const waRecipients = embaixadores.filter(e => e.telefone);
        for (let i = 0; i < waRecipients.length; i += 10) {
          const batch = waRecipients.slice(i, i + 10);
          await Promise.allSettled(
            batch.map(e => {
              const msg = getMsgForLocale(e.idioma);
              return sendWa(e.telefone!, e.nomeCompleto, msg.whatsapp);
            })
          );
        }

        // Send to entrevistador (entrevistas only, informational template)
        if (type === "entrevista" && entrevistadorRecord?.telefone) {
          const entrevistadorMsg = buildEntrevistaEntrevistadorMsg(eventRecord);
          await sendWa(entrevistadorRecord.telefone, entrevistadorRecord.nomeCompleto, entrevistadorMsg.whatsapp);
        }

        // Send to candidate (entrevistas only, inspirational template)
        if (type === "entrevista" && includeCandidato && candidatePhone) {
          if (entrevistadorRecord) {
            const candidatoMsg = buildEntrevistaCandidatoMsg(eventRecord, entrevistadorRecord.nomeCompleto);
            await sendWa(candidatePhone, "Candidato", candidatoMsg.whatsapp);
          } else {
            const msg = getMsgForLocale(locale);
            await sendWa(candidatePhone, "Candidato", msg.whatsapp);
          }
        }
      }
    }

    // --- SEND EMAIL ---
    if (channel === "email" || channel === "both") {
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

          const sendEmail = async (to: string, name: string, loc: Locale) => {
            try {
              const msg = getMsgForLocale(loc);
              await transporter.sendMail({
                from: smtpFrom,
                to,
                subject: msg.emailSubject,
                text: msg.whatsapp,
                html: buildEmailHtml(msg.emailTitle, msg.emailBody, loc),
              });
              results.email.sent++;
            } catch (err: any) { results.email.failed++; results.email.errors.push(`${name}: ${err.message}`); }
          };

          // Send to embaixadores (each in their preferred locale) - parallel in batches
          const emailRecipients = embaixadores.filter(e => e.email);
          for (let i = 0; i < emailRecipients.length; i += 10) {
            const batch = emailRecipients.slice(i, i + 10);
            await Promise.allSettled(
              batch.map(e => sendEmail(e.email!, e.nomeCompleto, e.idioma))
            );
          }

          // Send to entrevistador (entrevistas only, informational template)
          if (type === "entrevista" && entrevistadorRecord?.email) {
            const entrevistadorMsg = buildEntrevistaEntrevistadorMsg(eventRecord);
            try {
              await transporter.sendMail({
                from: smtpFrom,
                to: entrevistadorRecord.email,
                subject: entrevistadorMsg.emailSubject,
                text: entrevistadorMsg.whatsapp,
                html: buildEmailHtml(entrevistadorMsg.emailTitle, entrevistadorMsg.emailBody),
              });
              results.email.sent++;
            } catch (err: any) { results.email.failed++; results.email.errors.push(`Entrevistador: ${err.message}`); }
          }

          // Send to candidate (entrevistas only, inspirational template)
          if (type === "entrevista" && includeCandidato && candidateEmail) {
            if (entrevistadorRecord) {
              const candidatoMsg = buildEntrevistaCandidatoMsg(eventRecord, entrevistadorRecord.nomeCompleto);
              try {
                await transporter.sendMail({
                  from: smtpFrom,
                  to: candidateEmail,
                  subject: candidatoMsg.emailSubject,
                  text: candidatoMsg.whatsapp,
                  html: buildEmailHtml(candidatoMsg.emailTitle, candidatoMsg.emailBody),
                });
                results.email.sent++;
              } catch (err: any) { results.email.failed++; results.email.errors.push(`Candidato: ${err.message}`); }
            } else {
              await sendEmail(candidateEmail, "Candidato", locale);
            }
          }
        } catch (err) {
          results.email.errors.push(`SMTP connection: ${err.message}`);
        }
      }
    }

    return json({
      success: true,
      total: embaixadores.length + (type === "entrevista" && includeCandidato ? 1 : 0) + (type === "entrevista" && entrevistadorRecord ? 1 : 0),
      results,
    });

  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
