
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

export function usePremiumStatus() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        if (!user) {
            setIsPremium(false);
            setLoading(false);
            return;
        }

        async function checkPremium() {
            try {
                try { await user!.reload(); } catch { /* use cached user */ }

                const meta = user!.publicMetadata as { isPremium?: boolean };

                if (meta?.isPremium) {
                    setIsPremium(true);
                    return;
                }

                // Fallback: check Supabase (handles payments not yet synced to Clerk)
                let row: { is_premium: boolean | null } | null = null;
                for (let attempt = 0; attempt < 2 && !row; attempt++) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('is_premium')
                        .eq('user_id', user!.id)
                        .maybeSingle();
                    if (!error) { row = data ?? { is_premium: false }; break; }
                }

                if (row?.is_premium) {
                    setIsPremium(true);
                    // Auto-heal: sync back to Clerk (server verifies the purchase)
                    getToken().then((token) =>
                        supabase.functions.invoke('sync-premium-to-clerk', {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    ).catch(() => {});
                }
            } finally {
                // Never leave the route stuck on the spinner.
                setLoading(false);
            }
        }

        checkPremium();
    }, [user, isLoaded]);

    return { isPremium, loading };
}
