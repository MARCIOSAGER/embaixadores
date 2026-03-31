/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length < 254;
}

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * send-report: Send a PDF report as email attachment.
 *
 * POST body: {
 *   to: string,         // recipient email
 *   subject: string,    // email subject
 *   body: string,       // email body text
 *   pdfBase64: string,  // PDF file as base64 string
 *   filename: string,   // attachment filename
 * }
 */
Deno.serve(async (req) => {
  _req = req;
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
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
    if (userData?.role !== "admin") return json({ error: "Apenas administradores" }, 403);

    const { to, subject, body, pdfBase64, filename } = await req.json();
    if (!to || !subject || !pdfBase64 || !filename) {
      return json({ error: "to, subject, pdfBase64 e filename sao obrigatorios" }, 400);
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return json({ error: "Endereco de email invalido" }, 400);
    }

    // Limit PDF size (base64 is ~4/3 of original, so check base64 length)
    const pdfSizeBytes = Math.ceil((pdfBase64.length * 3) / 4);
    if (pdfSizeBytes > MAX_PDF_SIZE_BYTES) {
      return json({ error: "PDF excede o tamanho maximo de 10MB" }, 400);
    }

    // Sanitize subject and body for email
    const safeSubject = escapeHtml(subject);
    const safeBody = body ? escapeHtml(body) : safeSubject;

    const smtpHost = (Deno.env.get("SMTP_HOST") || "smtp.hostinger.com").trim();
    const smtpPort = parseInt((Deno.env.get("SMTP_PORT") || "465").trim());
    const smtpUser = (Deno.env.get("SMTP_USER") || "").trim();
    const smtpPass = (Deno.env.get("SMTP_PASSWORD") || "").trim();
    const smtpFromAddr = (Deno.env.get("SMTP_FROM") || smtpUser).trim();
    const smtpFrom = `Embaixadores dos Legendarios <${smtpFromAddr}>`;

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
      to,
      subject: safeSubject,
      text: safeBody,
      attachments: [
        {
          filename,
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    });

    return json({ success: true, message: `Relatorio enviado para ${to}` });

  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
