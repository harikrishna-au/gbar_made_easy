import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyClerkToken } from "../_shared/clerk.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

// Copies an already-paid user's premium flag from the DB to Clerk publicMetadata.
// Requires a valid Clerk session and only syncs the caller's own record, and only
// if profiles.is_premium is true (previously anyone could grant anyone premium).
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
        const userId = token ? await verifyClerkToken(token) : null;
        if (!userId) return json({ error: 'Unauthorized' }, 401);

        const clerkSecret = Deno.env.get('CLERK_SECRET_KEY');
        if (!clerkSecret) throw new Error("Server Misconfiguration: Clerk secret missing");

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('is_premium, plan_type, premium_expires_at')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        if (!profile?.is_premium) return json({ error: 'No premium purchase found' }, 403);

        const res = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${clerkSecret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                public_metadata: {
                    isPremium: true,
                    planType: profile.plan_type ?? 'lifetime',
                    premiumExpiry: profile.premium_expires_at ?? null,
                },
            }),
        });
        if (!res.ok) throw new Error(`Clerk update failed (${res.status}): ${await res.text()}`);

        return json({ success: true });
    } catch (error: any) {
        console.error(error);
        return json({ error: error.message }, 400);
    }
});
