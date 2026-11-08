import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const GAMES = [
  "Matrix (find the min)",
  "Balloon math",
  "Hidden maze",
  "Grid challenge",
  "Motion challenge",
  "Switch challenge",
  "Digit challenge",
  "BART risk game",
  "Inductive reasoning",
  "Dual task",
];

const STEPS = [
  { n: "1", title: "Pick a senior", body: "Browse people who were recently placed and see who matches the company you are preparing for." },
  { n: "2", title: "Choose a 20-minute slot and pay", body: "Payment goes through Razorpay. The price is set on our server, not in your browser." },
  { n: "3", title: "We send one meeting link", body: "The Connect team confirms the slot by hand and sends the same meeting link to you and the senior." },
];

const ALSO = [
  { title: "AI interview practice", body: "Run a mock interview and get through the awkward first attempts here, not in the real one.", to: "/ai-interview" },
  { title: "Radar job match", body: "Match your skill profile against open roles.", to: "/radar" },
  { title: "Company dashboard", body: "Start with Accenture 2026, with more MNCs after that.", to: "/dashboard" },
];

// Paper physics: sheets lift off the board, controls sit on a hard ink offset and drop into it.
const SHEET = "bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]";
const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3.5 text-[15px] font-semibold text-[var(--color-ink)] " +
  "shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] ease-out " +
  "hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] " +
  "active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]";
const BTN_PRIMARY = `${BTN} bg-[var(--color-accent)]`;
const BTN_SECONDARY = `${BTN} bg-[var(--color-paper-3)]`;
const BTN_INK = `${BTN} bg-[var(--color-ink)] !text-[var(--color-paper)] shadow-[4px_4px_0_var(--color-accent)]`;

const DISPLAY = "font-display font-normal uppercase leading-[0.95] tracking-[0.005em] [overflow-wrap:break-word] [text-wrap:balance]";
const WRAP = "mx-auto w-full max-w-[1360px] px-4 sm:px-8 lg:px-12";
const NAV_LINK =
  "whitespace-nowrap px-3 py-2 text-[15px] text-[var(--color-ink)] underline decoration-transparent underline-offset-4 hover:decoration-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]";

export default function Home() {
  const { isSignedIn } = useAuth();
  const primaryTo = isSignedIn ? "/dashboard" : "/login";
  const primaryLabel = isSignedIn ? "Go to dashboard" : "Start practicing";
  const page = useRef<HTMLDivElement>(null);
  useGsapReveal(page);

  return (
    <div ref={page} className="min-h-screen bg-[var(--color-paper)] font-sans text-[var(--color-ink)]">
      <SEO
        title="Harry The Blaze: Practice Accenture rounds, then talk to someone placed"
        description="Practice Accenture-style cognitive games and communication rounds, then book a 20-minute 1:1 with a recently placed senior."
      />

      {/* Nav: a sheet of copy paper on the board */}
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
        <div className={`${SHEET} mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-2 px-3 sm:px-5`}>
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className={`${DISPLAY} text-xl max-[400px]:sr-only`}>Harry the Blaze</span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
            <a href="#rounds" className={NAV_LINK}>Practice</a>
            <a href="#connect" className={NAV_LINK}>Connect 1:1</a>
            <a href="#pricing" className={NAV_LINK}>Pricing</a>
            <Link to="/blog" className={NAV_LINK}>Blog</Link>
          </nav>
          <div className="flex items-center gap-1">
            {!isSignedIn && (
              <Link to="/login" className={`${NAV_LINK} whitespace-nowrap font-medium`}>
                Sign in
              </Link>
            )}
            <Link
              to={primaryTo}
              className="whitespace-nowrap bg-[var(--color-accent)] px-4 py-2 text-[15px] font-semibold text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
            >
              {isSignedIn ? "Dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero (Stage): the headline on the board, the ticket as the paste-up */}
        <section className={`${WRAP} grid items-center gap-12 pb-24 pt-12 lg:grid-cols-12 lg:gap-8 lg:pb-32 lg:pt-16`}>
          <div className="lg:col-span-7">
            <h1 data-intro className={`${DISPLAY} text-[clamp(3.25rem,9vw,8rem)] leading-[0.92]`}>Practice the real rounds.</h1>
            <p data-intro className="mt-6 max-w-[34ch] text-[clamp(1.125rem,0.35vw+1rem,1.375rem)] leading-snug">
              Then book 20 minutes with someone just placed.
            </p>
            <div data-intro className="mt-9 flex flex-col gap-5 sm:flex-row">
              <Link to={primaryTo} className={BTN_PRIMARY}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/connect" className={BTN_SECONDARY}>
                Book a Connect 1:1
              </Link>
            </div>
          </div>

          {/* The ticket: states the real offer in three lines */}
          <div className="relative mx-auto w-full max-w-[26rem] pb-6 pt-10 lg:col-span-5 lg:max-w-none lg:pt-0">
            <div
              aria-hidden
              data-drop="-3"
              data-parallax="-30"
              className="absolute inset-x-0 bottom-0 top-6 bg-[var(--color-accent)] shadow-[var(--shadow-sheet)] sm:inset-x-6"
            />
            <div data-drop="2" className={`${SHEET} relative lg:mx-4`}>
              <div className="flex items-start justify-between p-6 pb-5">
                <div>
                  <p className={`${DISPLAY} text-5xl sm:text-6xl`}>Admit one</p>
                  <p className="mt-2 text-[15px] text-[var(--color-muted)]">Accenture 2026</p>
                </div>
                <img src="/favicon.svg" alt="" className="h-14 w-14" />
              </div>
              <div className="relative border-t-2 border-dashed border-[var(--color-ink)]">
                <span aria-hidden className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[var(--color-paper)]" />
                <span aria-hidden className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[var(--color-paper)]" />
                <ol className="divide-y divide-[var(--color-rule)] p-6 pt-7">
                  {[
                    ["Round 1", "Cognitive games"],
                    ["Round 2", "Communication"],
                    ["Round 3", "20 minutes with a senior"],
                  ].map(([k, v]) => (
                    <li key={k} className="flex items-baseline justify-between gap-4 py-3.5">
                      <span className="text-[15px] text-[var(--color-muted)]">{k}</span>
                      <span className="text-right text-lg font-semibold">{v}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Toner band: the game list, counted from the list itself */}
        <div className="bg-[var(--color-ink)] text-[var(--color-paper)]">
          <div className={`${WRAP} py-10 sm:py-14`}>
            <p data-reveal className={`${DISPLAY} max-w-[26ch] text-[clamp(2.25rem,5.5vw,4.75rem)] sm:max-w-none`}>
              Ten games. Two communication sets. One senior on the call.
            </p>
          </div>
        </div>

        {/* Rounds: two sheets */}
        <section id="rounds" className={`${WRAP} py-24 sm:py-32`}>
          <h2 data-reveal className={`${DISPLAY} max-w-[18ch] text-[clamp(2.5rem,6vw,5rem)]`}>Two kinds of rounds. Both practiced under time.</h2>
          <p className="mt-5 max-w-[48ch] text-lg">Start with the round you are actually facing, not a feature tour.</p>

          <div data-reveal-group className="mt-12 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div className={`${SHEET} p-6 sm:p-9 lg:col-span-7`}>
              <p className={`${DISPLAY} text-7xl sm:text-8xl`}>01</p>
              <h3 className="mt-4 text-2xl font-semibold">Cognitive games</h3>
              <p className="mt-2 max-w-[44ch] text-lg leading-relaxed">
                The game-based aptitude round, played the way it is played on test day.
              </p>
              <ul data-reveal-group className="mt-8 grid gap-x-8 sm:grid-cols-2">
                {GAMES.map((g) => (
                  <li key={g} className="border-t border-[var(--color-rule)] py-3 text-base">{g}</li>
                ))}
              </ul>
            </div>
            <div className={`${SHEET} p-6 sm:p-9 lg:col-span-5 lg:mt-12`}>
              <p className={`${DISPLAY} text-7xl sm:text-8xl`}>02</p>
              <h3 className="mt-4 text-2xl font-semibold">Communication rounds</h3>
              <p className="mt-2 text-lg leading-relaxed">
                Speaking, writing and fluency tasks with a clock running, so the timing stops being a surprise.
              </p>
              <p className="mt-8 border-t border-[var(--color-rule)] pt-4 text-base leading-relaxed text-[var(--color-muted)]">
                Two sets of communication rounds are available, plus AI mock interviews when you want to rehearse speaking
                out loud.
              </p>
            </div>
          </div>
        </section>

        {/* Connect: the one flame sheet of this screen, steps on a typed sheet */}
        <section id="connect" className={`${WRAP} pb-24 sm:pb-32`}>
          <div className="grid items-start gap-8 lg:grid-cols-12">
            <div data-drop="-1" className="bg-[var(--color-accent)] p-6 shadow-[var(--shadow-sheet)] sm:p-10 lg:col-span-7">
              <h2 className={`${DISPLAY} text-[clamp(2.5rem,5.5vw,4.75rem)]`}>
                20 minutes with someone who sat the same rounds last year.
              </h2>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed">
                Ask what the interview was really like, what to skip, and what you would do differently. This is a real call
                with a real senior, not a chatbot and not a marketplace listing.
              </p>
              <p className="mt-4 max-w-[46ch] text-base leading-relaxed">
                Connect is run by hand. After you pay, our team confirms your slot and sends the meeting link. It is not
                instant, and we would rather say so up front.
              </p>
              <Link to="/connect" className={`${BTN_INK} mt-9`}>
                Browse seniors
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ol data-reveal-group className={`${SHEET} divide-y divide-[var(--color-rule)] px-6 sm:px-9 lg:col-span-5 lg:mt-16`}>
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-6 py-7">
                  <span className={`${DISPLAY} w-10 shrink-0 text-6xl`}>{s.n}</span>
                  <div>
                    <h3 className="text-lg font-semibold [text-wrap:balance]">{s.title}</h3>
                    <p className="mt-1.5 text-base leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Also inside: one typed sheet, a row per tool */}
        <section className={`${WRAP} pb-24 sm:pb-32`}>
          <h2 data-reveal className={`${DISPLAY} text-[clamp(2.25rem,5vw,4rem)]`}>Also inside</h2>
          <ul data-reveal className={`${SHEET} mt-8 divide-y divide-[var(--color-rule)]`}>
            {ALSO.map((a) => (
              <li key={a.title}>
                <Link
                  to={a.to}
                  className="group grid items-baseline gap-x-8 gap-y-1 px-6 py-6 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] sm:px-9 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--color-focus)]"
                >
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                  <p className="text-base leading-relaxed">{a.body}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-base font-semibold underline decoration-transparent underline-offset-4 group-hover:decoration-[var(--color-ink)] sm:mt-0">
                    Open <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing: two sheets, the price set huge because it is the offer */}
        <section id="pricing" className="bg-[var(--color-paper-2)]">
          <div className={`${WRAP} py-24 sm:py-32`}>
            <h2 data-reveal className={`${DISPLAY} text-[clamp(2.5rem,6vw,5rem)]`}>Two ways in</h2>
            <p className="mt-4 max-w-[48ch] text-lg">Practice gets you ready. Connect gets you a real conversation.</p>

            <div className="mt-12 grid max-w-5xl gap-8 md:grid-cols-2">
              <div data-reveal className={`${SHEET} flex flex-col p-6 sm:p-9`}>
                <h3 className="text-xl font-semibold">Premium practice</h3>
                <p className="mt-4 flex items-baseline gap-4">
                  <span className={`${DISPLAY} num text-[clamp(4.5rem,8vw,7rem)]`}>₹299</span>
                  <span className="num text-xl text-[var(--color-muted)] line-through">₹500</span>
                </p>
                <p className="mt-3 flex-1 text-lg leading-relaxed">
                  Opens the full practice suite: the cognitive games and communication rounds.
                </p>
                <Link to={primaryTo} className={`${BTN_SECONDARY} mt-8 w-[calc(100%-4px)]`}>
                  {isSignedIn ? "Open dashboard" : "Create account"}
                </Link>
              </div>

              <div data-drop="1" className="flex flex-col bg-[var(--color-accent)] p-6 shadow-[var(--shadow-sheet)] sm:p-9">
                <h3 className="text-xl font-semibold">Connect 1:1</h3>
                <p className={`${DISPLAY} mt-4 text-[clamp(3rem,5.5vw,4.75rem)]`}>Priced per senior</p>
                <p className="mt-3 flex-1 text-lg leading-relaxed">
                  A 20-minute live call. You see the price before you pay, and you book separately from Premium.
                </p>
                <Link to="/connect" className={`${BTN_INK} mt-8 w-[calc(100%-4px)]`}>
                  See who is available
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final call: toner band */}
        <section className="bg-[var(--color-ink)] text-[var(--color-paper)]">
          <div className={`${WRAP} py-24 sm:py-32`}>
            <h2 data-reveal className={`${DISPLAY} max-w-[20ch] text-[clamp(2.75rem,7vw,6rem)]`}>
              Your interview date is already on the calendar. Start today.
            </h2>
            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <Link to={primaryTo} className={`${BTN_PRIMARY} !shadow-[4px_4px_0_var(--color-paper)] active:!shadow-none`}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <p className="max-w-[34ch] text-base opacity-80">Create an account in under a minute. Works best on a phone or laptop.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: a mast, the wordmark over the links */}
      <footer className="bg-[var(--color-paper)]">
        <div className={`${WRAP} flex flex-col gap-6 py-12`}>
          <span className={`${DISPLAY} text-4xl sm:text-5xl`}>Harry the Blaze</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-base">
            <Link to="/about" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]">
              About
            </Link>
            <Link to="/blog" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]">
              Blog
            </Link>
            <Link to="/placed-guru" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]">
              Be a Guru
            </Link>
            <Link to="/terms" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]">
              Terms
            </Link>
            <Link to="/refund" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]">
              Refund policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
