/** Registers the service worker (production only) so the site is installable. */
export function registerServiceWorker() {
  if (import.meta.env.DEV || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* not installable on this browser; the website still works */
    });
  });
}
