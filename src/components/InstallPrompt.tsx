import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, X } from "lucide-react";
import { isStandalone, track } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "hb_install_dismissed_until";
const SHOW_AFTER_MS = 15_000;
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

const dismissedRecently = () => {
  try { return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now(); } catch { return false; }
};

/** A small "Install the app" card on the dashboard, shown only when the browser says it can. */
export function InstallPrompt() {
  const { pathname } = useLocation();
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [available, setAvailable] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already the installed app
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep it for our own card instead of the browser's default mini-bar
      deferred.current = e as BeforeInstallPromptEvent;
      setAvailable(true);
    };
    const onInstalled = () => {
      track("pwa_installed");
      deferred.current = null;
      setAvailable(false);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onDashboard = pathname === "/dashboard";
  useEffect(() => {
    if (!available || !onDashboard || dismissedRecently()) { setVisible(false); return; }
    const t = setTimeout(() => { setVisible(true); track("install_prompt_shown"); }, SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [available, onDashboard]);

  if (!visible || !deferred.current) return null;

  const install = async () => {
    const evt = deferred.current;
    if (!evt) return;
    setVisible(false);
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    track("install_prompt_result", { outcome });
    deferred.current = null;
    setAvailable(false);
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_FOR_MS)); } catch { /* ignore */ }
    track("install_prompt_dismissed");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install the app"
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto flex max-w-sm items-center gap-3 border border-[var(--color-ink)] bg-[var(--color-paper-3)] p-3 text-[var(--color-ink)] shadow-[var(--shadow-offset)] animate-in fade-in slide-in-from-bottom-4 sm:left-4 sm:right-auto sm:mx-0"
    >
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">Install Harry The Blaze</p>
        <p className="text-xs text-[var(--color-muted)]">Open it from your home screen, full screen.</p>
      </div>
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      >
        <Download className="h-4 w-4" aria-hidden /> Install
      </button>
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
