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
        <span className="font-['Merriweather'] font-black text-[0.9rem] tracking-tight text-stone-800">
          HARRY THE BLAZE
        </span>
      </Rise>

      <div className="py-2">
        <Rise delay={120} className="mb-5">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 text-white font-['Inter'] text-[12px] font-semibold">
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
          className="font-['Merriweather'] font-black text-stone-900 leading-[1.06] tracking-tight mb-5"
          style={{ fontSize: "clamp(2.4rem, 4vw, 4rem)" }}
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
          className="font-['Inter'] text-stone-600 leading-relaxed mb-6 max-w-md"
          style={{ fontSize: "0.96rem" }}
        >
          Cognitive games and communication rounds modelled on the 2026 assessment, plus a 20-minute Connect 1:1 with a senior who cleared them. We confirm the slot and send one meeting link to both of you.
        </Rise>

        <Rise delay={300} className="mb-8">
          <Link
            to="/connect"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-stone-900 text-white font-['Inter'] font-semibold text-[15px] hover:bg-stone-700 transition-colors"
            style={{ boxShadow: "0 12px 32px rgba(28,25,23,0.28)" }}
          >
            Book a Connect 1:1
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href="#practice"
            className="ml-3 inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-stone-200 bg-white text-stone-800 font-['Inter'] font-semibold text-[15px] hover:border-stone-900 transition-colors"
          >
            See the rounds
          </a>
        </Rise>

      </div>

      <a href="#practice" className="font-['Inter'] text-[12px] text-stone-400 hover:text-stone-600">Scroll for how it works ↓</a>
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
          className="bg-white rounded-3xl p-8 border border-stone-100 relative"
          style={{
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.09), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* top accent line — inset + rounded so it doesn't need overflow-hidden
              (which was clipping Clerk's form labels) */}
          <div
            className="absolute top-0 left-10 right-10 h-[3px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(201,164,110,0.5), transparent)" }}
          />

          <SignedOut>
            {!isLoaded ? (
              <AuthSkeleton />
            ) : (
              <>
                <div className={`flex gap-1 p-1 rounded-2xl bg-stone-100 border border-stone-200 mb-7 ${isClerkVerificationStep ? "hidden" : ""}`}>
                  {(["sign-up", "sign-in"] as AuthView[]).map((v) => {
                    const active = view === v;
                    const Icon = v === "sign-up" ? UserPlus : LogIn;
                    return (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="flex-1 py-2.5 rounded-xl font-['Inter'] transition-all duration-200 active:scale-[0.97] flex flex-col items-center leading-tight gap-0.5"
                        style={
                          active
                            ? { background: "#ffffff", color: "#1c1c1e", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }
                            : { color: "#a8a29e" }
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-['Inter'] font-semibold bg-stone-100 text-stone-600 border border-stone-200 mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                          Welcome back
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-['Inter'] font-semibold bg-stone-100 text-stone-600 border border-stone-200 mb-3">
                          <Sparkles className="w-3 h-3" />
                          Free forever · No credit card
                        </span>
                      )}
                      <h2 className="font-['Merriweather'] font-bold text-[1.35rem] text-stone-900 mb-1">
                        {view === "sign-in" ? "Welcome back" : "Create your free account"}
                      </h2>
                      <p className="font-['Inter'] text-[13px] text-stone-500">
                        {view === "sign-in"
                          ? "Sign in to continue your prep."
                          : "Create an account. Takes under a minute."}
                      </p>

                      {view === "sign-up" && (
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-3">
                          {["Free forever", "No credit card", "Ready in 60s"].map((b) => (
                            <span key={b} className="inline-flex items-center gap-1 text-[11px] font-['Inter'] font-medium text-stone-500">
                              <Check className="w-3 h-3 text-stone-500" strokeWidth={3} />
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {isClerkVerificationStep && (
                  <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <Mail className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-['Inter'] text-[12.5px] font-semibold text-stone-900 leading-snug">
                        Check your email to verify
                      </p>
                      <p className="font-['Inter'] text-[11.5px] text-stone-600 leading-snug mt-0.5">
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
                  <p className="mt-5 text-center font-['Inter'] text-[12.5px] text-stone-500">
                    {view === "sign-in" ? "New to Harry The Blaze? " : "Already have an account? "}
                    <button
                      onClick={() => setView(view === "sign-in" ? "sign-up" : "sign-in")}
                      className="font-semibold text-stone-900 hover:underline underline-offset-2"
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
              <h2 className="font-['Merriweather'] font-bold text-[1.3rem] text-stone-900 mb-2">
                Welcome back!
              </h2>
              {isPremium ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-900 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span className="text-[12px] font-semibold font-['Inter'] text-white">Premium Member</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 mb-3">
                  <span className="text-[12px] font-medium font-['Inter'] text-stone-500">Free Plan</span>
                </div>
              )}
              <p className="font-['Inter'] text-[13.5px] text-stone-500 mb-7">
                Continue where you left off.
              </p>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-['Inter'] font-semibold text-[14px] bg-stone-900 text-white hover:bg-stone-700 transition-colors duration-200"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <Link
                to="/connect"
                className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-['Inter'] font-medium text-[13.5px] text-stone-500 border border-stone-200 hover:bg-stone-50 transition-colors duration-200"
              >
                Browse Placed Gurus
              </Link>
            </div>
          </SignedIn>
        </div>

        {/* card glow */}
        <div
          className="absolute -inset-4 -z-10 blur-[40px] opacity-30 rounded-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(28,25,23,0.08) 0%, transparent 70%)" }}
        />
        </motion.div>
      </Rise>

      {/* trust microcopy under card */}
      <SignedOut>
        <Rise
          delay={500}
          className="flex items-center gap-2 text-stone-400"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-['Inter'] text-[11.5px]">
            Secure sign-in · We never share your data
          </span>
        </Rise>
      </SignedOut>
    </div>
  </div>
);
