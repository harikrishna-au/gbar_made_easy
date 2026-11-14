
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "npm:razorpay@2.9.2";
import { verifyClerkToken } from "../_shared/clerk.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Require a verified Clerk session. The user id is never taken from the body.
        const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
        const userId = token ? await verifyClerkToken(token) : null;
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Please sign in again to continue.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        const { amount, coupon_code } = await req.json();

        // ── Server-side price enforcement ─────────────────────────────────────
        // Never trust the client's amount: it must equal either the price of a valid
        // coupon (COUPON_CODES_JSON, same source as validate-coupon) or one of the
        // allowed base prices (PREMIUM_BASE_PRICES, comma-separated INR; default 99,299).
        if (!Number.isInteger(amount) || amount <= 0) throw new Error('Invalid amount');
        const basePrices = (Deno.env.get('PREMIUM_BASE_PRICES') ?? '99,299')
            .split(',').map((n) => Number(n.trim())).filter((n) => n > 0);
        let couponPrice: number | null = null;
        if (typeof coupon_code === 'string' && coupon_code.trim()) {
            const codes: Record<string, number> = JSON.parse(Deno.env.get('COUPON_CODES_JSON') ?? '{}');
            const price = codes[coupon_code.trim().toUpperCase()];
            if (typeof price === 'number' && price > 0) couponPrice = price;
        }
        if (amount !== couponPrice && !basePrices.includes(amount)) {
            throw new Error('Invalid price. Please refresh the page and try again.');
        }

        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID'),
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
        });

        const options = {
            amount: amount * 100, // Razorpay works in subunits (paise)
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${userId.slice(0, 5)}`,
            notes: {
                user_id: userId,
                ...(couponPrice !== null ? { coupon_code: coupon_code.trim().toUpperCase() } : {})
            }
        };

        const order = await razorpay.orders.create(options);

        // Log transaction
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error: txnError } = await supabaseAdmin.from('payment_transactions').insert({
            user_id: userId,
            txnid: order.id, // Storing Razorpay Order ID as txnid
            amount: amount,
            status: 'created',
            provider_reference_id: order.id,
            raw_response: order
        });
        // The webhook/verify steps look the buyer up by this row, so don't swallow a failure.
        // verify/webhook only honour orders that have this row, so don't hand out an order without it.
        if (txnError) {
            console.error('Failed to record payment_transactions row', order.id, txnError);
            throw new Error('Could not start payment. Please try again.');
        }

        return new Response(
            JSON.stringify(order),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
