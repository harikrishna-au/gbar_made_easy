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

async function getClerkIdentity(req: Request) {
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
    if (!response.ok) return null;
    const user = await response.json();
    const emails = (user.email_addresses ?? [])
      .map((entry: { email_address?: string }) => entry.email_address?.trim().toLowerCase())
      .filter(Boolean);
    return { userId: payload.sub as string, emails: [...new Set(emails)] as string[] };
  } catch {
    return null;
  }
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
    const { data, error } = await supabase
      .from("bookings")
      .select("id, expert_id, user_name, user_email, message, date, start_time, end_time, meet_link, status, created_at, experts(id, name, title, photo_url)")
      .in("user_email", identity.emails)
      .order("date", { ascending: false });
    if (error) throw error;

    return json({ bookings: data ?? [], emails: identity.emails });
  } catch (error) {
    console.error("[connect-my-bookings]", error);
    return json({ error: error instanceof Error ? error.message : "Could not load bookings" }, 400);
  }
});
