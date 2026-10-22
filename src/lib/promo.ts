import { useEffect, useState } from "react";

/**
 * Flash offer. It stays on until you set PROMO_ACTIVE to false (then rebuild):
 * banner disappears and checkout goes back to ₹299. PROMO_STARTED_AT is the real
 * moment the offer went live; the banner counts up from it.
 */
export const PROMO_ACTIVE = true;
export const PROMO_STARTED_AT = new Date("2026-10-22T10:06:56Z").getTime();
export const PROMO_PRICE = 99;
export const REGULAR_PRICE = 299;
export const LIST_PRICE = 500;

export const isPromoLive = () => PROMO_ACTIVE;

/** Time since the offer went live (real, not reset per visitor). */
export function useLiveFor(startedAt: number = PROMO_STARTED_AT) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const t = Math.max(0, now - startedAt);
  return {
    h: Math.floor(t / 3_600_000),
    m: Math.floor((t % 3_600_000) / 60_000),
    s: Math.floor((t % 60_000) / 1000),
  };
}
