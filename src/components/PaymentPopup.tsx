import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRazorpay } from "@/hooks/useRazorpay";
import { supabase } from "@/integrations/supabase/client";

interface PaymentPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const LIST_PRICE = 500;
const BASE_PRICE = 299;

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

    const finalAmount = appliedAmount ?? BASE_PRICE;
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
        <div role="dialog" aria-modal="true" aria-labelledby="payment-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#fcfcf9] rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-1">
                    <h2 id="payment-title" className="font-['Merriweather'] text-2xl font-bold text-stone-900">Unlock Premium practice</h2>
                    <p className="text-stone-600 text-sm">One payment. No subscription, no renewal.</p>
                </div>

                {/* Price display */}
                <div className="rounded-xl border-2 border-stone-900 bg-white p-5 text-center space-y-1">
                    {savings > 0 && <p className="text-stone-500 text-sm line-through">₹{LIST_PRICE}</p>}
                    <p className="text-4xl font-bold text-stone-900">₹{finalAmount}</p>
                    {savings > 0 && (
                        <p className="text-stone-700 text-xs font-semibold">₹{savings} off list price</p>
                    )}
                </div>

                {/* What's included */}
                <ul className="space-y-1.5 text-sm text-stone-700">
                    {[
                        "Extra levels in Matrix Flow and Hidden Maze",
                        "Full communication rounds (Accenture and Cognizant patterns)",
                        "AI interview, Forge resume builder and Job Match",
                    ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-stone-900 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>

                {/* Coupon */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Have a coupon?</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter code"
                            value={coupon}
                            onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                            className="uppercase"
                        />
                        <Button
                            onClick={handleApplyCoupon}
                            disabled={validating || !coupon.trim()}
                            variant="outline"
                            className="shrink-0 min-w-[72px]"
                        >
                            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                        </Button>
                    </div>
                    {couponError && <p className="text-destructive text-xs font-medium">{couponError}</p>}
                </div>

                <Button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold bg-stone-900 hover:bg-stone-700 text-white"
                >
                    {isLoading ? "Processing..." : `Pay ₹${finalAmount} — Get Full Access`}
                </Button>

                <p className="text-xs text-center text-stone-500">
                    Secure payment powered by Razorpay. Connect 1:1 calls are booked and paid separately.
                </p>
            </div>
        </div>
    );
};

export default PaymentPopup;
