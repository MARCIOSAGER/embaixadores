import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

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

const LOGO_URL = "https://embaixadores.marciosager.com/logo-legendarios.png";

function buildEmailHtml(title: string, body: string, buttonText?: string, buttonUrl?: string) {
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
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function buildCalendarLink(title: string, ts: number, tsEnd?: number, location?: string, meetLink?: string): string {
  const start = new Date(ts).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(tsEnd || ts + 3600000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
  });
  if (location) params.set("location", location);
  if (meetLink) params.set("details", `Meet: ${meetLink}`);
  return `https://calendar.google.com/calendar/render?${params}`;
}

// --- SERVER-SIDE TEMPLATES ---

interface EventoData { titulo: string; data: number; dataFim?: number; local?: string; linkMeet?: string; tipo?: string; descricao?: string; }
interface TercaData { tema: string; data: number; pregador?: string; linkMeet?: string; versiculoBase?: string; }
interface EntrevistaData { nomeCandidato: string; dataEntrevista: number; linkMeet?: string; indicadoPor?: string; emailCandidato?: string; telefoneCandidato?: string; }

function buildEventoMsg(ev: EventoData) {
  const dateStr = formatDate(ev.data);
  const calLink = buildCalendarLink(ev.titulo, ev.data, ev.dataFim, ev.local, ev.linkMeet);
  const whatsapp = `*${ev.titulo}*\nData: ${dateStr}\nLocal: ${ev.local || "A definir"}${ev.linkMeet ? `\nMeet: ${ev.linkMeet}` : ""}\n\nSalvar na agenda: ${calLink}`;
  const emailBody = `<strong>Data:</strong> ${dateStr}<br><strong>Local:</strong> ${ev.local || "A definir"}${ev.linkMeet ? `<br><br><a href="${ev.linkMeet}" style="color:#FF6B00;">Entrar na reuniao (Google Meet)</a>` : ""}<br><br><a href="${calLink}" style="color:#FF6B00;">Salvar na agenda</a>`;
  return { whatsapp, emailSubject: `Evento: ${ev.titulo}`, emailTitle: ev.titulo, emailBody };
}

function buildTercaMsg(tg: TercaData) {
  const dateStr = formatDate(tg.data);
  const calLink = buildCalendarLink(`Terca de Gloria - ${tg.tema}`, tg.data, undefined, undefined, tg.linkMeet);
  const whatsapp = `*Terca de Gloria*\nTema: ${tg.tema}\nData: ${dateStr}\nPregador: ${tg.pregador || "A definir"}${tg.linkMeet ? `\nMeet: ${tg.linkMeet}` : ""}\n\nSalvar na agenda: ${calLink}`;
  const emailBody = `<strong>Tema:</strong> ${tg.tema}<br><strong>Data:</strong> ${dateStr}<br><strong>Pregador:</strong> ${tg.pregador || "A definir"}${tg.linkMeet ? `<br><br><a href="${tg.linkMeet}" style="color:#FF6B00;">Entrar na reuniao (Google Meet)</a>` : ""}<br><br><a href="${calLink}" style="color:#FF6B00;">Salvar na agenda</a>`;
  return { whatsapp, emailSubject: `Terca de Gloria: ${tg.tema}`, emailTitle: `Terca de Gloria - ${tg.tema}`, emailBody };
}

function buildEntrevistaMsg(ent: EntrevistaData) {
  const dateStr = formatDate(ent.dataEntrevista);
  const calLink = buildCalendarLink(`Entrevista - ${ent.nomeCandidato}`, ent.dataEntrevista, undefined, undefined, ent.linkMeet);
  const whatsapp = `*Entrevista Agendada*\nCandidato: ${ent.nomeCandidato}\nData: ${dateStr}\nIndicado por: ${ent.indicadoPor || "—"}${ent.linkMeet ? `\nMeet: ${ent.linkMeet}` : ""}\n\nSalvar na agenda: ${calLink}`;
  const emailBody = `<strong>Candidato:</strong> ${ent.nomeCandidato}<br><strong>Data:</strong> ${dateStr}<br><strong>Indicado por:</strong> ${ent.indicadoPor || "—"}${ent.linkMeet ? `<br><br><a href="${ent.linkMeet}" style="color:#FF6B00;">Entrar na reuniao (Google Meet)</a>` : ""}<br><br><a href="${calLink}" style="color:#FF6B00;">Salvar na agenda</a>`;
  return { whatsapp, emailSubject: `Entrevista: ${ent.nomeCandidato}`, emailTitle: `Entrevista - ${ent.nomeCandidato}`, emailBody };
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { type, id, channel, recipients = "all", includeCandidato = true } = await req.json();

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
    let msgData: { whatsapp: string; emailSubject: string; emailTitle: string; emailBody: string };
    let candidatePhone: string | null = null;
    let candidateEmail: string | null = null;

    if (type === "evento") {
      const { data, error } = await supabaseAdmin.from("eventos").select("*").eq("id", id).single();
      if (error || !data) return json({ error: "Evento nao encontrado" }, 404);
      msgData = buildEventoMsg(data);
    } else if (type === "terca") {
      const { data, error } = await supabaseAdmin.from("tercaGloria").select("*").eq("id", id).single();
      if (error || !data) return json({ error: "Reuniao nao encontrada" }, 404);
      msgData = buildTercaMsg(data);
    } else {
      const { data, error } = await supabaseAdmin.from("entrevistas").select("*").eq("id", id).single();
      if (error || !data) return json({ error: "Entrevista nao encontrada" }, 404);
      msgData = buildEntrevistaMsg(data);
      candidatePhone = data.telefoneCandidato || null;
      candidateEmail = data.emailCandidato || null;
    }

    // Fetch recipients
    let embaixadores: { id: number; nomeCompleto: string; email: string | null; telefone: string | null }[];
    if (recipients === "all") {
      const { data, error } = await supabaseAdmin
        .from("embaixadores")
        .select("id, nomeCompleto, email, telefone")
        .eq("status", "ativo");
      if (error) throw error;
      embaixadores = data || [];
    } else if (Array.isArray(recipients) && recipients.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("embaixadores")
        .select("id, nomeCompleto, email, telefone")
        .in("id", recipients);
      if (error) throw error;
      embaixadores = data || [];
    } else {
      embaixadores = [];
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

        const sendWa = async (phone: string, name: string) => {
          try {
            const cleanPhone = phone.replace(/\D/g, "");
            const res = await fetch(`${zapiBaseUrl}/send-text`, {
              method: "POST",
              headers: zapiHeaders,
              body: JSON.stringify({ phone: cleanPhone, message: msgData.whatsapp }),
            });
            if (res.ok) results.whatsapp.sent++;
            else { results.whatsapp.failed++; results.whatsapp.errors.push(`${name}: ${res.statusText}`); }
          } catch (err) { results.whatsapp.failed++; results.whatsapp.errors.push(`${name}: ${err.message}`); }
        };

        // Send to embaixadores
        for (const e of embaixadores.filter(e => e.telefone)) {
          await sendWa(e.telefone!, e.nomeCompleto);
        }

        // Send to candidate (entrevistas only)
        if (type === "entrevista" && includeCandidato && candidatePhone) {
          await sendWa(candidatePhone, "Candidato");
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

          const sendEmail = async (to: string, name: string) => {
            try {
              await transporter.sendMail({
                from: smtpFrom,
                to,
                subject: msgData.emailSubject,
                text: msgData.whatsapp,
                html: buildEmailHtml(msgData.emailTitle, msgData.emailBody),
              });
              results.email.sent++;
            } catch (err) { results.email.failed++; results.email.errors.push(`${name}: ${err.message}`); }
          };

          // Send to embaixadores
          for (const e of embaixadores.filter(e => e.email)) {
            await sendEmail(e.email!, e.nomeCompleto);
          }

          // Send to candidate (entrevistas only)
          if (type === "entrevista" && includeCandidato && candidateEmail) {
            await sendEmail(candidateEmail, "Candidato");
          }
        } catch (err) {
          results.email.errors.push(`SMTP connection: ${err.message}`);
        }
      }
    }

    return json({
      success: true,
      total: embaixadores.length + (type === "entrevista" && includeCandidato ? 1 : 0),
      results,
    });

  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
