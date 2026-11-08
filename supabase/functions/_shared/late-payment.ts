// A student can pay after the 15-minute checkout hold has expired (slow UPI
// app, closed tab, webhook retry). Razorpay has their money either way, so we
// must never silently drop it: re-claim the slot if it is still free, otherwise
// flag the booking so the Connect team refunds it.

const ACTIVE = ["payment_pending", "paid", "confirmed", "completed"];
export const LATE_STATUSES = ["payment_expired", "payment_failed"];

interface LateBooking {
  id: string;
  expert_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

// deno-lint-ignore no-explicit-any
export async function recoverLatePayment(
  supabase: any,
  booking: LateBooking,
  details: { razorpay_order_id: string; razorpay_payment_id: string; source: string },
): Promise<"paid" | "refund_needed"> {
  const now = new Date().toISOString();

  const { data: others, error } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, status, payment_expires_at")
    .eq("expert_id", booking.expert_id)
    .eq("date", booking.date)
    .neq("id", booking.id)
    .in("status", ACTIVE);
  if (error) throw error;

  const blocked = (others ?? []).some((other: Record<string, string>) =>
    booking.start_time < other.end_time &&
    booking.end_time > other.start_time &&
    (other.status !== "payment_pending" || other.payment_expires_at > now)
  );

  if (!blocked) {
    const { data: claimed, error: claimError } = await supabase
      .from("bookings")
      .update({
        status: "paid",
        razorpay_payment_id: details.razorpay_payment_id,
        payment_verified_at: now,
        payment_failure_reason: null,
      })
      .eq("id", booking.id)
      .in("status", LATE_STATUSES)
      .select("id")
      .maybeSingle();
    if (!claimError && claimed) {
      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "late_payment_recovered",
        from_status: booking.status,
        to_status: "paid",
        details,
      });
      return "paid";
    }
    // 23505 = someone took the slot between the check and the claim.
    if (claimError && claimError.code !== "23505") throw claimError;
  }

  await supabase
    .from("bookings")
    .update({
      razorpay_payment_id: details.razorpay_payment_id,
      payment_verified_at: now,
      payment_failure_reason: "LATE PAYMENT - slot no longer available. REFUND REQUIRED.",
    })
    .eq("id", booking.id)
    .in("status", LATE_STATUSES);
  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "late_payment_refund_needed",
    from_status: booking.status,
    to_status: booking.status,
    details,
  });
  return "refund_needed";
}
