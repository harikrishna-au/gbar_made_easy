
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function sendConnectEmail(to: string, subject: string, text: string) {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return;
    const from = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev';
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#44403c"><h2 style="color:#1c1917">Harry The Blaze · Connect 1:1</h2><p style="line-height:1.7">${escapeHtml(text)}</p><p style="color:#78716c;font-size:12px">The Connect team will confirm the schedule and email the meeting link to both participants.</p></div>`,
        }),
    });
    if (!response.ok) console.error('[razorpay-webhook] Connect email failed:', await response.text());
}

serve(async (req: Request) => {
    try {
        const signature = req.headers.get("x-razorpay-signature");
        if (!signature) {
            return new Response("No signature found", { status: 400 });
        }

        // Use RAZORPAY_WEBHOOK_SECRET if set, fall back to key secret
        const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!secret) throw new Error("Razorpay webhook secret not configured");

        // Read raw body for signature verification
        const rawBody = await req.text();

        // Verify Signature: HMAC-SHA256(rawBody, secret)
        const encoder = new TextEncoder();
        const cryptoKey = await crypto.subtle.importKey(
            "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signed = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(rawBody));
        const calculatedSignature = Array.from(new Uint8Array(signed))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        if (calculatedSignature !== signature) {
            console.error("Invalid Signature", { calculatedSignature, signature });
            return new Response("Invalid Signature", { status: 403 });
        }

        const payload = JSON.parse(rawBody);
        const event: string = payload.event;

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const clerkSecret = Deno.env.get('CLERK_SECRET_KEY');

        // ── One-time payment captured (legacy flow) ──────────────────────────
        if (event === 'payment.captured') {
            const payment = payload.payload.payment.entity;
            const orderId = payment.order_id;
            const userId = payment.notes?.user_id;
            const email = payment.email;
            let bookingId = payment.notes?.booking_id;
            let paymentType = payment.notes?.type;

            // Razorpay does not consistently copy order notes onto every
            // payment payload, so resolve the signed order when needed.
            if ((!bookingId || !paymentType) && orderId) {
                const keyId = Deno.env.get('RAZORPAY_KEY_ID');
                const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
                if (keyId && keySecret) {
                    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
                        headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
                    });
                    if (orderResponse.ok) {
                        const order = await orderResponse.json();
                        bookingId = bookingId ?? order.notes?.booking_id;
                        paymentType = paymentType ?? order.notes?.type;
                    }
                }
            }

            // Connect payment recovery: this path is authoritative when the
            // student's browser closes before client verification completes.
            if (paymentType === 'expert_session' && bookingId) {
                const { data: booking, error: bookingError } = await supabaseAdmin
                    .from('bookings')
                    .select('id, status, payment_amount, razorpay_order_id, user_name, user_email, date, start_time, experts(name, email)')
                    .eq('id', bookingId)
                    .single();

                if (bookingError || !booking) {
                    throw bookingError ?? new Error(`Connect booking ${bookingId} not found`);
                }
                if (booking.razorpay_order_id !== orderId) {
                    throw new Error(`Connect order mismatch for booking ${bookingId}`);
                }
                if (booking.payment_amount && payment.amount !== booking.payment_amount * 100) {
                    throw new Error(`Connect payment amount mismatch for booking ${bookingId}`);
                }

                if (booking.status === 'payment_pending') {
                    const verifiedAt = new Date().toISOString();
                    const { error: updateError } = await supabaseAdmin
                        .from('bookings')
                        .update({
                            status: 'paid',
                            razorpay_payment_id: payment.id,
                            payment_verified_at: verifiedAt,
                            payment_failure_reason: null,
                        })
                        .eq('id', bookingId)
                        .eq('status', 'payment_pending');
                    if (updateError) throw updateError;

                    await supabaseAdmin.from('booking_events').insert({
                        booking_id: bookingId,
                        event_type: 'payment_verified',
                        from_status: 'payment_pending',
                        to_status: 'paid',
                        details: { razorpay_order_id: orderId, razorpay_payment_id: payment.id, source: 'webhook' },
                    });

                    const expert = booking.experts as { name: string; email: string | null } | null;
                    const schedule = `${booking.date}, ${String(booking.start_time).slice(0, 5)} IST`;
                    const notifications = [
                        booking.user_email
                            ? sendConnectEmail(
                                booking.user_email,
                                `Payment received — Connect 1:1 with ${expert?.name ?? 'your expert'}`,
                                `Hi ${booking.user_name ?? 'there'}, your payment is verified for the session with ${expert?.name ?? 'your expert'} on ${schedule}.`,
                            )
                            : Promise.resolve(),
                        expert?.email
                            ? sendConnectEmail(
                                expert.email,
                                `New paid Connect request — ${booking.user_name ?? 'Student'}`,
                                `${booking.user_name ?? 'A student'} has paid for a session with you on ${schedule}.`,
                            )
                            : Promise.resolve(),
                    ];
                    const adminEmail = Deno.env.get('CONNECT_ADMIN_EMAIL');
                    if (adminEmail) {
                        notifications.push(sendConnectEmail(
                            adminEmail,
                            `Connect action needed — ${booking.user_name ?? 'Student'}`,
                            `A paid booking for ${booking.user_name ?? 'a student'} with ${expert?.name ?? 'an expert'} on ${schedule} needs review in Connect Ops.`,
                        ));
                    }
                    await Promise.allSettled(notifications);
                }

                return new Response(JSON.stringify({ received: true }), {
                    headers: { "Content-Type": "application/json" }
                });
            }

            await supabaseAdmin.from('payment_transactions').update({
                status: 'success',
                provider_reference_id: payment.id,
                raw_response: payment
            }).eq('txnid', orderId);

            if (userId) {
                await supabaseAdmin.from('profiles').upsert({
                    user_id: userId,
                    email: email,
                    is_premium: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
        }

        // ── Subscription renewal (monthly users auto-renew) ───────────────────
        else if (event === 'subscription.charged') {
            const subscription = payload.payload?.subscription?.entity;
            const clerkUserId: string = subscription?.notes?.clerk_user_id;
            // current_end is Unix timestamp of when the current paid period ends
            const currentEnd: number = subscription?.current_end;

            if (!clerkUserId) {
                console.error('subscription.charged: no clerk_user_id in subscription notes');
                return new Response(JSON.stringify({ received: true }), {
                    headers: { "Content-Type": "application/json" }
                });
            }

            const newExpiry = currentEnd
                ? new Date(currentEnd * 1000).toISOString()
                : (() => { const d = new Date(); d.setDate(d.getDate() + 31); return d.toISOString(); })();

            await supabaseAdmin.from('profiles').update({
                is_premium: true,
                subscription_status: 'active',
                premium_expires_at: newExpiry,
                updated_at: new Date().toISOString(),
            }).eq('subscription_id', subscription.id);

            if (clerkSecret) {
                await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${clerkSecret}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        public_metadata: {
                            isPremium: true,
                            planType: 'monthly',
                            premiumExpiry: newExpiry,
                        },
                    }),
                }).catch(e => console.error('Clerk update failed on renewal:', e));
            }

            console.log(`subscription.charged: extended premium for ${clerkUserId} until ${newExpiry}`);
        }

        // ── Subscription cancelled (user or admin) ────────────────────────────
        else if (event === 'subscription.cancelled') {
            const subscription = payload.payload?.subscription?.entity;
            if (subscription?.id) {
                await supabaseAdmin.from('profiles').update({
                    subscription_status: 'cancelled',
                    updated_at: new Date().toISOString(),
                }).eq('subscription_id', subscription.id);
            }
            console.log(`subscription.cancelled: ${subscription?.id}`);
        }

        // ── Subscription halted (payment failures exhausted) ──────────────────
        else if (event === 'subscription.halted') {
            const subscription = payload.payload?.subscription?.entity;
            if (subscription?.id) {
                await supabaseAdmin.from('profiles').update({
                    subscription_status: 'halted',
                    updated_at: new Date().toISOString(),
                }).eq('subscription_id', subscription.id);
            }
            console.log(`subscription.halted: ${subscription?.id}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (e: any) {
        console.error(e);
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
    }
});
