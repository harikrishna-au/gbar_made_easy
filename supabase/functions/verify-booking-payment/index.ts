import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
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

async function hmacSha256(message: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  const from = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(await response.text());
}

function receiptEmail(params: {
  heading: string;
  intro: string;
  student: string;
  expert: string;
  date: string;
  start: string;
  end: string;
  message?: string | null;
}) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#fafaf9;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden">
    <div style="background:#1c1917;padding:24px 28px;color:#fff">
      <div style="color:#a8a29e;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Harry The Blaze · Connect 1:1</div>
      <h1 style="font-size:21px;margin:8px 0 0">${escapeHtml(params.heading)}</h1>
    </div>
    <div style="padding:28px;color:#44403c">
      <p style="font-size:14px;line-height:1.6;margin:0 0 18px">${escapeHtml(params.intro)}</p>
      <div style="background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:16px 20px">
        <p style="margin:5px 0;font-size:13px"><span style="color:#78716c">Student:</span> <strong>${escapeHtml(params.student)}</strong></p>
        <p style="margin:5px 0;font-size:13px"><span style="color:#78716c">Expert:</span> <strong>${escapeHtml(params.expert)}</strong></p>
        <p style="margin:5px 0;font-size:13px"><span style="color:#78716c">Date:</span> <strong>${escapeHtml(params.date)}</strong></p>
        <p style="margin:5px 0;font-size:13px"><span style="color:#78716c">Time:</span> <strong>${escapeHtml(params.start.slice(0, 5))}–${escapeHtml(params.end.slice(0, 5))} IST</strong></p>
        ${params.message ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid #e7e5e4;font-size:13px"><span style="color:#78716c">Goal:</span><br>${escapeHtml(params.message)}</p>` : ""}
      </div>
      <p style="color:#78716c;font-size:12px;line-height:1.6;margin:18px 0 0">The Connect team will confirm the schedule and send one meeting link to both participants.</p>
    </div>
  </div>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const clerkUserId = await verifyClerkToken(token);
  if (!clerkUserId) return json({ error: "Please sign in again" }, 401);

  try {
    const {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing payment verification fields" }, 400);
    }

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) throw new Error("RAZORPAY_KEY_SECRET missing");

    const expectedSignature = await hmacSha256(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      secret,
    );
    if (expectedSignature !== razorpay_signature) {
      return json({ error: "Invalid payment signature" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, experts(name, email)")
      .eq("id", booking_id)
      .single();
    if (bookingError || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.clerk_user_id !== clerkUserId) return json({ error: "Booking ownership mismatch" }, 403);
    if (booking.razorpay_order_id !== razorpay_order_id) return json({ error: "Order mismatch" }, 400);

    if (["paid", "confirmed", "completed"].includes(booking.status)) {
      return json({ success: true, booking_id: booking.id, already_verified: true });
    }
    if (booking.status !== "payment_pending") {
      return json({ error: `Booking cannot be paid from status ${booking.status}` }, 409);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    if (!keyId) throw new Error("RAZORPAY_KEY_ID missing");
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` },
    });
    if (!paymentResponse.ok) {
      return json({ error: "Could not confirm payment with Razorpay. Try again in a moment." }, 502);
    }
    const payment = await paymentResponse.json();
    if (payment.order_id !== razorpay_order_id) {
      return json({ error: "Payment does not belong to this order" }, 400);
    }
    if (!["captured", "authorized"].includes(payment.status)) {
      return json({ error: "Payment is not captured yet" }, 409);
    }
    if (booking.payment_amount && payment.amount !== booking.payment_amount * 100) {
      return json({ error: "Paid amount does not match this booking" }, 400);
    }

    const verifiedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({
        razorpay_payment_id,
        status: "paid",
        payment_verified_at: verifiedAt,
        payment_failure_reason: null,
      })
      .eq("id", booking.id)
      .eq("status", "payment_pending")
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      const { data: raced } = await supabase
        .from("bookings")
        .select("status")
        .eq("id", booking.id)
        .single();
      if (raced && ["paid", "confirmed", "completed"].includes(raced.status)) {
        return json({ success: true, booking_id: booking.id, already_verified: true });
      }
      throw new Error("Could not finalize booking");
    }

    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "payment_verified",
      from_status: "payment_pending",
      to_status: "paid",
      details: { razorpay_order_id, razorpay_payment_id, source: "client" },
    });

    const expert = booking.experts as { name: string; email: string | null } | null;
    const emailBase = {
      student: booking.user_name,
      expert: expert?.name ?? "Expert",
      date: booking.date,
      start: booking.start_time,
      end: booking.end_time,
      message: booking.message,
    };
    const notifications = [
      booking.user_email
        ? sendEmail(
            booking.user_email,
            `Payment received — Connect 1:1 with ${expert?.name ?? "your expert"}`,
            receiptEmail({
              ...emailBase,
              heading: "Your booking request is received",
              intro: "Your payment is verified. Our team is now arranging the call.",
            }),
          )
        : Promise.resolve(),
      expert?.email
        ? sendEmail(
            expert.email,
            `New paid Connect request — ${booking.user_name}`,
            receiptEmail({
              ...emailBase,
              heading: "A student booked a session",
              intro: "This request is paid. The Connect team will coordinate and send the meeting link.",
            }),
          )
        : Promise.resolve(),
    ];

    const adminEmail = Deno.env.get("CONNECT_ADMIN_EMAIL");
    if (adminEmail) {
      notifications.push(sendEmail(
        adminEmail,
        `Connect action needed — ${booking.user_name} with ${expert?.name ?? "expert"}`,
        receiptEmail({
          ...emailBase,
          heading: "New booking needs action",
          intro: "Open Connect Ops to review, confirm, and send the meeting link.",
        }),
      ));
    }
    const notificationResults = await Promise.allSettled(notifications);
    const failures = notificationResults.filter((result) => result.status === "rejected");
    if (failures.length) console.error("[verify-booking-payment] notification failures", failures);

    return json({ success: true, booking_id: booking.id, meet_link: null });
  } catch (error) {
    console.error("[verify-booking-payment]", error);
    return json({ error: error instanceof Error ? error.message : "Verification failed" }, 400);
  }
});
