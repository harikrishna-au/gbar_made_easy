// Polyfill for requestIdleCallback
if (typeof globalThis !== 'undefined') {
  if (!globalThis.requestIdleCallback) {
    globalThis.requestIdleCallback = function (cb: any) {
      const start = Date.now();
      return window.setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    } as any;
  }

  if (!globalThis.cancelIdleCallback) {
    globalThis.cancelIdleCallback = function (id: any) {
      clearTimeout(id);
    } as any;
  }
}

if (!window.requestIdleCallback) {
  window.requestIdleCallback = (globalThis as any).requestIdleCallback;
}
if (!window.cancelIdleCallback) {
  window.cancelIdleCallback = (globalThis as any).cancelIdleCallback;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
