interface AnalyticsConfig {
  enabled: boolean;
  pageViewEventName: string;
  productViewEventName: string;
  buttonClickEventName: string;
  scriptUrl?: string;
  websiteId?: string;
}

declare global {
  interface Window {
    umami?: {
      track?: (eventName: string, eventData?: Record<string, unknown>) => void;
      trackEvent?: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

const DEFAULT_PAGE_VIEW_EVENT = "page_visit";
const DEFAULT_PRODUCT_VIEW_EVENT = "product_view";
const DEFAULT_BUTTON_CLICK_EVENT = "interaction";

let cachedConfig: AnalyticsConfig | null = null;

export function getAnalyticsConfig(): AnalyticsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://analytics.umami.is/script.js";

  cachedConfig = {
    enabled: Boolean(websiteId),
    pageViewEventName: process.env.NEXT_PUBLIC_ANALYTICS_PAGE_EVENT ?? DEFAULT_PAGE_VIEW_EVENT,
    productViewEventName: process.env.NEXT_PUBLIC_ANALYTICS_PRODUCT_EVENT ?? DEFAULT_PRODUCT_VIEW_EVENT,
    buttonClickEventName: process.env.NEXT_PUBLIC_ANALYTICS_BUTTON_EVENT ?? DEFAULT_BUTTON_CLICK_EVENT,
    scriptUrl,
    websiteId: websiteId ?? undefined,
  };

  return cachedConfig;
}

export function sendAnalyticsEvent(eventName: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const umami = window.umami;

  if (!umami) {
    return;
  }

  if (typeof umami.track === "function") {
    umami.track(eventName, data);
    return;
  }

  if (typeof umami.trackEvent === "function") {
    umami.trackEvent(eventName, data);
  }
}
