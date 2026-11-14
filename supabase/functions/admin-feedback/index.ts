// Read-only list of everything submitted through the feedback forms, for /admin → Analytics.
// The feedback table has no public read access; this uses the service role and only answers
// callers who know the admin password (same x-admin-key as Connect Ops and admin-analytics).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-key, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LIMIT = 500; // newest first

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = requireAdmin(req, corsHeaders, { scope: "admin-feedback", max: 60 });
  if (denied) return denied;

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // select("*") on purpose: older databases may not have every newer column yet.
    const { data, error, count } = await db
      .from("feedback")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, total: count ?? data?.length ?? 0, shown: data?.length ?? 0, rows: data ?? [] });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
