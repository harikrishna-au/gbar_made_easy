// Read-only analytics for the /admin → Analytics tab.
// analytics_events has no public read access; this function reads it with the service role
// and only answers callers who know the admin password (same x-admin-key as Connect Ops).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/guard.ts";
import { computeStats, type EventRow } from "../_shared/analytics-stats.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-key, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const WINDOW_DAYS = 90;     // how much history is read (retention needs the full window)
const PAGE = 1000;          // PostgREST page size
const MAX_PAGES = 60;       // hard cap: 60,000 events per request

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = requireAdmin(req, corsHeaders, { scope: "admin-analytics", max: 60 });
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));
    const days = [7, 30, 90].includes(body?.days) ? body.days : 30;

    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

    const rows: EventRow[] = [];
    let truncated = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await db
        .from("analytics_events")
        .select("created_at,event,anon_id,session_id,user_id,path,referrer,utm_source,device,is_pwa,props")
        .gte("created_at", since)
        .order("id", { ascending: true })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) {
        // Most likely the migration has not been run yet.
        return json({ error: error.message, hint: "Run supabase/migrations/20261114_analytics_events.sql" }, 500);
      }
      rows.push(...(data as EventRow[]));
      if (!data || data.length < PAGE) break;
      if (page === MAX_PAGES - 1) truncated = true;
    }

    return json({ ok: true, generatedAt: new Date().toISOString(), rows: rows.length, truncated, stats: computeStats(rows, days) });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
