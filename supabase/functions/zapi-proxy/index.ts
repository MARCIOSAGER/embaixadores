import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getZapiCreds() {
  return {
    instanceId: (Deno.env.get("ZAPI_INSTANCE_ID") || "").trim(),
    token: (Deno.env.get("ZAPI_TOKEN") || "").trim(),
    clientToken: (Deno.env.get("ZAPI_CLIENT_TOKEN") || "").trim(),
  };
}

function zapiUrl(path: string): string {
  const { instanceId, token } = getZapiCreds();
  return `https://api.z-api.io/instances/${instanceId}/token/${token}${path}`;
}

function zapiHeaders(): Record<string, string> {
  const { clientToken } = getZapiCreds();
  return clientToken ? { "Client-Token": clientToken, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function json(data: any, status = 200) {
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

    // Admin check
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: userData } = await supabaseAdmin.from("users").select("role").eq("openId", user.id).single();
    if (userData?.role !== "admin") return json({ error: "Apenas administradores" }, 403);

    // Check Z-API is configured
    if (!Deno.env.get("ZAPI_INSTANCE_ID") || !Deno.env.get("ZAPI_TOKEN")) {
      return json({ error: "Z-API nao configurado" }, 500);
    }

    const { action, phone, message } = await req.json();

    switch (action) {
      case "status": {
        const res = await fetch(zapiUrl("/status"), { headers: zapiHeaders() });
        const data = await res.json();
        return json(data);
      }

      case "qrcode": {
        const res = await fetch(zapiUrl("/qr-code/image"), { headers: zapiHeaders() });
        const data = await res.json();
        return json(data);
      }

      case "disconnect": {
        const res = await fetch(zapiUrl("/disconnect"), { headers: zapiHeaders() });
        const data = await res.json();
        return json(data);
      }

      case "send": {
        if (!phone || !message) return json({ error: "phone e message obrigatorios" }, 400);
        const cleanPhone = phone.replace(/\D/g, "");
        const res = await fetch(zapiUrl("/send-text"), {
          method: "POST",
          headers: zapiHeaders(),
          body: JSON.stringify({ phone: cleanPhone, message }),
        });
        const data = await res.json();
        return json({ success: res.ok, data });
      }

      default:
        return json({ error: "action deve ser: status, qrcode, disconnect, send" }, 400);
    }
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
