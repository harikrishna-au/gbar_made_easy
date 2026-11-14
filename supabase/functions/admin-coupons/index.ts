// Read-only coupon usage for /admin → Payments. coupon_usages used to be publicly readable,
// which exposed coupon names; this reads it with the service role behind the admin password.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/guard.ts";
import { tallyCoupons, type CouponRow } from "../_shared/coupon.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-key, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PAGE = 1000;
const MAX_PAGES = 50; // up to 50,000 redemptions

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = requireAdmin(req, corsHeaders, { scope: "admin-coupons", max: 60 });
  if (denied) return denied;

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const rows: CouponRow[] = [];
    let truncated = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await db
        .from("coupon_usages")
        .select("coupon_code,created_at")
        .order("created_at", { ascending: true })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) return json({ error: error.message }, 500);
      rows.push(...(data as CouponRow[]));
      if (!data || data.length < PAGE) break;
      if (page === MAX_PAGES - 1) truncated = true;
    }
    const coupons = tallyCoupons(rows);
    return json({ ok: true, truncated, rows: rows.length, totalRedemptions: coupons.reduce((n, c) => n + c.count, 0), coupons });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
