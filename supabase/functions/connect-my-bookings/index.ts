import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClerkIdentity } from "../_shared/clerk.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const identity = await getClerkIdentity(req);
  if (!identity) return json({ error: "Unauthorized" }, 401);
  if (!identity.emails.length) return json({ bookings: [], emails: [] });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const selection = "id, expert_id, user_name, user_email, message, date, start_time, end_time, meet_link, status, created_at, experts(id, name, title, photo_url)";
    const [{ data: owned, error: ownedError }, { data: legacy, error: legacyError }] = await Promise.all([
      supabase
        .from("bookings")
        .select(selection)
        .eq("clerk_user_id", identity.userId)
        .order("date", { ascending: false }),
      supabase
        .from("bookings")
        .select(selection)
        .is("clerk_user_id", null)
        .in("user_email", identity.emails)
        .order("date", { ascending: false }),
    ]);
    if (ownedError) throw ownedError;
    if (legacyError) throw legacyError;

    const merged = [...(owned ?? []), ...(legacy ?? [])]
      .filter((booking, index, all) => all.findIndex((item) => item.id === booking.id) === index)
      .sort((a, b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`));

    return json({ bookings: merged, emails: identity.emails });
  } catch (error) {
    console.error("[connect-my-bookings]", error);
    return json({ error: error instanceof Error ? error.message : "Could not load bookings" }, 400);
  }
});
