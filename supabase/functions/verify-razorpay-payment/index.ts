
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
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
        // Extract and verify the Clerk JWT from the Authorization header.
        // Never trust clerk_user_id supplied in the request body.
        const authHeader = req.headers.get('Authorization') ?? '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const verified_clerk_user_id = token ? await verifyClerkToken(token) : null;

        if (!verified_clerk_user_id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { order_id, payment_id, signature, coupon_code } = await req.json();

        if (!order_id || !payment_id || !signature) {
            throw new Error("Missing required fields");
        }

        const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!secret) throw new Error("Server Misconfiguration: Secret missing");

        // Verify Signature
        // content = order_id + "|" + payment_id
        const generated_signature = await hmacSha256(order_id + "|" + payment_id, secret);

        if (generated_signature !== signature) {
            return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Signature is valid. Update Profile.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // The order must belong to the caller (when we recorded who created it).
        const { data: txn } = await supabaseAdmin
            .from('payment_transactions')
            .select('user_id')
            .eq('txnid', order_id)
            .maybeSingle();
        if (txn?.user_id && txn.user_id !== verified_clerk_user_id) {
            return new Response(JSON.stringify({ error: "Order does not belong to this user" }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Grant premium in the DB. This is the source of truth; the client falls
        // back to it if the Clerk metadata sync below ever fails.
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            user_id: verified_clerk_user_id,
            is_premium: true,
            plan_type: 'lifetime',
            premium_expires_at: null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Log transaction first so the webhook/audit trail is right even if Clerk sync fails.
        await supabaseAdmin.from('payment_transactions').update({
            status: 'success',
            provider_reference_id: payment_id
        }).eq('txnid', order_id);

        // Sync to Clerk publicMetadata (best effort — payment is already recorded).
        // Do NOT fail the request if this errors: the user has paid and the DB says premium.
        let clerkSynced = false;
        const clerkSecret = Deno.env.get('CLERK_SECRET_KEY');
        if (clerkSecret) {
            for (let attempt = 0; attempt < 3 && !clerkSynced; attempt++) {
                try {
                    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${verified_clerk_user_id}/metadata`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${clerkSecret}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ public_metadata: { isPremium: true, planType: 'lifetime', premiumExpiry: null } }),
                    });
                    if (clerkRes.ok) clerkSynced = true;
                    else console.error(`Clerk metadata update failed (${clerkRes.status}): ${await clerkRes.text()}`);
                } catch (e) {
                    console.error('Clerk metadata update error', e);
                }
                if (!clerkSynced) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            }
        } else {
            console.error('CLERK_SECRET_KEY missing; premium granted in DB only');
        }

        // Track Coupon Usage if provided
        if (coupon_code) {
            try {
                await supabaseAdmin.from('coupon_usages').insert({
                    coupon_code: coupon_code,
                    amount: null // We default to tracking just the usage count for now
                });
            } catch (couponError) {
                console.warn("Failed to track coupon usage (ignoring to prevent payment failure):", couponError);
            }
        }

        return new Response(JSON.stringify({ success: true, clerk_synced: clerkSynced }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });


    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function hmacSha256(message: string, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signed = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    return Array.from(new Uint8Array(signed))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
