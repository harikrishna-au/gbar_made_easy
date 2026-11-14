import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { eventsForPath, identify, markSessionStart, track } from "@/lib/analytics";

/** Page views, per-feature events and sign-in / sign-up, for every route. Renders nothing. */
export function AnalyticsTracker() {
  const location = useLocation();
  const { user, isLoaded } = useUser();

  // Who is this? Also records a sign-in once per session and a sign-up once per account.
  useEffect(() => {
    if (!isLoaded) return;
    identify(user?.id ?? null);
    if (!user) return;
    try {
      if (!sessionStorage.getItem("hb_signed_in")) {
        sessionStorage.setItem("hb_signed_in", "1");
        track("signed_in");
      }
      const createdMs = user.createdAt ? new Date(user.createdAt).getTime() : 0;
      const signupKey = `hb_signup_${user.id}`;
      // Count it as a sign-up only if the account is brand new and we have not logged it yet.
      if (createdMs && Date.now() - createdMs < 30 * 60 * 1000 && !localStorage.getItem(signupKey)) {
        localStorage.setItem(signupKey, "1");
        track("signup");
      }
    } catch { /* storage blocked: skip */ }
  }, [isLoaded, user]);

  useEffect(() => {
    markSessionStart();
    for (const [event, props] of eventsForPath(location.pathname)) track(event, props);
  }, [location.pathname]);

  return null;
}
