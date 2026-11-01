import { Link, NavigateFunction } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  Brain,
  CalendarCheck,
  CreditCard,
  Link2,
  Mic,
  Check,
} from "lucide-react";
import { ConnectBenefits } from "./ConnectBenefits";

interface Feature {
  icon: React.ElementType;
  label: string;
  sub: string;
  to?: string;
  href?: string;
  featured?: boolean;
}

interface LandingSectionsProps {
  navigate: NavigateFunction;
  features: Feature[];
  onSignUp: () => void;
}

const eyebrow = "font-['Inter'] text-[11px] font-bold uppercase tracking-wider text-stone-500";
const h2 = "font-['Merriweather'] font-black text-stone-900 tracking-tight leading-[1.12] text-[1.7rem] lg:text-[2.2rem]";
const body = "font-['Inter'] text-stone-600 leading-relaxed";

const ROUNDS = [
  {
    icon: Brain,
    title: "Cognitive games",
    sub: "Timed puzzles in the style of the online assessment.",
    items: ["Matrix Flow, Balloon Math, Hidden Maze (Accenture)", "Geo-Sudo, Grid, Digit, BART, Dual Task and more (Cognizant)", "Your best score and attempts are saved per game"],
  },
  {
    icon: Mic,
    title: "Communication rounds",
    sub: "The spoken and written parts that trip people up.",
    items: ["Conversation, listening, reading aloud, repeat", "Fill in the blank, error correction, speaking topic, email", "Questions are voiced; answers get AI feedback"],
  },
];

const STEPS = [
  { icon: CalendarCheck, title: "Pick a senior and a slot", body: "Browse recently placed seniors, see their company and package, choose a 20-minute slot." },
  { icon: CreditCard, title: "Pay to book", body: "Checkout with Razorpay. The price is shown on each senior before you pay." },
  { icon: Link2, title: "We confirm and send one link", body: "The Connect team confirms the slot by hand and sends the same meeting link to you and the senior." },
];

const FAQ = [
  { q: "Is signing up free?", a: "Yes. Creating an account is free and needs no card. Some levels are free to try; Premium unlocks the full practice suite." },
  { q: "How does Connect 1:1 actually work?", a: "It is run by our team, not an automated marketplace. You pay to book, we confirm the slot, then send one meeting link to both of you." },
  { q: "Will a call get me placed?", a: "No one can promise that. A call gives you an honest account of how the rounds ran and what to focus on, from someone who just cleared them." },
  { q: "Which companies are covered?", a: "Accenture 2026 is the current campaign. Cognizant-style rounds are also in. More MNCs are being added." },
  { q: "Are you affiliated with Accenture or any company?", a: "No. These are practice rounds modelled on public descriptions of company assessments, not official material." },
];

export const LandingSections = ({ navigate, features, onSignUp }: LandingSectionsProps) => {
  const more = features.filter((f) => !f.featured && (f.to || f.href));
  return (
    <div className="relative z-10 border-t border-stone-200/80 bg-[#fcfcf9]/90">
      {/* Practice */}
      <section id="practice" className="max-w-6xl mx-auto px-5 lg:px-14 py-16 lg:py-24 scroll-mt-4">
        <p className={eyebrow}>Practice</p>
        <h2 className={`${h2} mt-2 max-w-2xl`}>The two kinds of round you will actually face.</h2>
        <p className={`${body} mt-3 max-w-xl text-[15px]`}>
          Play company-style rounds until the format stops surprising you.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {ROUNDS.map(({ icon: Icon, title, sub, items }) => (
            <div key={title} className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </span>
              <h3 className="font-['Merriweather'] font-bold text-xl text-stone-900 mt-4">{title}</h3>
              <p className={`${body} text-[14px] mt-1`}>{sub}</p>
              <ul className="mt-4 space-y-2">
                {items.map((it) => (
                  <li key={it} className="flex items-start gap-2 font-['Inter'] text-[13.5px] text-stone-700">
                    <Check className="w-4 h-4 text-stone-900 mt-0.5 flex-shrink-0" strokeWidth={3} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Connect */}
      <section id="connect" className="bg-stone-900 text-white scroll-mt-4">
        <div className="max-w-6xl mx-auto px-5 lg:px-14 py-16 lg:py-24">
          <p className="font-['Inter'] text-[11px] font-bold uppercase tracking-wider text-stone-400">Connect 1:1</p>
          <h2 className="font-['Merriweather'] font-black tracking-tight leading-[1.12] text-[1.7rem] lg:text-[2.2rem] mt-2 max-w-2xl">
            Then talk to someone who just got placed.
          </h2>
          <p className="font-['Inter'] text-stone-300 leading-relaxed mt-3 max-w-xl text-[15px]">
            Not a career coach. A senior who cleared the same rounds a few months ago, for 20 live minutes.
          </p>
          <ol className="mt-10 grid gap-4 lg:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body: b }, i) => (
              <li key={title} className="rounded-2xl border border-stone-700 bg-stone-800/60 p-6">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Icon className="w-5 h-5 text-stone-900" />
                  </span>
                  <span className="font-['Merriweather'] font-black text-3xl text-stone-600 tabular-nums">{i + 1}</span>
                </div>
                <h3 className="font-['Inter'] font-semibold text-[16px] mt-4">{title}</h3>
                <p className="font-['Inter'] text-[13.5px] text-stone-300 leading-relaxed mt-1">{b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-8 lg:grid-cols-2 items-center">
            <ConnectBenefits />
            <div>
              <p className="font-['Inter'] text-stone-300 text-[14px] leading-relaxed mb-5">
                Slots are confirmed manually, so expect a short wait after booking rather than an instant link.
              </p>
              <Link
                to="/connect"
                className="group inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-2xl bg-white text-stone-900 font-['Inter'] font-semibold text-[15px] hover:bg-stone-200 transition-colors"
              >
                Browse seniors
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* More inside */}
      {more.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 lg:px-14 py-16 lg:py-20">
          <p className={eyebrow}>Also inside</p>
          <h2 className={`${h2} mt-2`}>More tools for the same goal.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map(({ icon: Icon, label, sub, to, href }) => (
              <button
                key={label}
                type="button"
                onClick={() => (to ? navigate(to) : href ? window.open(href, "_blank", "noopener") : undefined)}
                className="group text-left flex items-center gap-3 min-h-[64px] p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-900 transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-stone-700" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-['Inter'] text-[14px] font-semibold text-stone-900">{label}</span>
                  <span className="block font-['Inter'] text-[12.5px] text-stone-500">{sub}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 lg:px-14 py-16 lg:py-20 scroll-mt-4">
        <p className={eyebrow}>Questions</p>
        <h2 className={`${h2} mt-2`}>Straight answers.</h2>
        <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-4">
              <summary className="flex items-center justify-between gap-4 min-h-[44px] cursor-pointer list-none font-['Inter'] font-semibold text-[15px] text-stone-900 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-stone-400 text-xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className={`${body} text-[14px] mt-2 pr-8`}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 lg:px-14 pb-16 lg:pb-24">
        <div className="rounded-3xl border-2 border-stone-900 bg-white p-8 lg:p-12 text-center">
          <h2 className={`${h2} max-w-xl mx-auto`}>Your round is coming. Start before it does.</h2>
          <p className={`${body} text-[15px] mt-3 max-w-md mx-auto`}>
            Free to sign up. Practice first, book a call when you are ready.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onSignUp}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl bg-stone-900 text-white font-['Inter'] font-semibold text-[15px] hover:bg-stone-700 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
              Create free account
            </button>
            <Link
              to="/connect"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl border-2 border-stone-200 text-stone-800 font-['Inter'] font-semibold text-[15px] hover:border-stone-900 transition-colors"
            >
              Book a Connect 1:1
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-1 pt-8" aria-label="Footer">
          {[
            { label: "About", to: "/about" },
            { label: "Terms", to: "/terms" },
            { label: "Connect 1:1", to: "/connect" },
            { label: "Be a Guru", to: "/placed-guru" },
          ].map(({ label, to }) => (
            <Link key={label} to={to} className="inline-flex items-center min-h-[44px] px-3 text-[12.5px] font-['Inter'] text-stone-500 hover:text-stone-800">
              {label}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
};
