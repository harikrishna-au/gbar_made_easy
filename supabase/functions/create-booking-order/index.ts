import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "npm:razorpay@2.9.2";
import { getClerkIdentity } from "../_shared/clerk.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const identity = await getClerkIdentity(req);
  if (!identity) return json({ error: "Please sign in again before booking" }, 401);

  try {
    const { booking_data } = await req.json();
    if (!booking_data) return json({ error: "booking_data is required" }, 400);

    const {
      expert_id,
      user_name,
      message,
      date,
      start_time,
      end_time,
    } = booking_data;

    if (!expert_id || !user_name?.trim() || !date || !start_time || !end_time) {
      return json({ error: "Complete all booking details" }, 400);
    }
    if (!identity.email || !EMAIL_RE.test(identity.email)) {
      return json({ error: "Your account needs a valid email address" }, 400);
    }
    if (!TIME_RE.test(start_time) || !TIME_RE.test(end_time) || toMinutes(start_time) >= toMinutes(end_time)) {
      return json({ error: "Invalid session time" }, 400);
    }
    if (user_name.trim().length > 100 || (message?.trim().length ?? 0) > 1000) {
      return json({ error: "Booking details are too long" }, 400);
    }

    const sessionStart = new Date(`${date}T${start_time}+05:30`);
    if (!Number.isFinite(sessionStart.getTime()) || sessionStart.getTime() <= Date.now()) {
      return json({ error: "Choose a future session time" }, 400);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Release expired checkout holds before checking this slot.
    await supabase
      .from("bookings")
      .update({ status: "payment_expired", payment_failure_reason: "Checkout hold expired" })
      .eq("status", "payment_pending")
      .lt("payment_expires_at", new Date().toISOString());

    const { data: expert, error: expertError } = await supabase
      .from("experts")
      .select("id, name, price_inr, approved")
      .eq("id", expert_id)
      .eq("approved", true)
      .single();
    if (expertError || !expert) return json({ error: "Expert is unavailable" }, 404);

    const dayOfWeek = new Date(`${date}T12:00:00+05:30`).getDay();
    const { data: windows, error: windowError } = await supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("expert_id", expert_id)
      .eq("day_of_week", dayOfWeek);
    if (windowError) throw windowError;
    if (!windows?.some((window) => start_time >= window.start_time && end_time <= window.end_time)) {
      return json({ error: "This time is outside the expert's availability" }, 400);
    }

    const { data: conflict } = await supabase
      .from("bookings")
      .select("id")
      .eq("expert_id", expert_id)
      .eq("date", date)
      .eq("start_time", start_time)
      .in("status", ["payment_pending", "paid", "confirmed"])
      .maybeSingle();
    if (conflict) return json({ error: "This slot was just taken. Choose another time." }, 409);

    const { data: overlap } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("clerk_user_id", identity.userId)
      .eq("date", date)
      .in("status", ["payment_pending", "paid", "confirmed"]);
    if ((overlap ?? []).some((item) => start_time < item.end_time && end_time > item.start_time)) {
      return json({ error: "You already have a booking during this time" }, 409);
    }

    const platformFee = Math.round(expert.price_inr * 0.1);
    const totalAmount = expert.price_inr + platformFee;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        expert_id,
        clerk_user_id: identity.userId,
        user_name: user_name.trim(),
        user_email: identity.email,
        message: message?.trim() || null,
        date,
        start_time,
        end_time,
        status: "payment_pending",
        payment_amount: totalAmount,
        payment_expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (bookingError) {
      if (bookingError.code === "23505") return json({ error: "This slot was just taken" }, 409);
      throw bookingError;
    }

    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: `connect_${booking.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          booking_id: booking.id,
          user_id: identity.userId,
          expert_id,
          type: "expert_session",
        },
      });

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ razorpay_order_id: order.id })
        .eq("id", booking.id);
      if (updateError) throw updateError;

      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "checkout_started",
        from_status: null,
        to_status: "payment_pending",
        details: { razorpay_order_id: order.id, expires_at: expiresAt },
      });

      return json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        booking_id: booking.id,
        expires_at: expiresAt,
      });
    } catch (error) {
      await supabase
        .from("bookings")
        .update({
          status: "payment_failed",
          payment_failure_reason: error instanceof Error ? error.message : "Order creation failed",
        })
        .eq("id", booking.id);
      throw error;
    }
  } catch (error) {
    console.error("[create-booking-order]", error);
    return json({ error: error instanceof Error ? error.message : "Could not create booking" }, 400);
  }
});
