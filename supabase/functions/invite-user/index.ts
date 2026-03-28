import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://embaixadores.marciosager.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(data: unknown, status = 200, req?: Request) {
  const headers = req ? getCorsHeaders(req) : { "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0] };
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, req);
  }

  try {
    // Verify authenticated user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: "Nao autorizado" }, 401, req);

    // Admin check using service role
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
      return json({ error: "Apenas administradores podem convidar usuarios" }, 403, req);
    }

    // Parse request body
    const { email, role } = await req.json();
    if (!email || typeof email !== "string" || !email.trim()) {
      return json({ error: "email e obrigatorio" }, 400, req);
    }

    // Invite user using service role key
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
      data: role ? { role } : undefined,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("already been registered")) {
        return json(
          { error: "Este email ja esta cadastrado. Delete o usuario antes de reenviar o convite." },
          409,
          req
        );
      }
      return json({ error: msg || "Erro ao enviar convite" }, 400, req);
    }

    return json({ success: true, user: data.user }, 200, req);
  } catch (error) {
    return json({ error: error.message }, 500, req);
  }
});
