import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRazorpay } from "@/hooks/useRazorpay";
import { supabase } from "@/integrations/supabase/client";

interface PaymentPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

import { LIST_PRICE, PROMO_ACTIVE, PROMO_PRICE, REGULAR_PRICE } from "@/lib/promo";

const currentBasePrice = () => (PROMO_ACTIVE ? PROMO_PRICE : REGULAR_PRICE);

async function validateCouponServer(code: string): Promise<number | null> {
    try {
        const { data, error } = await supabase.functions.invoke('validate-coupon', {
            body: { coupon_code: code },
        });
        if (error) return null;
        return data?.valid ? data.amount : null;
    } catch {
        return null;
    }
}

const PaymentPopup = ({ isOpen, onClose }: PaymentPopupProps) => {
    const [coupon, setCoupon]               = useState("");
    const [appliedAmount, setAppliedAmount] = useState<number | null>(null);
    const [validating, setValidating]       = useState(false);
    const [couponError, setCouponError]     = useState("");
    const { initiatePayment, isLoading } = useRazorpay();

    // Auto-apply referral coupon from localStorage
    useEffect(() => {
        if (!isOpen || appliedAmount) return;
        const stored = localStorage.getItem("referral_coupon");
        if (!stored) return;
        setCoupon(stored);
        validateCouponServer(stored).then((amount) => {
            if (amount !== null) {
                setAppliedAmount(amount);
                toast.success("Referral coupon applied!");
            }
        });
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const finalAmount = appliedAmount ?? currentBasePrice();
    const savings = LIST_PRICE - finalAmount;

    const handleApplyCoupon = async () => {
        const code = coupon.trim();
        if (!code) return;
        setValidating(true);
        setCouponError("");
        const amount = await validateCouponServer(code);
        setValidating(false);
        if (amount !== null) {
            setAppliedAmount(amount);
            setCouponError("");
            toast.success("Coupon applied!");
        } else {
            setCouponError("Invalid coupon code");
            setAppliedAmount(null);
        }
    };

    const handlePayment = async () => {
        const success = await initiatePayment(finalAmount, coupon.trim() || undefined);
        if (success) onClose();
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="payment-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[var(--color-paper-3)] p-6 sm:p-8 text-[var(--color-ink)] shadow-[var(--shadow-sheet)] space-y-6">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 border border-[var(--color-ink)] p-1.5 text-[var(--color-ink)] hover:bg-[var(--color-accent)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="space-y-2 pr-10">
                    <h2 id="payment-title" className="font-display font-normal uppercase leading-[0.98] tracking-[0.005em] text-4xl sm:text-5xl [text-wrap:balance]">
                        Unlock Premium practice
                    </h2>
                    <p className="text-[15px] text-[var(--color-muted)]">One payment. No subscription, no renewal.</p>
                </div>

                {/* Price: the one flame block */}
                <div className="bg-[var(--color-accent)] p-5 shadow-[var(--shadow-offset)]">
                    <div className="flex items-baseline gap-4">
                        <p className="font-display font-normal leading-none text-[clamp(3.5rem,14vw,5rem)]">₹{finalAmount}</p>
                        {savings > 0 && <p className="text-xl line-through opacity-70">₹{LIST_PRICE}</p>}
                    </div>
                    {savings > 0 && (
                        <p className="mt-2 text-sm font-semibold">₹{savings} off the list price</p>
                    )}
                </div>

                {/* What's included */}
                <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)] text-[15px]">
                    {[
                        "Extra levels in Matrix Flow and Hidden Maze",
                        "Full communication rounds (Accenture and Cognizant patterns)",
                        "AI interview, Forge resume builder and Job Match",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-3 py-3">
                            <Check className="w-4 h-4 mt-1 shrink-0" aria-hidden />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>

                {/* Coupon */}
                <div className="space-y-2">
                    <label htmlFor="coupon-code" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Have a coupon?</label>
                    <div className="flex gap-2">
                        <Input
                            id="coupon-code"
                            placeholder="Enter code"
                            value={coupon}
                            onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                            className="h-11 rounded-none uppercase bg-[var(--color-paper)] border-[var(--color-ink)] text-[var(--color-ink)]"
                        />
                        <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={validating || !coupon.trim()}
                            className="shrink-0 min-w-[84px] h-11 border border-[var(--color-ink)] bg-[var(--color-paper)] px-4 text-[15px] font-semibold hover:bg-[var(--color-paper-2)] disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                        >
                            {validating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Apply"}
                        </button>
                    </div>
                    {couponError && <p className="text-sm font-semibold text-[#b42318]" role="alert">{couponError}</p>}
                    {appliedAmount !== null && !couponError && (
                        <p className="text-sm font-semibold">Coupon applied. Your price is ₹{appliedAmount}.</p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center bg-[var(--color-ink)] px-6 py-4 text-base font-semibold !text-[var(--color-paper)] shadow-[4px_4px_0_var(--color-accent)] transition-[transform,box-shadow] duration-[120ms] ease-out hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-accent)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
                >
                    {isLoading ? "Processing..." : `Pay ₹${finalAmount}: get full access`}
                </button>

                <p className="text-xs text-center text-[var(--color-muted)]">
                    Secure payment powered by Razorpay. Connect 1:1 calls are booked and paid separately.
                </p>
            </div>
        </div>
    );
};

export default PaymentPopup;
