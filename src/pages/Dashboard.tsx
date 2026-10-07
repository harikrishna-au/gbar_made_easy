import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
import PageWrapper from "@/components/PageWrapper";
import OutlineButton from "@/components/OutlineButton";
import CompletionPopup from "@/components/CompletionPopup";
import FeedbackPopup from "@/components/FeedbackPopup";
import Header from "@/components/Header";
import SupportPopup from "@/components/SupportPopup";
import SEO from "@/components/SEO";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { toast } from "sonner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { LandingBackground } from "@/pages/landing/LandingBackground";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { CompanySelection } from "@/components/dashboard/CompanySelection";
import { TestimonialScroller } from "@/components/dashboard/TestimonialScroller";
import { CognitiveGamesPage } from "@/components/dashboard/CognitiveGamesPage";
import PaymentPopup from "@/components/PaymentPopup";


import { useSearchParams, useParams, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"recruitment" | "platform">("recruitment");
  const { isPremium, loading: premiumLoading } = usePremiumStatus();
  const { isSignedIn } = useAuth();
  // useRazorpay removed to force popup flow
  const [showTour, setShowTour] = useState(false);

  // Capture Referral Code
  useEffect(() => {
    const referralCode = searchParams.get("referral") || searchParams.get("refferal"); // Handle typo
    if (referralCode) {
      localStorage.setItem("referral_coupon", referralCode);
      localStorage.setItem("auto_open_payment", "true");
      // Optional: Clear param from URL? Maybe not needed for now.
    }
  }, [searchParams]);

  // Both the tour and the feedback survey are opened on a timer, and the effect
  // below re-runs as Clerk and the premium check settle. Each re-run used to queue
  // another copy of the same popup, so a new user could get the tour twice.
  const tourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFeedbackCheck = () => {
    if (feedbackTimer.current) return;
    const hasSeenFeedback = localStorage.getItem('has_seen_feedback_v1');
    if (hasSeenFeedback || premiumLoading || !isSignedIn) return;
    feedbackTimer.current = setTimeout(() => {
      setShowFeedbackPopup(true);
      localStorage.setItem('has_seen_feedback_v1', 'true');
    }, 2000);
  };

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('has_seen_tour_v1');
    if (!hasSeenTour) {
      if (tourTimer.current) return;
      tourTimer.current = setTimeout(() => setShowTour(true), 1000);
      // Feedback will be triggered after tour closes
      return;
    }
    // Tour already seen, safe to trigger feedback check directly
    triggerFeedbackCheck();
  }, [premiumLoading, isSignedIn]);

  useEffect(() => () => {
    if (tourTimer.current) clearTimeout(tourTimer.current);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const handleTourClose = () => {
    setShowTour(false);
    // Trigger feedback check when tour is closed
    triggerFeedbackCheck();
  };

  // Handle Auto-Open Payment (Referral Flow)
  useEffect(() => {
    const shouldAutoOpen = localStorage.getItem("auto_open_payment");
    // Waiting on the tour and the survey keeps this from opening a third overlay
    // on top of them; the flag survives until then, so the effect re-runs and
    // opens the popup once the others are dismissed.
    if (shouldAutoOpen && isSignedIn && !isPremium && !showTour && !showFeedbackPopup) {
      // Delay to let dashboard animations finish
      const timer = setTimeout(() => {
        setShowPaymentPopup(true);
        localStorage.removeItem("auto_open_payment");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isPremium, showTour, showFeedbackPopup]);

  const handleSubscribe = async () => {
    if (isPremium) {
      toast.success("You are already a Premium member!");
      return;
    }
    setShowPaymentPopup(true);
  };

  const companyName = companyId ? companyId.charAt(0).toUpperCase() + companyId.slice(1) : 'Assessment';

  return (
    <div className={`min-h-screen w-full flex flex-col items-center font-sans selection:bg-secondary/20 selection:text-secondary-foreground ${companyId ? 'overflow-y-auto' : 'overflow-y-auto'}`}>
      <SEO
        title="Harry The Blaze | Dashboard"
        description="Your central hub for MNC cognitive practice. Track progress, access games, and sharpen your skills for top company assessments."
      />
      <LandingBackground />

      {!companyId && (
        <div className={`w-full flex flex-col items-center transition-all duration-700 z-50`}>
          {/* Header - Transparent/Minimal */}
          <Header onStartTour={() => setShowTour(true)} />
        </div>
      )}

      <CompletionPopup />
      <SupportPopup isOpen={showSupportPopup} onClose={() => setShowSupportPopup(false)} />
      <FeedbackPopup
        isOpen={showFeedbackPopup}
        onClose={() => setShowFeedbackPopup(false)}
        feedbackType={feedbackType}
      />
      <PaymentPopup isOpen={showPaymentPopup} onClose={() => setShowPaymentPopup(false)} />
      <OnboardingTour
        isOpen={showTour}
        onClose={handleTourClose}
        mode={companyId ? 'journey' : 'landing'}
      />

      <div className={`relative z-10 flex-1 flex flex-col items-center w-full transition-all duration-500 ${companyId ? 'justify-start pt-16 p-3 sm:p-4' : 'p-3 sm:p-4 pt-16 md:p-8'}`}>
        <SignedIn>
          <div className={`flex flex-col items-center w-full max-w-6xl flex-1 ${companyId ? 'justify-start' : 'min-h-[60vh] justify-start'}`}>

            {/* Conditional Views */}
            {!companyId ? (
              // VIEW 1: Company Selection
              <CompanySelection
                onSelectCompany={(id) => navigate(`/dashboard/${id}`)}
                onFeedbackClick={() => {
                  setFeedbackType('recruitment');
                  setShowFeedbackPopup(true);
                }}
                onSupportClick={() => setShowSupportPopup(true)}
              />
            ) : (
              // VIEW 2: Cognitive Games
                <CognitiveGamesPage isPremium={isPremium} onSubscribe={handleSubscribe} />
            )}

          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center mt-20">
            <h2 className="text-2xl font-bold mb-4 font-['Merriweather'] text-stone-700">Please sign in to continue</h2>
            <SignInButton mode="modal">
              <OutlineButton variant="large">
                SIGN IN
              </OutlineButton>
            </SignInButton>
          </div>
        </SignedOut>
      </div>

      {!companyId && <TestimonialScroller />}

      {!companyId && (
        <DashboardFooter
          onFeedbackClick={() => {
            setFeedbackType('platform');
            setShowFeedbackPopup(true);
          }}
          onSupportClick={() => setShowSupportPopup(true)}
        />
      )}
    </div>
  );
};

export default Dashboard;
