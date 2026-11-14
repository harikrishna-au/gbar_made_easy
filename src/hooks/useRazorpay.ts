import { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { trackMetaInitiateCheckout, trackMetaPurchase } from "@/lib/meta-pixel";

export function useRazorpay() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    /** One-time payment (₹299 full access). */
    const initiatePayment = async (amount: number = 299, couponCode?: string) => {
        if (!user) {
            toast.error("Please sign in to proceed");
            return false;
        }

        const res = await loadRazorpayScript();
        if (!res) {
            toast.error("Razorpay SDK failed to load. Are you online?");
            return false;
        }

        try {
            setIsLoading(true);

            const orderToken = await getToken().catch(() => null);
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${orderToken ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ amount, coupon_code: couponCode })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create order');
            }

            const order = await response.json();
            track("payment_started", { amount, coupon: !!couponCode });
            trackMetaInitiateCheckout({
                value: amount,
                contentName: "Lifetime Premium",
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount.toString(),
                currency: order.currency,
                name: "Harry The Blaze",
                description: "Lifetime Premium",
                order_id: order.id,
                handler: async function (response: any) {
                    // The user has ALREADY been charged here, so never give up quietly:
                    // retry verification with a fresh token, then fall back to polling the
                    // DB (the Razorpay webhook upgrades the account independently).
                    const verifyOnce = async () => {
                        const clerkToken = await getToken({ skipCache: true });
                        const verifyRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${clerkToken}`,
                            },
                            body: JSON.stringify({
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                coupon_code: couponCode,
                            })
                        });
                        return verifyRes.ok;
                    };

                    let verified = false;
                    for (let attempt = 0; attempt < 4 && !verified; attempt++) {
                        try { verified = await verifyOnce(); } catch (e) { console.error("Verification error", e); }
                        if (!verified) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                    }

                    if (!verified) {
                        toast.loading("Confirming your payment…", { id: "premium-confirm" });
                        for (let i = 0; i < 10 && !verified; i++) {
                            await new Promise((r) => setTimeout(r, 2000));
                            const { data } = await supabase
                                .from('profiles')
                                .select('is_premium')
                                .eq('user_id', user.id)
                                .maybeSingle();
                            verified = !!data?.is_premium;
                        }
                        toast.dismiss("premium-confirm");
                    }

                    track(verified ? "payment_success" : "payment_delayed", { amount, coupon: !!couponCode });
                    if (verified) {
                        trackMetaPurchase({
                            value: amount,
                            contentName: "Lifetime Premium",
                            contentIds: ["premium"],
                            eventID: response.razorpay_payment_id,
                        });
                        toast.success("Payment verified! Full access unlocked.");
                        localStorage.removeItem("referral_coupon");
                    } else {
                        toast.error(`Payment received but activation is delayed. Your payment ID is ${response.razorpay_payment_id} — contact support and we'll unlock it right away.`, { duration: 15000 });
                    }
                    try { await user.reload(); } catch { window.location.reload(); }
                },
                prefill: {
                    name: user.fullName || "",
                    email: user.primaryEmailAddress?.emailAddress || "",
                },
                theme: { color: "#3399cc" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (resp: any) => {
                track("payment_failed", { amount, reason: String(resp.error?.code ?? "unknown").slice(0, 40) });
                toast.error(`Payment failed: ${resp.error?.description}`);
            });
            rzp.open();
            return true;

        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error(error.message || "Failed to initiate payment");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { initiatePayment, isLoading };
}
