import type { ProductSummary } from "@/types/api";

export interface CompareProductPreview {
  id: string;
  title: string;
  brand?: string | null;
  image?: string | null;
  source?: string | null;
  priceText?: string | null;
  priceValue?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
}

export interface CompareNavigationState {
  product?: CompareProductPreview;
}

const STORAGE_KEY = "fitidion:compare:previews";
const NAVIGATION_STATE_KEY = "__fitidionCompareNavigationState__";
const NAVIGATION_EVENT = "fitidion:compare-navigation";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

type StoredPreviewMap = Record<string, { product: CompareProductPreview; timestamp: number }>;

type NavigationStatePayload = {
  state: CompareNavigationState | null;
  updatedAt: number;
};

function isStoredPreviewMap(value: unknown): value is StoredPreviewMap {
  return !!value && typeof value === "object";
}

function readPreviewMap(): StoredPreviewMap {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredPreviewMap(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore JSON errors and return a fresh object.
  }

  return {};
}

function writePreviewMap(map: StoredPreviewMap) {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota/security errors.
  }
}

function pruneExpiredEntries(map: StoredPreviewMap): StoredPreviewMap {
  const now = Date.now();
  const entries = Object.entries(map);
  let mutated = false;

  for (const [key, value] of entries) {
    if (!value || typeof value !== "object") {
      delete map[key];
      mutated = true;
      continue;
    }

    if (typeof value.timestamp !== "number" || now - value.timestamp > CACHE_TTL_MS) {
      delete map[key];
      mutated = true;
    }
  }

  if (mutated) {
    writePreviewMap(map);
  }

  return map;
}

export function cacheCompareProduct(preview: CompareProductPreview) {
  if (!preview?.id) {
    return;
  }

  const map = pruneExpiredEntries(readPreviewMap());
  map[preview.id] = {
    product: preview,
    timestamp: Date.now(),
  };
  writePreviewMap(map);
}

export function loadCachedCompareProduct(id: string): CompareProductPreview | null {
  if (!id) {
    return null;
  }

  const map = pruneExpiredEntries(readPreviewMap());
  const entry = map[id];
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const { product, timestamp } = entry;
  if (!product || typeof timestamp !== "number") {
    delete map[id];
    writePreviewMap(map);
    return null;
  }

  if (Date.now() - timestamp > CACHE_TTL_MS) {
    delete map[id];
    writePreviewMap(map);
    return null;
  }

  return product;
}

export function setCompareNavigationState(state: CompareNavigationState | null) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: NavigationStatePayload = {
    state,
    updatedAt: Date.now(),
  };

  try {
    Object.defineProperty(window, NAVIGATION_STATE_KEY, {
      value: payload,
      writable: true,
      configurable: true,
    });
  } catch {
    (window as Record<string, unknown>)[NAVIGATION_STATE_KEY] = payload;
  }

  window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT, { detail: payload }));
}

export function getCompareNavigationState(): CompareNavigationState | null | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const payload = (window as Record<string, unknown>)[NAVIGATION_STATE_KEY] as NavigationStatePayload | undefined;
  if (payload && typeof payload === "object" && "state" in payload) {
    return payload.state ?? null;
  }

  return undefined;
}

export function subscribeToCompareNavigationState(listener: (state: CompareNavigationState | null) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<NavigationStatePayload>;
    if (custom?.detail && typeof custom.detail === "object") {
      listener(custom.detail.state ?? null);
      return;
    }

    const fallbackState = getCompareNavigationState();
    listener(fallbackState ?? null);
  };

  window.addEventListener(NAVIGATION_EVENT, handler);

  return () => {
    window.removeEventListener(NAVIGATION_EVENT, handler);
  };
}

export function prepareCompareNavigation(preview: CompareProductPreview) {
  cacheCompareProduct(preview);
  setCompareNavigationState({ product: preview });
}

function pickFirstString(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

function resolveNumericAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
    if (!sanitized) {
      return null;
    }
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildComparePreviewFromProductSummary(
  product: ProductSummary,
  canonicalId: string,
): CompareProductPreview {
  const image = pickFirstString(
    product.image_url,
    product.image,
    product.bestDeal?.image ?? undefined,
    Array.isArray(product.gallery) ? product.gallery[0] ?? null : null,
  );

  const priceText = pickFirstString(
    product.bestPrice?.formatted ?? undefined,
    product.totalPrice?.formatted ?? undefined,
    product.bestDeal?.price?.formatted ?? undefined,
  );

  const priceValue =
    resolveNumericAmount(product.bestPrice?.amount)
    ?? resolveNumericAmount(product.totalPrice?.amount)
    ?? resolveNumericAmount(product.bestDeal?.price?.amount)
    ?? null;

  const source = pickFirstString(
    product.bestVendor ?? undefined,
    product.bestDeal?.vendor ?? undefined,
    product.bestDeal?.source ?? undefined,
  );

  const rating =
    typeof product.rating === "number" && Number.isFinite(product.rating)
      ? product.rating
      : typeof product.bestDeal?.rating === "number" && Number.isFinite(product.bestDeal.rating)
        ? product.bestDeal.rating
        : null;

  const reviewsCount =
    typeof product.reviewsCount === "number" && Number.isFinite(product.reviewsCount)
      ? product.reviewsCount
      : typeof product.bestDeal?.reviewsCount === "number" && Number.isFinite(product.bestDeal.reviewsCount)
        ? product.bestDeal.reviewsCount
        : null;

  return {
    id: canonicalId,
    title: product.name,
    brand: product.brand ?? null,
    image,
    source,
    priceText,
    priceValue,
    rating,
    reviewsCount,
  };
}
