import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, Share, X } from "lucide-react";
import { track } from "@/lib/analytics";
import { installSteps, useInstall } from "@/lib/install";

const DISMISS_KEY = "hb_install_dismissed_until";
const SHOW_AFTER_MS = 15_000;
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

const dismissedRecently = () => {
  try { return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now(); } catch { return false; }
};

/**
 * A small card on the dashboard telling visitors they can install the site as an app.
 * Android/desktop Chrome: a one-tap Install button. iPhone: the Add to Home Screen steps.
 */
export function InstallPrompt() {
  const { pathname } = useLocation();
  const { platform, isInstalled, canPrompt, install } = useInstall();
  const [visible, setVisible] = useState(false);

  // Show on the dashboard when we can either install in one tap, or explain it (iPhone).
  const worthShowing = !isInstalled && (canPrompt || platform === "ios");
  const onDashboard = pathname === "/dashboard";

  useEffect(() => {
    if (!worthShowing || !onDashboard || dismissedRecently()) { setVisible(false); return; }
    const t = setTimeout(() => { setVisible(true); track("install_prompt_shown", { platform }); }, SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [worthShowing, onDashboard, platform]);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_FOR_MS)); } catch { /* ignore */ }
    track("install_prompt_dismissed");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install the app"
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto flex max-w-sm items-start gap-3 border border-[var(--color-ink)] bg-[var(--color-paper-3)] p-3 text-[var(--color-ink)] shadow-[var(--shadow-offset)] animate-in fade-in slide-in-from-bottom-4 sm:left-4 sm:right-auto sm:mx-0"
    >
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">You can install this site as an app</p>
        {canPrompt ? (
          <p className="text-xs text-[var(--color-muted)]">Open it from your home screen, full screen. No app store needed.</p>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            <Share className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {installSteps(platform).slice(1).join(" ")}
          </p>
        )}
        {canPrompt && (
          <button
            type="button"
            onClick={async () => { setVisible(false); await install(); }}
            className="mt-2 inline-flex items-center gap-1.5 bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <Download className="h-4 w-4" aria-hidden /> Install
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="border border-[var(--color-ink)] p-1.5 hover:bg-[var(--color-accent)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
