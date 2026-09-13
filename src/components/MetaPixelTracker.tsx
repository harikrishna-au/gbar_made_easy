import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackMetaPageView } from "@/lib/meta-pixel";

/** Fires PageView on every client-side route change (SPA). */
export function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return null;
}
