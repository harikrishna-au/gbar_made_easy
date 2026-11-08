import { motion, AnimatePresence, SpringValue } from "framer-motion";
import { Rise } from "cube-motion/react";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { Link, NavigateFunction } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Mail, UserPlus, LogIn, Check } from "lucide-react";
import { AuthView, clerkAppearance, AuthSkeleton } from "./authConfig";

interface Feature {
  icon: React.ElementType;
  label: string;
  sub: string;
  to?: string;
  href?: string;
  featured?: boolean;
}

interface LandingDesktopProps {
  view: AuthView;
  setView: (v: AuthView) => void;
  navigate: NavigateFunction;
  isPremium: boolean;
  isLoaded: boolean;
  isClerkVerificationStep: boolean;
  features: Feature[];
  sX: SpringValue<number>;
  sY: SpringValue<number>;
  onMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLeave: () => void;
}

export const LandingDesktop = ({
  view,
  setView,
  navigate,
  isPremium,
  isLoaded,
  isClerkVerificationStep,
  features,
  sX,
  sY,
  onMove,
  onLeave,
}: LandingDesktopProps) => (
  <div className="hidden lg:flex relative z-10 min-h-screen flex-row">
    {/* Left: brand + hero */}
    <div className="flex flex-col justify-between px-14 py-12 w-[54%] min-h-screen">
      <Rise
        className="flex items-center gap-2.5"
      >
        <motion.img
          src="/favicon.svg"
          alt="Harry The Blaze"
          whileHover={{ scale: 1.08, rotate: 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-8 h-8 flex-shrink-0"
          style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.22))" }}
        />
        <span className="font-display text-xl font-normal uppercase tracking-[0.005em] text-[var(--color-ink)]">
          HARRY THE BLAZE
        </span>
      </Rise>

      <div className="py-2">
        <Rise delay={120} className="mb-5">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] font-['Inter'] text-[12px] font-semibold">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            Connect 1:1 is live
          </span>
        </Rise>

        <Rise
          as="h1"
          delay={160}
          className="font-display font-normal uppercase text-[var(--color-ink)] leading-[0.95] tracking-[0.005em] mb-6"
          style={{ fontSize: "clamp(3rem, 5.2vw, 5.5rem)" }}
        >
          Practice the real
          <br />
          Accenture rounds.
          <br />
          Then talk to someone
          <br />
          who just got placed.
        </Rise>

        <Rise
          as="p"
          delay={250}
          className="font-['Inter'] text-[var(--color-ink)] leading-relaxed mb-8 max-w-md"
          style={{ fontSize: "0.96rem" }}
        >
          Cognitive games and communication rounds modelled on the 2026 assessment, plus a 20-minute Connect 1:1 with a senior who cleared them. We confirm the slot and send one meeting link to both of you.
        </Rise>

        <Rise delay={300} className="mb-8">
          <Link
            to="/connect"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 bg-[var(--color-accent)] text-[var(--color-ink)] font-['Inter'] font-semibold text-[15px] shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Book a Connect 1:1
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/"
            className="ml-4 inline-flex items-center gap-2 px-5 py-3.5 bg-[var(--color-paper-3)] text-[var(--color-ink)] font-['Inter'] font-semibold text-[15px] shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            See how it works
          </Link>
        </Rise>

      </div>

      <nav className="flex items-center gap-5 flex-wrap" aria-label="More">
        {[
          { label: "About", to: "/about" },
          { label: "Terms", to: "/terms" },
          { label: "Connect 1:1", to: "/connect" },
          { label: "Be a Guru", to: "/placed-guru" },
        ].map(({ label, to }) => (
          <Link key={label} to={to} className="text-[13px] font-['Inter'] text-[var(--color-muted)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] transition-colors">
            {label}
          </Link>
        ))}
      </nav>
    </div>

    {/* Right: auth card */}
    <div id="auth-section" className="flex-1 flex flex-col items-center justify-center px-8 gap-4 scroll-mt-4">
      <Rise
        delay={220}
        className="w-full max-w-[390px] relative"
      >
        <motion.div
          style={{ rotateX: sX, rotateY: sY, transformStyle: "preserve-3d", perspective: 1000 }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="w-full h-full relative"
        >
        <div
          className="relative bg-[var(--color-paper-3)] p-8 shadow-[var(--shadow-sheet)]"
        >

          <SignedOut>
            {!isLoaded ? (
              <AuthSkeleton />
            ) : (
              <>
                <div className={`flex gap-1 p-1 bg-[var(--color-paper-2)] mb-7 ${isClerkVerificationStep ? "hidden" : ""}`}>
                  {(["sign-up", "sign-in"] as AuthView[]).map((v) => {
                    const active = view === v;
                    const Icon = v === "sign-up" ? UserPlus : LogIn;
                    return (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="flex-1 py-2.5 font-['Inter'] transition-all duration-200 active:scale-[0.97] flex flex-col items-center leading-tight gap-0.5"
                        style={
                          active
                            ? { background: "var(--color-ink)", color: "var(--color-paper)" }
                            : { color: "var(--color-muted)" }
                        }
                      >
                        <span className="flex items-center gap-1.5 text-[13px] font-bold">
                          <Icon className="w-3.5 h-3.5" />
                          {v === "sign-up" ? "Sign Up" : "Sign In"}
                        </span>
                        <span className="text-[11px] font-medium opacity-75">
                          {v === "sign-up" ? "New here — it's free" : "I have an account"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!isClerkVerificationStep && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view + "-head"}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -7 }}
                      transition={{ duration: 0.18 }}
                      className="mb-5"
                    >
                      {view === "sign-in" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-['Inter'] font-semibold bg-[var(--color-paper-2)] text-[var(--color-ink)] mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                          Welcome back
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-['Inter'] font-semibold bg-[var(--color-paper-2)] text-[var(--color-ink)] mb-3">
                          <Sparkles className="w-3 h-3" />
                          Free forever · No credit card
                        </span>
                      )}
                      <h2 className="font-display font-normal uppercase text-[1.9rem] leading-none text-[var(--color-ink)] mb-2">
                        {view === "sign-in" ? "Welcome back" : "Create your free account"}
                      </h2>
                      <p className="font-['Inter'] text-[13px] text-[var(--color-muted)]">
                        {view === "sign-in"
                          ? "Sign in to continue your prep."
                          : "Create an account. Takes under a minute."}
                      </p>

                      {view === "sign-up" && (
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-3">
                          {["Free forever", "No credit card", "Ready in 60s"].map((b) => (
                            <span key={b} className="inline-flex items-center gap-1 text-[11px] font-['Inter'] font-medium text-[var(--color-muted)]">
                              <Check className="w-3 h-3 text-[var(--color-muted)]" strokeWidth={3} />
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {isClerkVerificationStep && (
                  <div className="mb-5 flex items-start gap-3 p-3.5 bg-[var(--color-paper-2)]">
                    <Mail className="w-4 h-4 text-[var(--color-ink)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-['Inter'] text-[12.5px] font-semibold text-[var(--color-ink)] leading-snug">
                        Check your email to verify
                      </p>
                      <p className="font-['Inter'] text-[11.5px] text-[var(--color-ink)] leading-snug mt-0.5">
                        We just sent you a verification email. Open the link in it or enter the code below, in this same browser. If it hasn't arrived in a minute, check your <span className="font-semibold">spam folder</span>, then tap Resend once.
                      </p>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={view + "-clerk"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    {view === "sign-in" ? (
                      <SignIn routing="hash" forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
                    ) : (
                      <SignUp routing="hash" forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
                    )}
                  </motion.div>
                </AnimatePresence>

                {!isClerkVerificationStep && (
                  <p className="mt-5 text-center font-['Inter'] text-[12.5px] text-[var(--color-muted)]">
                    {view === "sign-in" ? "New to Harry The Blaze? " : "Already have an account? "}
                    <button
                      onClick={() => setView(view === "sign-in" ? "sign-up" : "sign-in")}
                      className="font-semibold text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
                    >
                      {view === "sign-in" ? "Create a free account" : "Sign in instead"}
                    </button>
                  </p>
                )}
              </>
            )}
          </SignedOut>

          <SignedIn>
            <div className="text-center py-4">
              <div className="flex justify-center mb-5">
                <UserButton />
              </div>
              <h2 className="font-display font-normal uppercase text-[2rem] leading-none text-[var(--color-ink)] mb-3">
                Welcome back!
              </h2>
              {isPremium ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-ink)] mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span className="text-[12px] font-semibold font-['Inter'] text-white">Premium Member</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-paper-2)] mb-3">
                  <span className="text-[12px] font-medium font-['Inter'] text-[var(--color-muted)]">Free Plan</span>
                </div>
              )}
              <p className="font-['Inter'] text-[13.5px] text-[var(--color-muted)] mb-7">
                Continue where you left off.
              </p>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center justify-center gap-2 py-3 font-['Inter'] font-semibold text-[14px] bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <Link
                to="/connect"
                className="mt-5 flex items-center justify-center gap-2 py-3 font-['Inter'] font-medium text-[13.5px] text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
              >
                Browse Placed Gurus
              </Link>
            </div>
          </SignedIn>
        </div>

        </motion.div>
      </Rise>

      {/* trust microcopy under card */}
      <SignedOut>
        <Rise
          delay={500}
          className="flex items-center gap-2 text-[var(--color-muted)]"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <span className="font-['Inter'] text-[11.5px]">
            Secure sign-in · We never share your data
          </span>
        </Rise>
      </SignedOut>
    </div>
  </div>
);
