import "@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Token obrigatorio" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      return new Response(JSON.stringify({ success: false, error: "Turnstile nao configurado" }), {
        status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: result.success }), {
      status: result.success ? 200 : 403,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
