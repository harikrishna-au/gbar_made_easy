import { useEffect, useState } from "react";
import { isStandalone, track } from "@/lib/analytics";

/**
 * One shared "install the app" prompt for the whole site. The browser fires
 * `beforeinstallprompt` once, early, so it is captured here at import time (see main.tsx)
 * and handed to whichever button or card the visitor uses.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Platform = "ios" | "android" | "desktop";

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // keep it for our own button instead of the browser's mini-bar
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    track("pwa_installed");
    deferred = null;
    installed = true;
    notify();
  });
}

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/** Plain-language steps for browsers that cannot show the one-tap install. */
export function installSteps(platform: Platform): string[] {
  if (platform === "ios") {
    return ["Open this site in Safari.", "Tap the Share button.", "Choose “Add to Home Screen”, then tap Add."];
  }
  if (platform === "android") {
    return ["Open the browser menu (⋮).", "Tap “Install app” or “Add to Home screen”.", "Confirm, and the app appears on your home screen."];
  }
  return ["Click the install icon at the right of the address bar,", "or open the browser menu and choose “Install Harry The Blaze”."];
}

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const platform = detectPlatform();
  const isInstalled = installed || isStandalone();
  const canPrompt = !!deferred && !isInstalled;

  /** One tap when the browser allows it; otherwise returns "manual" so the caller shows the steps. */
  const install = async (): Promise<"accepted" | "dismissed" | "manual"> => {
    track("install_button_click", { platform, one_tap: !!deferred });
    if (!deferred) return "manual";
    const evt = deferred;
    deferred = null;
    notify();
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    track("install_prompt_result", { outcome });
    return outcome;
  };

  return { platform, isInstalled, canPrompt, install };
}
