import { motion, AnimatePresence } from "framer-motion";
import { Rise } from "cube-motion/react";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { Link, NavigateFunction } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Mail } from "lucide-react";
import { AuthView, clerkAppearance, AuthSkeleton } from "./authConfig";

interface Feature {
  icon: React.ElementType;
  label: string;
  sub: string;
  to?: string;
  href?: string;
  featured?: boolean;
}

interface LandingMobileProps {
  view: AuthView;
  setView: (v: AuthView) => void;
  navigate: NavigateFunction;
  isPremium: boolean;
  isLoaded: boolean;
  isClerkVerificationStep: boolean;
  features: Feature[];
}

export const LandingMobile = ({
  view,
  setView,
  navigate,
  isPremium,
  isLoaded,
  isClerkVerificationStep,
  features,
}: LandingMobileProps) => (
  <div className="lg:hidden relative z-10">
    <SignedIn>
      <div className="min-h-dvh flex flex-col items-center justify-center px-5">
        <Rise className="w-full text-center">
          <div className="flex justify-center mb-5">
            <UserButton />
          </div>
          <h2 className="font-display font-normal uppercase text-4xl leading-none text-[var(--color-ink)] mb-3">
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
          <p className="font-['Inter'] text-[14px] text-[var(--color-muted)] mb-8">
            Continue where you left off.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center justify-center gap-2 py-4 font-['Inter'] font-semibold text-[15px] bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[var(--shadow-offset)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-[transform,box-shadow] mb-5"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/connect"
            className="flex items-center justify-center gap-2 py-3.5 font-['Inter'] font-medium text-[14px] text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4"
          >
            Browse Placed Gurus
          </Link>
        </Rise>
      </div>
    </SignedIn>

    <SignedOut>
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/favicon.svg"
            alt="Harry The Blaze"
            className="w-7 h-7 flex-shrink-0"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.22))" }}
          />
          <span className="font-display text-lg font-normal uppercase text-[var(--color-ink)] truncate">
            HARRY THE BLAZE
          </span>
        </div>
        <a
          href="#auth-section"
          onClick={() => setView("sign-in")}
          className="inline-flex items-center justify-center min-h-[44px] px-3 font-['Inter'] text-[13px] font-semibold text-[var(--color-ink)]"
        >
          Sign in
        </a>
      </header>

      <section id="auth-section" className="px-5 pt-4 pb-16 scroll-mt-4">
        <h1 className="font-display font-normal uppercase text-[2.75rem] text-[var(--color-ink)] leading-[0.95]">
          {view === "sign-in" ? "Welcome back" : "Practice the real rounds."}
        </h1>
        <p className="font-['Inter'] text-[14px] text-[var(--color-ink)] mt-1.5 mb-5 leading-snug">
          {view === "sign-in"
            ? "Sign in to continue your prep."
            : "Free account in under a minute. No credit card. Then book a 1:1 with someone who just got placed."}
        </p>

        <div
          className="bg-[var(--color-paper-3)] p-4 shadow-[var(--shadow-sheet)]"
        >
          {!isLoaded ? (
            <AuthSkeleton />
          ) : (
            <>
              {!isClerkVerificationStep && (
                <div
                  className="flex p-1 mb-4 bg-[var(--color-paper-2)]"
                  role="tablist"
                  aria-label="Account"
                >
                  {(["sign-up", "sign-in"] as AuthView[]).map((v) => {
                    const active = view === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setView(v)}
                        className="flex-1 min-h-[40px] font-['Inter'] text-[13.5px] font-semibold transition-all duration-200 active:scale-[0.98]"
                        style={
                          active
                            ? { background: "var(--color-ink)", color: "var(--color-paper)" }
                            : { color: "var(--color-muted)" }
                        }
                      >
                        {v === "sign-up" ? "Sign up" : "Sign in"}
                      </button>
                    );
                  })}
                </div>
              )}

              {isClerkVerificationStep && (
                <div className="mb-4 flex items-start gap-3 p-3 bg-[var(--color-paper-2)]">
                  <Mail className="w-4 h-4 text-[var(--color-ink)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-['Inter'] text-[13px] font-semibold text-[var(--color-ink)] leading-snug">
                      Check your email to verify
                    </p>
                    <p className="font-['Inter'] text-[12px] text-[var(--color-ink)] leading-snug mt-0.5">
                      Open the link in the email or enter the code below, in this same browser. Not there after a minute? Check spam, then tap Resend once.
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={view + "-mob"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full"
                >
                  {view === "sign-in" ? (
                    <SignIn routing="hash" forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
                  ) : (
                    <SignUp routing="hash" forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <span className="font-['Inter'] text-[11px] text-[var(--color-muted)]">
            Secure · We never share your data
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-1 pt-1" aria-label="More">
          {[
            { label: "How it works", to: "/" },
            { label: "Connect 1:1", to: "/connect" },
            { label: "About", to: "/about" },
            { label: "Terms", to: "/terms" },
          ].map(({ label, to }) => (
            <Link key={label} to={to} className="inline-flex items-center justify-center min-h-[44px] px-2.5 text-[12px] font-['Inter'] text-[var(--color-muted)]">
              {label}
            </Link>
          ))}
        </nav>
      </section>
    </SignedOut>
  </div>
);
