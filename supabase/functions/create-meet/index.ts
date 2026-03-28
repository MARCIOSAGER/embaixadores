import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Verify authenticated user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Nao autorizado" }), {
        status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { title, date, googleToken } = await req.json();

    if (!googleToken) {
      return new Response(JSON.stringify({ error: "Google token necessario. Faca login com Google." }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Create Google Calendar event with Meet conferencing
    const startDate = date ? new Date(date) : new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

    const event = {
      summary: title || "Reunião Embaixadores dos Legendários",
      start: { dateTime: startDate.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: endDate.toISOString(), timeZone: "America/Sao_Paulo" },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const calData = await calRes.json();

    if (!calRes.ok) {
      return new Response(JSON.stringify({
        error: "Erro ao criar evento no Google Calendar",
        details: calData.error?.message || calData
      }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const meetLink = calData.conferenceData?.entryPoints?.find(
      (e: any) => e.entryPointType === "video"
    )?.uri || calData.hangoutLink || null;

    return new Response(JSON.stringify({
      success: true,
      meetLink,
      eventId: calData.id,
      eventLink: calData.htmlLink,
    }), {
      status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
