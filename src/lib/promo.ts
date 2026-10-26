import { useEffect, useState } from "react";

/**
 * Flash offer. It stays on until you set PROMO_ACTIVE to false (then rebuild):
 * banner disappears and checkout goes back to ₹299. The banner timer is per
 * browser session: it counts up from the moment the visitor's session began.
 */
export const PROMO_ACTIVE = true;
const SESSION_KEY = "promo_session_started_at";
export const PROMO_PRICE = 99;
export const REGULAR_PRICE = 299;
export const LIST_PRICE = 500;

export const isPromoLive = () => PROMO_ACTIVE;

/** When this browser session first saw the offer; falls back to now if storage is blocked. */
function sessionStart(): number {
  try {
    const saved = Number(sessionStorage.getItem(SESSION_KEY));
    if (saved > 0 && saved <= Date.now()) return saved;
    const now = Date.now();
    sessionStorage.setItem(SESSION_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/** Time since this session first saw the offer (resets when the tab session ends). */
export function useLiveFor() {
  const [startedAt] = useState(sessionStart);
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
