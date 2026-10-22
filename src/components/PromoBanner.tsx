import { ArrowRight } from "lucide-react";
import { PROMO_ACTIVE, PROMO_PRICE, REGULAR_PRICE, useLiveFor } from "@/lib/promo";

const pad = (n: number) => String(n).padStart(2, "0");

const TICKER = ["OFFER", "OFFER", "OFFER", "₹99 ONLY", "OFFER", "OFFER", "OFFER", "LIVE NOW", "OFFER", "OFFER", "OFFER"];

interface PromoBannerProps {
  onClaim: () => void;
}

/** Loud flash-offer strip at the very top of the landing page. Hides itself when the timer ends. */
export function PromoBanner({ onClaim }: PromoBannerProps) {
  const { h, m, s } = useLiveFor();
  if (!PROMO_ACTIVE) return null;

  return (
    <div className="relative z-20 bg-stone-900 text-white font-['Inter']" role="region" aria-label="Limited offer">
      <style>{`
        @keyframes promo-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (prefers-reduced-motion: reduce) { .promo-marquee { animation: none !important } }
      `}</style>

      {/* scrolling ticker: two identical groups, each wider than the screen, shifted by exactly one group */}
      <div className="overflow-hidden border-b border-white/10 py-1.5" aria-hidden="true">
        <div
          className="promo-marquee flex w-max whitespace-nowrap text-[11px] font-black tracking-[0.28em] text-[#8fb5a3]"
          style={{ animation: "promo-marquee 30s linear infinite" }}
        >
          {[0, 1].map((g) => (
            <div key={g} className="flex shrink-0 gap-6 pr-6">
              {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-[14px] leading-snug sm:text-[15px]">
          <span className="font-['Merriweather'] font-black">
            My crush just accepted my follow request, so everything is{" "}
            <span className="whitespace-nowrap">
              <s className="font-normal text-stone-400">₹{REGULAR_PRICE}</s> ₹{PROMO_PRICE}
            </span>{" "}
            until I change my mind.
          </span>{" "}
          <span className="text-stone-300">Happiest I've been all year. Could end any minute, so grab it.</span>
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">Live for</span>
          <div className="flex items-center gap-1 font-mono text-[15px] font-bold tabular-nums" aria-label={`Offer live for ${h} hours ${m} minutes`}>
            {[pad(h), pad(m), pad(s)].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="rounded-md bg-white/10 px-2 py-1">{v}</span>
                {i < 2 && <span className="text-stone-500">:</span>}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onClaim}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#557d6b] px-4 text-[14px] font-semibold text-white transition-transform active:scale-[0.97] hover:bg-[#43695a]"
          >
            Grab ₹{PROMO_PRICE}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
