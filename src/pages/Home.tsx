import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { ArrowRight, Brain, Mic, Users, Radar, BarChart2, Bot, Check } from "lucide-react";
import SEO from "@/components/SEO";

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const cognitiveGames = [
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

const connectSteps = [
  { n: "01", title: "Pick a senior", body: "Browse people who were recently placed and see who matches the company you are preparing for." },
  { n: "02", title: "Choose a 20-minute slot and pay", body: "Payment goes through Razorpay. The price is set on our server, not in your browser." },
  { n: "03", title: "We send one meeting link", body: "The Connect team confirms the slot by hand and sends the same meeting link to you and the senior." },
];

const extras = [
  { icon: Bot, title: "AI interview practice", body: "Run a mock interview and get through the awkward first attempts here, not in the real one.", to: "/ai-interview" },
  { icon: Radar, title: "Radar job match", body: "Match your skill profile against open roles.", to: "/radar" },
  { icon: BarChart2, title: "Company dashboard", body: "Start with Accenture 2026, with more MNCs after that.", to: "/dashboard" },
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const primaryTo = isSignedIn ? "/dashboard" : "/login";
  const primaryLabel = isSignedIn ? "Go to dashboard" : "Start practicing";

  return (
    <div className="min-h-screen font-['Inter'] text-stone-800" style={{ background: "#fcfcf9" }}>
      <SEO
        title="Harry The Blaze — Practice Accenture rounds, then talk to someone placed"
        description="Practice Accenture-style cognitive games and communication rounds, then book a 20-minute 1:1 with a recently placed senior."
      />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 backdrop-blur" style={{ background: "rgba(252,252,249,0.88)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="w-7 h-7" />
            <span className="font-['Merriweather'] font-black text-[0.85rem] tracking-tight text-stone-900">HARRY THE BLAZE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-stone-500">
            <a href="#rounds" className="hover:text-stone-900 transition-colors">Practice</a>
            <a href="#connect" className="hover:text-stone-900 transition-colors">Connect 1:1</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
            <Link to="/blog" className="hover:text-stone-900 transition-colors">Blog</Link>
          </nav>
          <div className="flex items-center gap-2">
            {!isSignedIn && (
              <Link to="/login" className="px-3 py-2 text-[13px] font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Sign in
              </Link>
            )}
            <Link
              to={primaryTo}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-[13px] font-semibold hover:bg-stone-700 transition-colors"
            >
              {isSignedIn ? "Dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-16 sm:pt-24 sm:pb-24">
          <motion.p {...fade} className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-5">
            Accenture 2026 campaign
          </motion.p>
          <motion.h1
            {...fade}
            className="font-['Merriweather'] font-black text-stone-900 leading-[1.07] tracking-tight max-w-3xl"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4.4rem)" }}
          >
            Practice the real rounds. Then talk to someone who just got placed.
          </motion.h1>
          <motion.p {...fade} className="mt-6 max-w-xl text-[16px] leading-relaxed text-stone-600">
            Cognitive games and communication rounds in the style companies like Accenture actually run. When you are ready,
            book a 20-minute live call with a recently placed senior.
          </motion.p>
          <motion.div {...fade} className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              to={primaryTo}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 text-white text-[14.5px] font-semibold hover:bg-stone-700 transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/connect"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-stone-900 text-stone-900 text-[14.5px] font-semibold hover:bg-white transition-colors"
            >
              <Users className="w-4 h-4" />
              Book a Connect 1:1
            </Link>
          </motion.div>
          <motion.p {...fade} className="mt-4 text-[12.5px] text-stone-400">
            Create an account in under a minute. Works best on a phone or laptop.
          </motion.p>
        </section>

        {/* Rounds */}
        <section id="rounds" className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <motion.div {...fade} className="max-w-2xl mb-10">
              <h2 className="font-['Merriweather'] font-bold text-[1.8rem] sm:text-[2.2rem] leading-tight text-stone-900">
                Two kinds of rounds. Both practiced under time.
              </h2>
              <p className="mt-3 text-stone-600 leading-relaxed">
                Start with the round you are actually facing, not a feature tour.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              <motion.div {...fade} className="rounded-2xl border border-stone-200 p-6 sm:p-7" style={{ background: "#faf9f7" }}>
                <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-['Merriweather'] font-bold text-[1.2rem] text-stone-900">Cognitive games</h3>
                <p className="mt-2 text-[14px] text-stone-600 leading-relaxed">
                  The game-based aptitude round, played the way it is played on test day.
                </p>
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {cognitiveGames.map((g) => (
                    <li key={g} className="flex items-center gap-2 text-[13px] text-stone-700">
                      <Check className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" strokeWidth={3} />
                      {g}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div {...fade} className="rounded-2xl border border-stone-200 p-6 sm:p-7" style={{ background: "#faf9f7" }}>
                <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-4">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-['Merriweather'] font-bold text-[1.2rem] text-stone-900">Communication rounds</h3>
                <p className="mt-2 text-[14px] text-stone-600 leading-relaxed">
                  Speaking, writing and fluency tasks with a clock running, so the timing stops being a surprise.
                </p>
                <p className="mt-5 text-[13px] text-stone-500 leading-relaxed">
                  Two sets of communication rounds are available, plus AI mock interviews when you want to rehearse speaking out loud.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Connect */}
        <section id="connect" className="border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
              <motion.div {...fade}>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-stone-900 text-white mb-4">
                  Connect 1:1
                </span>
                <h2 className="font-['Merriweather'] font-bold text-[1.8rem] sm:text-[2.2rem] leading-tight text-stone-900">
                  20 minutes with someone who sat the same rounds last year.
                </h2>
                <p className="mt-4 text-stone-600 leading-relaxed">
                  Ask what the interview was really like, what to skip, and what you would do differently. This is a real call
                  with a real senior, not a chatbot and not a marketplace listing.
                </p>
                <p className="mt-4 text-[13px] text-stone-500 leading-relaxed">
                  Connect is run by hand. After you pay, our team confirms your slot and sends the meeting link. It is not instant,
                  and we would rather say so up front.
                </p>
                <Link
                  to="/connect"
                  className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white text-[14px] font-semibold hover:bg-stone-700 transition-colors"
                >
                  Browse seniors
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <ol className="space-y-4">
                {connectSteps.map((s) => (
                  <motion.li key={s.n} {...fade} className="flex gap-5 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                    <span className="font-['Merriweather'] font-black text-[1.5rem] text-stone-300 leading-none pt-0.5">{s.n}</span>
                    <div>
                      <h3 className="font-semibold text-[15px] text-stone-900">{s.title}</h3>
                      <p className="mt-1 text-[13.5px] text-stone-600 leading-relaxed">{s.body}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Extras */}
        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <motion.h2 {...fade} className="font-['Merriweather'] font-bold text-[1.6rem] sm:text-[2rem] text-stone-900 mb-8">
              Also inside
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {extras.map(({ icon: Icon, title, body, to }) => (
                <motion.div key={title} {...fade}>
                  <Link
                    to={to}
                    className="group block h-full rounded-2xl border border-stone-200 p-6 hover:border-stone-400 transition-colors"
                    style={{ background: "#faf9f7" }}
                  >
                    <Icon className="w-5 h-5 text-stone-700 mb-4" />
                    <h3 className="font-semibold text-[15px] text-stone-900">{title}</h3>
                    <p className="mt-1.5 text-[13.5px] text-stone-600 leading-relaxed">{body}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <motion.h2 {...fade} className="font-['Merriweather'] font-bold text-[1.8rem] sm:text-[2.2rem] text-stone-900 mb-2">
              Two ways in
            </motion.h2>
            <motion.p {...fade} className="text-stone-600 mb-10">Practice gets you ready. Connect gets you a real conversation.</motion.p>

            <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
              <motion.div {...fade} className="rounded-2xl border border-stone-200 bg-white p-7">
                <h3 className="font-semibold text-stone-900">Premium practice</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-['Merriweather'] font-black text-[2.4rem] text-stone-900">₹299</span>
                  <span className="text-stone-400 line-through text-[15px]">₹500</span>
                </p>
                <p className="mt-2 text-[13.5px] text-stone-600 leading-relaxed">
                  Unlocks the full practice suite: the cognitive games and communication rounds.
                </p>
                <Link
                  to={primaryTo}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-stone-900 text-stone-900 text-[14px] font-semibold hover:bg-stone-50 transition-colors"
                >
                  {isSignedIn ? "Open dashboard" : "Create account"}
                </Link>
              </motion.div>

              <motion.div {...fade} className="rounded-2xl border-2 border-stone-900 bg-white p-7">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                  Connect 1:1
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">Live</span>
                </h3>
                <p className="mt-3 font-['Merriweather'] font-black text-[1.6rem] leading-[2.6rem] text-stone-900">Priced per senior</p>
                <p className="mt-2 text-[13.5px] text-stone-600 leading-relaxed">
                  A 20-minute live call. You see the price before you pay, and you book separately from Premium.
                </p>
                <Link
                  to="/connect"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white text-[14px] font-semibold hover:bg-stone-700 transition-colors"
                >
                  See who is available
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-stone-200 bg-stone-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 text-center">
            <motion.h2 {...fade} className="font-['Merriweather'] font-black text-white leading-tight mx-auto max-w-2xl" style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)" }}>
              Your interview date is already on the calendar. Start today.
            </motion.h2>
            <motion.div {...fade} className="mt-8">
              <Link
                to={primaryTo}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-stone-900 text-[14.5px] font-semibold hover:bg-stone-100 transition-colors"
              >
                {primaryLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <span className="font-['Merriweather'] font-black text-[0.8rem] text-stone-700">HARRY THE BLAZE</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-stone-500">
            <Link to="/about" className="hover:text-stone-800">About</Link>
            <Link to="/blog" className="hover:text-stone-800">Blog</Link>
            <Link to="/placed-guru" className="hover:text-stone-800">Be a Guru</Link>
            <Link to="/terms" className="hover:text-stone-800">Terms</Link>
            <Link to="/refund" className="hover:text-stone-800">Refund policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
