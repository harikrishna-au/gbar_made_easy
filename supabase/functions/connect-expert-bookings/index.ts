import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function verifyClerkUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const secret = Deno.env.get("CLERK_SECRET_KEY");
  if (!token || !secret) return null;

  try {
    const [, encodedPayload] = token.split(".");
    if (!encodedPayload) return null;
    const normalized = encodedPayload.replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    if (!payload.sub || (payload.exp && payload.exp * 1000 < Date.now())) return null;

    const response = await fetch(`https://api.clerk.com/v1/users/${payload.sub}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    return response.ok ? payload.sub as string : null;
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clerkUserId = await verifyClerkUser(req);
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

    return json({ bookings: data ?? [] });
  } catch (error) {
    console.error("[connect-expert-bookings]", error);
    return json({ error: error instanceof Error ? error.message : "Could not load bookings" }, 400);
  }
});
