"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getAnalyticsConfig, sendAnalyticsEvent } from "@/lib/analytics";

const { pageViewEventName, productViewEventName, buttonClickEventName } = getAnalyticsConfig();

interface AnalyticsEventBase {
  id: string;
  timestamp: string;
}

export interface PageVisitEvent extends AnalyticsEventBase {
  type: "page";
  path: string;
  search?: string | null;
  referrer?: string | null;
  title?: string | null;
}

export interface ProductViewEvent extends AnalyticsEventBase {
  type: "product";
  productId: string;
  name?: string | null;
  brand?: string | null;
}

export interface ButtonClickEvent extends AnalyticsEventBase {
  type: "button";
  action: string;
  label?: string | null;
  context?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AnalyticsState {
  pageVisits: PageVisitEvent[];
  productViews: ProductViewEvent[];
  buttonClicks: ButtonClickEvent[];
}

type AnalyticsAction =
  | { type: "page"; payload: PageVisitEvent }
  | { type: "product"; payload: ProductViewEvent }
  | { type: "button"; payload: ButtonClickEvent };

const initialState: AnalyticsState = {
  pageVisits: [],
  productViews: [],
  buttonClicks: [],
};

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case "page":
      return { ...state, pageVisits: [action.payload, ...state.pageVisits].slice(0, 200) };
    case "product":
      return { ...state, productViews: [action.payload, ...state.productViews].slice(0, 200) };
    case "button":
      return { ...state, buttonClicks: [action.payload, ...state.buttonClicks].slice(0, 200) };
    default:
      return state;
  }
}

export interface TrackPageVisitOptions {
  path: string;
  search?: string | null;
  title?: string | null;
  referrer?: string | null;
}

export interface TrackProductViewOptions {
  productId: string;
  name?: string | null;
  brand?: string | null;
}

export interface TrackButtonClickOptions {
  action: string;
  label?: string | null;
  context?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AnalyticsContextValue {
  state: AnalyticsState;
  trackPageVisit: (options: TrackPageVisitOptions) => void;
  trackProductView: (options: TrackProductViewOptions) => void;
  trackButtonClick: (options: TrackButtonClickOptions) => void;
}

export const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

function createEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function extractLabel(
  providedLabel: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const primary = typeof providedLabel === "string" && providedLabel.trim().length > 0 ? providedLabel : null;

  if (primary) {
    return primary;
  }

  const secondary = typeof fallback === "string" && fallback.trim().length > 0 ? fallback : null;

  return secondary;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  const trackPageVisit = useCallback(
    ({ path, search = null, title = null, referrer = null }: TrackPageVisitOptions) => {
      const payload: PageVisitEvent = {
        id: createEventId(),
        type: "page",
        timestamp: createTimestamp(),
        path,
        search: search && search.length > 0 ? search : null,
        title: title ?? null,
        referrer: referrer ?? null,
      };

      dispatch({ type: "page", payload });

      sendAnalyticsEvent(pageViewEventName, {
        path,
        search,
        title,
        referrer,
      });
    },
    []);

  const trackProductView = useCallback(
    ({ productId, name = null, brand = null }: TrackProductViewOptions) => {
      const payload: ProductViewEvent = {
        id: createEventId(),
        type: "product",
        timestamp: createTimestamp(),
        productId,
        name: name ?? null,
        brand: brand ?? null,
      };

      dispatch({ type: "product", payload });

      sendAnalyticsEvent(productViewEventName, {
        productId,
        name,
        brand,
      });
    },
    []);

  const trackButtonClick = useCallback(
    ({ action, label = null, context = null, metadata = null }: TrackButtonClickOptions) => {
      const normalizedAction = extractLabel(action, "click") ?? "click";
      const payload: ButtonClickEvent = {
        id: createEventId(),
        type: "button",
        timestamp: createTimestamp(),
        action: normalizedAction,
        label: label ?? null,
        context: context ?? null,
        metadata: metadata ?? null,
      };

      dispatch({ type: "button", payload });

      sendAnalyticsEvent(buttonClickEventName, {
        action: normalizedAction,
        label,
        context,
        metadata,
      });
    },
    []);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const searchString = searchParams?.toString() ?? "";
    const compositePath = searchString ? `${pathname}?${searchString}` : pathname;

    if (lastTrackedPath.current === compositePath) {
      return;
    }

    lastTrackedPath.current = compositePath;

    if (typeof window === "undefined") {
      return;
    }

    trackPageVisit({
      path: pathname,
      search: searchString || null,
      referrer: document.referrer || null,
      title: document.title || null,
    });
  }, [pathname, searchParams, trackPageVisit]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      state,
      trackPageVisit,
      trackProductView,
      trackButtonClick,
    }),
    [state, trackPageVisit, trackProductView, trackButtonClick],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
