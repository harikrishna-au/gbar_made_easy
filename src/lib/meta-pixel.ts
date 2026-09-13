declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID = "4433802600216830";

export function trackMeta(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (options?.eventID) {
    window.fbq("track", event, params ?? {}, { eventID: options.eventID });
  } else {
    window.fbq("track", event, params ?? {});
  }
}

export function trackMetaPageView() {
  trackMeta("PageView");
}

export function trackMetaPurchase(opts: {
  value: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  eventID?: string;
}) {
  trackMeta(
    "Purchase",
    {
      value: opts.value,
      currency: opts.currency ?? "INR",
      content_name: opts.contentName,
      content_ids: opts.contentIds,
      content_type: "product",
    },
    opts.eventID ? { eventID: opts.eventID } : undefined
  );
}

export function trackMetaInitiateCheckout(opts: {
  value: number;
  currency?: string;
  contentName?: string;
}) {
  trackMeta("InitiateCheckout", {
    value: opts.value,
    currency: opts.currency ?? "INR",
    content_name: opts.contentName,
  });
}

export function trackMetaViewContent(opts: {
  contentName: string;
  contentCategory?: string;
  value?: number;
}) {
  trackMeta("ViewContent", {
    content_name: opts.contentName,
    content_category: opts.contentCategory,
    value: opts.value,
    currency: "INR",
  });
}
