import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyClerkToken } from "../_shared/clerk.ts";

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

const REVEAL_EMAIL_STATUSES = new Set(["confirmed", "completed"]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const clerkUserId = await verifyClerkToken(token);
  if (!clerkUserId) return json({ error: "Unauthorized" }, 401);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: experts, error: expertError } = await supabase
      .from("experts")
      .select("id")
      .eq("user_id", clerkUserId);
    if (expertError) throw expertError;

    const expertIds = (experts ?? []).map((expert) => expert.id);
    if (!expertIds.length) return json({ bookings: [] });

    const { data, error } = await supabase
      .from("bookings")
      .select("id, expert_id, user_name, user_email, message, date, start_time, end_time, meet_link, status, created_at, experts(name, photo_url, price_inr)")
      .in("expert_id", expertIds)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;

    const bookings = (data ?? []).map((booking) => ({
      ...booking,
      user_email: REVEAL_EMAIL_STATUSES.has(booking.status) ? booking.user_email : null,
    }));
    return json({ bookings });
  } catch (error) {
    console.error("[connect-expert-bookings]", error);
    return json({ error: error instanceof Error ? error.message : "Could not load bookings" }, 400);
  }
});
