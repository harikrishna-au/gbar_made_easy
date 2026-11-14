
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
        // Prefer the verified Clerk session; fall back to the body id for older cached clients.
        const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
        const verifiedId = token ? await verifyClerkToken(token) : null;
        const { amount, clerk_user_id, coupon_code } = await req.json();
        const userId = verifiedId || clerk_user_id;

        if (!userId) throw new Error('User ID is required');

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
        if (txnError) console.error('Failed to record payment_transactions row', order.id, txnError);

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
