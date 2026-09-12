import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-key, x-client-info",
};

const allowedStatuses = new Set([
  "paid",
  "payment_pending",
  "payment_expired",
  "payment_failed",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
  "refunded",
  "no_show",
]);
const allowedPriorities = new Set(["low", "normal", "high", "urgent"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isAuthorized(req: Request) {
  const expected = Deno.env.get("CONNECT_ADMIN_SECRET");
  const received = req.headers.get("x-admin-key") ?? "";
  if (!expected || !received) return false;
  return (await digest(expected)) === (await digest(received));
}

function cleanText(value: unknown, max: number) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

function validMeetLink(value: string | null | undefined) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function meetingEmail(params: {
  recipientName: string;
  otherName: string;
  date: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  isExpert: boolean;
  studentEmail?: string;
  message?: string | null;
}) {
  const recipientName = escapeHtml(params.recipientName);
  const otherName = escapeHtml(params.otherName);
  const date = escapeHtml(params.date);
  const startTime = escapeHtml(formatTime(params.startTime));
  const endTime = escapeHtml(formatTime(params.endTime));
  const meetLink = escapeHtml(params.meetLink);
  const studentEmail = escapeHtml(params.studentEmail);
  const message = escapeHtml(params.message);
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf9;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden">
    <div style="background:#1c1917;padding:24px 28px">
      <div style="color:#a8a29e;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Harry The Blaze · Connect 1:1</div>
      <h1 style="color:#fff;font-size:22px;margin:8px 0 0">Your session is confirmed</h1>
    </div>
    <div style="padding:28px">
      <p style="color:#44403c;font-size:14px;line-height:1.6;margin:0 0 20px">
        Hi <strong>${recipientName}</strong>, your 1:1 session with
        <strong>${otherName}</strong> is ready.
      </p>
      <div style="background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;color:#44403c"><span style="color:#78716c">Date</span><strong>${date}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;color:#44403c"><span style="color:#78716c">Time</span><strong>${startTime}–${endTime} IST</strong></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;color:#44403c"><span style="color:#78716c">${params.isExpert ? "Student" : "Expert"}</span><strong>${otherName}</strong></div>
        ${params.isExpert && params.studentEmail ? `<div style="display:flex;justify-content:space-between;padding:6px 0;color:#44403c"><span style="color:#78716c">Student email</span><strong>${studentEmail}</strong></div>` : ""}
        ${params.isExpert && params.message ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e7e5e4;color:#57534e;font-size:13px"><span style="color:#78716c">Student goal:</span><br>${message}</div>` : ""}
      </div>
      <a href="${meetLink}" style="display:block;background:#1c1917;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:600">Join the meeting</a>
      <p style="color:#78716c;font-size:12px;line-height:1.6;margin:16px 0 0">Keep this email. Both participants use the same secure meeting link.</p>
    </div>
  </div>`;
}

function statusEmail(params: {
  recipientName: string;
  otherName: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}) {
  const label = params.status.replaceAll("_", " ");
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf9;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden">
    <div style="background:#1c1917;padding:24px 28px;color:#fff">
      <div style="color:#a8a29e;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Harry The Blaze · Connect 1:1</div>
      <h1 style="font-size:21px;margin:8px 0 0">Session update: ${escapeHtml(label)}</h1>
    </div>
    <div style="padding:28px;color:#44403c">
      <p style="font-size:14px;line-height:1.6">Hi <strong>${escapeHtml(params.recipientName)}</strong>, the session with <strong>${escapeHtml(params.otherName)}</strong> has been updated.</p>
      <div style="background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:16px 20px">
        <p style="margin:5px 0;font-size:13px"><span style="color:#78716c">Status:</span> <strong style="text-transform:capitalize">${escapeHtml(label)}</strong></p>
        <p style="margin:5px 0;font-size:13px"><span style="color:#78716c">Schedule:</span> <strong>${escapeHtml(params.date)}, ${escapeHtml(formatTime(params.startTime))}–${escapeHtml(formatTime(params.endTime))} IST</strong></p>
        ${params.reason ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid #e7e5e4;font-size:13px"><span style="color:#78716c">Note:</span><br>${escapeHtml(params.reason)}</p>` : ""}
      </div>
      <p style="color:#78716c;font-size:12px;line-height:1.6;margin:18px 0 0">Reply to this email if you need help from the Connect team.</p>
    </div>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
  const from = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email failed: ${await response.text()}`);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!(await isAuthorized(req))) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (action === "authenticate") {
      return json({ authenticated: true });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, expert_id, clerk_user_id, user_name, user_email, message, date, start_time, end_time, razorpay_order_id, razorpay_payment_id, payment_amount, payment_verified_at, payment_expires_at, payment_failure_reason, refund_reference, refund_amount, refunded_at, cancellation_reason, meet_link, status, created_at, updated_at, admin_notes, priority, confirmed_at, completed_at, cancelled_at, meet_link_sent_at, experts(id, name, email, title, company, photo_url, price_inr)")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return json({ bookings: data ?? [] });
    }

    if (action === "list_experts") {
      const approved = body.approved === true;
      const { data, error } = await supabase
        .from("experts")
        .select("id, name, title, company, package_lpa, photo_url, proof_url, skills, approved, created_at")
        .eq("approved", approved)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ experts: data ?? [] });
    }

    if (action === "set_expert_approval") {
      if (!body.expert_id || typeof body.approved !== "boolean") {
        return json({ error: "expert_id and approved are required" }, 400);
      }
      const { data, error } = await supabase
        .from("experts")
        .update({ approved: body.approved })
        .eq("id", body.expert_id)
        .select("id, approved")
        .single();
      if (error) throw error;
      return json({ expert: data });
    }

    if (action === "events") {
      if (!body.booking_id) return json({ error: "booking_id is required" }, 400);
      const { data, error } = await supabase
        .from("booking_events")
        .select("*")
        .eq("booking_id", body.booking_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ events: data ?? [] });
    }

    if (action === "update_expert_contact") {
      if (!body.expert_id) return json({ error: "expert_id is required" }, 400);
      const email = cleanText(body.email, 254);
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: "Enter a valid expert email" }, 400);
      }
      const { data, error } = await supabase
        .from("experts")
        .update({ email: email.toLowerCase() })
        .eq("id", body.expert_id)
        .select("id, name, email, title, company, photo_url, price_inr")
        .single();
      if (error) throw error;
      return json({ expert: data });
    }

    if (action === "refund") {
      if (!body.booking_id) return json({ error: "booking_id is required" }, 400);
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*, experts(id, name, email, title, company, photo_url, price_inr)")
        .eq("id", body.booking_id)
        .single();
      if (bookingError || !booking) throw bookingError ?? new Error("Booking not found");
      if (!booking.razorpay_payment_id) return json({ error: "No captured payment to refund" }, 400);
      if (booking.status === "refunded") return json({ error: "This booking is already refunded" }, 409);

      const refundAmount = body.refund_amount == null
        ? Number(booking.payment_amount ?? 0)
        : Number(body.refund_amount);
      if (!Number.isInteger(refundAmount) || refundAmount <= 0) {
        return json({ error: "Refund amount must be a positive whole number" }, 400);
      }
      if (booking.payment_amount && refundAmount > booking.payment_amount) {
        return json({ error: "Refund cannot exceed the paid amount" }, 400);
      }

      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");

      const refundResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${booking.razorpay_payment_id}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: refundAmount * 100,
            notes: { booking_id: booking.id, source: "connect-admin" },
          }),
        },
      );
      const refundBody = await refundResponse.json().catch(() => ({}));
      if (!refundResponse.ok) {
        return json({ error: refundBody.error?.description || "Razorpay refund failed" }, 400);
      }

      const reason = cleanText(body.cancellation_reason, 1000) ?? booking.cancellation_reason;
      const refundedAt = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "refunded",
          refund_reference: refundBody.id ?? booking.refund_reference,
          refund_amount: refundAmount,
          refunded_at: refundedAt,
          cancelled_at: booking.cancelled_at ?? refundedAt,
          cancellation_reason: reason,
        })
        .eq("id", booking.id)
        .select("*, experts(id, name, email, title, company, photo_url, price_inr)")
        .single();
      if (updateError) throw updateError;

      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "refund_issued",
        from_status: booking.status,
        to_status: "refunded",
        details: { razorpay_refund_id: refundBody.id, refund_amount: refundAmount },
      });
      return json({ booking: updated });
    }

    if (action === "update") {
      if (!body.booking_id) return json({ error: "booking_id is required" }, 400);

      const { data: current, error: currentError } = await supabase
        .from("bookings")
        .select("id, expert_id, status, meet_link, date, start_time, end_time")
        .eq("id", body.booking_id)
        .single();
      if (currentError || !current) throw currentError ?? new Error("Booking not found");

      const updates: Record<string, unknown> = {};
      if (body.status !== undefined) {
        if (!allowedStatuses.has(body.status)) return json({ error: "Invalid status" }, 400);
        if (body.status === "confirmed") {
          const nextLink = cleanText(body.meet_link, 1000);
          const meetLink = nextLink !== undefined ? nextLink : current.meet_link;
          if (!meetLink) {
            return json({ error: "Add a meeting link, then use Confirm & send" }, 400);
          }
        }
        updates.status = body.status;
        if (body.status === "confirmed") updates.confirmed_at = new Date().toISOString();
        if (body.status === "completed") updates.completed_at = new Date().toISOString();
        if (body.status === "refunded") updates.refunded_at = new Date().toISOString();
        if (["cancelled", "declined", "refunded"].includes(body.status)) {
          updates.cancelled_at = new Date().toISOString();
        }
      }
      if (body.priority !== undefined) {
        if (!allowedPriorities.has(body.priority)) return json({ error: "Invalid priority" }, 400);
        updates.priority = body.priority;
      }
      const adminNotes = cleanText(body.admin_notes, 4000);
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;
      const cancellationReason = cleanText(body.cancellation_reason, 1000);
      if (cancellationReason !== undefined) updates.cancellation_reason = cancellationReason;
      const refundReference = cleanText(body.refund_reference, 500);
      if (refundReference !== undefined) updates.refund_reference = refundReference;
      if (body.refund_amount !== undefined) {
        const refundAmount = Number(body.refund_amount);
        if (!Number.isInteger(refundAmount) || refundAmount < 0) {
          return json({ error: "Refund amount must be a non-negative whole number" }, 400);
        }
        updates.refund_amount = refundAmount;
      }
      const meetLink = cleanText(body.meet_link, 1000);
      if (meetLink !== undefined) {
        if (!validMeetLink(meetLink)) return json({ error: "Meeting link must be a valid HTTPS URL" }, 400);
        updates.meet_link = meetLink || null;
      }
      if (body.date !== undefined) updates.date = body.date;
      if (body.start_time !== undefined) updates.start_time = body.start_time;
      if (body.end_time !== undefined) updates.end_time = body.end_time;

      const nextDate = String(updates.date ?? current.date);
      const nextStart = String(updates.start_time ?? current.start_time);
      const nextEnd = String(updates.end_time ?? current.end_time);
      const scheduleChanged =
        nextDate !== current.date ||
        nextStart !== current.start_time ||
        nextEnd !== current.end_time;
      if (scheduleChanged && current.expert_id) {
        const { data: conflicts, error: conflictError } = await supabase
          .from("bookings")
          .select("id, start_time, end_time")
          .eq("expert_id", current.expert_id)
          .eq("date", nextDate)
          .in("status", ["payment_pending", "paid", "confirmed"])
          .neq("id", current.id);
        if (conflictError) throw conflictError;
        if ((conflicts ?? []).some((item) => nextStart < item.end_time && nextEnd > item.start_time)) {
          return json({ error: "That slot overlaps another active booking" }, 409);
        }
      }

      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", body.booking_id)
        .select("*, experts(id, name, email, title, company, photo_url, price_inr)")
        .single();
      if (error) throw error;

      await supabase.from("booking_events").insert({
        booking_id: body.booking_id,
        event_type: "admin_update",
        from_status: current.status,
        to_status: data.status,
        details: {
          priority: data.priority,
          meet_link_changed: current.meet_link !== data.meet_link,
          schedule_changed:
            current.date !== data.date ||
            current.start_time !== data.start_time ||
            current.end_time !== data.end_time,
        },
      });
      return json({ booking: data });
    }

    if (action === "notify") {
      if (!body.booking_id) return json({ error: "booking_id is required" }, 400);
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("*, experts(id, name, email)")
        .eq("id", body.booking_id)
        .single();
      if (error || !booking) throw error ?? new Error("Booking not found");
      if (!booking.meet_link) return json({ error: "Add a meeting link first" }, 400);
      if (!booking.user_email) return json({ error: "Student email is missing" }, 400);

      const expert = booking.experts as { name: string; email: string | null } | null;
      if (!expert) return json({ error: "Expert is missing" }, 400);
      if (!expert.email) return json({ error: "Add the expert email before notifying both sides" }, 400);

      const results = await Promise.allSettled([
        sendEmail(
          booking.user_email,
          `Connect 1:1 confirmed — session with ${expert.name}`,
          meetingEmail({
            recipientName: booking.user_name ?? "Student",
            otherName: expert.name,
            date: booking.date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            meetLink: booking.meet_link,
            isExpert: false,
          }),
        ),
        sendEmail(
          expert.email,
          `Connect 1:1 confirmed — session with ${booking.user_name}`,
          meetingEmail({
            recipientName: expert.name,
            otherName: booking.user_name ?? "Student",
            date: booking.date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            meetLink: booking.meet_link,
            isExpert: true,
            studentEmail: booking.user_email,
            message: booking.message,
          }),
        ),
      ]);

      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length) {
        throw new Error(`${failures.length} notification${failures.length === 1 ? "" : "s"} failed`);
      }

      const sentAt = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          confirmed_at: booking.confirmed_at ?? sentAt,
          meet_link_sent_at: sentAt,
        })
        .eq("id", booking.id)
        .select("*, experts(id, name, email, title, company, photo_url, price_inr)")
        .single();
      if (updateError) throw updateError;

      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "meeting_details_sent",
        from_status: booking.status,
        to_status: "confirmed",
        details: { student_notified: true, expert_notified: true },
      });
      return json({ booking: updated });
    }

    if (action === "notify_status") {
      if (!body.booking_id) return json({ error: "booking_id is required" }, 400);
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("*, experts(name, email)")
        .eq("id", body.booking_id)
        .single();
      if (error || !booking) throw error ?? new Error("Booking not found");
      const expert = booking.experts as { name: string; email: string | null } | null;
      if (!booking.user_email || !expert?.email) {
        return json({ error: "Both participant emails are required" }, 400);
      }

      const reason = booking.cancellation_reason || body.note || null;
      const results = await Promise.allSettled([
        sendEmail(
          booking.user_email,
          `Connect 1:1 update — ${booking.status.replaceAll("_", " ")}`,
          statusEmail({
            recipientName: booking.user_name ?? "Student",
            otherName: expert.name,
            status: booking.status,
            date: booking.date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            reason,
          }),
        ),
        sendEmail(
          expert.email,
          `Connect 1:1 update — ${booking.status.replaceAll("_", " ")}`,
          statusEmail({
            recipientName: expert.name,
            otherName: booking.user_name ?? "Student",
            status: booking.status,
            date: booking.date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            reason,
          }),
        ),
      ]);
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length) throw new Error(`${failures.length} status notification(s) failed`);

      await supabase.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "status_update_sent",
        from_status: booking.status,
        to_status: booking.status,
        details: { student_notified: true, expert_notified: true },
      });
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("[connect-admin]", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
