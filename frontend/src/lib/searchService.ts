export interface CombinedSearchResults {
  products: Array<Record<string, unknown>>;
  gyms: Array<Record<string, unknown>>;
  programmes: Array<Record<string, unknown>>;
}

export type SearchSection = keyof CombinedSearchResults;

export interface SearchItemDisplay {
  title: string;
  subtitle?: string;
  price?: string;
  link?: string;
  details?: string;
}

export interface FetchSearchOptions {
  signal?: AbortSignal;
  limit?: number;
}

const EMPTY_RESULTS: CombinedSearchResults = {
  products: [],
  gyms: [],
  programmes: [],
};

const PROXY_ENDPOINT = "/api/proxy";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function toStringOrNull(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function formatPrice(value: unknown): string | undefined {
  if (!value && value !== 0) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number") {
    return `${value.toFixed(2)} €`;
  }
  if (typeof value === "object" && value !== null) {
    const formatted = toStringOrNull((value as Record<string, unknown>).formatted);
    if (formatted) {
      return formatted;
    }
    const amount = (value as Record<string, unknown>).amount;
    const currency = toStringOrNull((value as Record<string, unknown>).currency);
    if (typeof amount === "number") {
      const amountText = amount.toFixed(2);
      return currency ? `${amountText} ${currency}` : amountText;
    }
    if (typeof amount === "string") {
      const parsed = Number(amount);
      if (!Number.isNaN(parsed)) {
        const amountText = parsed.toFixed(2);
        return currency ? `${amountText} ${currency}` : amountText;
      }
      return amount.trim();
    }
  }
  return undefined;
}

function resolveLink(item: Record<string, unknown>): string | undefined {
  return (
    toStringOrNull(item.link)
    ?? toStringOrNull(item.url)
    ?? toStringOrNull(item.website)
  );
}

export const isSearchResultsEmpty = (results: CombinedSearchResults): boolean =>
  results.products.length === 0 && results.gyms.length === 0 && results.programmes.length === 0;

export function summarizeSearchItem(section: SearchSection, item: Record<string, unknown>): SearchItemDisplay {
  const title =
    toStringOrNull(item.title)
    ?? toStringOrNull(item.name)
    ?? toStringOrNull(item.nom)
    ?? "Résultat";

  let subtitle: string | undefined;
  let details: string | undefined;
  let price: string | undefined;

  switch (section) {
    case "products": {
      const vendor = toStringOrNull(item.vendor) ?? toStringOrNull(item.brand);
      const brand = toStringOrNull(item.brand);
      const source = toStringOrNull(item.source);
      if (vendor && brand && vendor !== brand) {
        subtitle = `${vendor} • ${brand}`;
      } else {
        subtitle = vendor ?? brand ?? source ?? undefined;
      }
      price =
        formatPrice(item.totalPrice)
        ?? formatPrice(item.price)
        ?? formatPrice(item.bestPrice);
      break;
    }
    case "gyms": {
      const brand = toStringOrNull(item.brand);
      const city = toStringOrNull(item.city);
      subtitle = brand && city ? `${brand} • ${city}` : brand ?? city ?? undefined;
      price = formatPrice(item.monthly_price) ?? formatPrice(item.price);
      details = toStringOrNull(item.address) ?? toStringOrNull(item.estimated_duration);
      break;
    }
    case "programmes": {
      const focus = toStringOrNull(item.focus);
      const level = toStringOrNull(item.level) ?? toStringOrNull(item.niveau);
      const coach = toStringOrNull(item.coach);
      if (focus && level) {
        subtitle = `${focus} • ${level}`;
      } else {
        subtitle = focus ?? level ?? coach ?? undefined;
      }
      if (!subtitle && coach) {
        details = coach;
      } else if (focus && coach && subtitle !== coach) {
        details = coach;
      }
      price = formatPrice(item.price);
      break;
    }
    default:
      break;
  }

  return {
    title,
    subtitle,
    price,
    link: resolveLink(item),
    details,
  };
}

async function safeFetchJson<T>(
  input: string,
  init: RequestInit,
  { signal }: FetchSearchOptions,
): Promise<T> {
  const response = await fetch(input, { ...init, signal });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCombinedSearchResults(
  query: string,
  options: FetchSearchOptions = {},
): Promise<CombinedSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return EMPTY_RESULTS;
  }

  const { signal, limit = 6 } = options;
  const compareParams = new URLSearchParams({
    target: "compare",
    q: trimmed,
    limit: String(limit),
  });

  const searchParams = new URLSearchParams({
    target: "search",
    q: trimmed,
    limit: String(Math.max(limit, 10)),
  });

  let compareError: unknown = null;
  let searchError: unknown = null;

  const comparePromise = safeFetchJson<Array<Record<string, unknown>>>(
    `${PROXY_ENDPOINT}?${compareParams.toString()}`,
    { cache: "no-store" },
    { signal },
  ).catch((error) => {
    if (isAbortError(error)) {
      throw error;
    }
    compareError = error;
    return [];
  });

  const searchPromise = safeFetchJson<Record<string, unknown>>(
    `${PROXY_ENDPOINT}?${searchParams.toString()}`,
    { cache: "no-store" },
    { signal },
  ).catch((error) => {
    if (isAbortError(error)) {
      throw error;
    }
    searchError = error;
    return {} as Record<string, unknown>;
  });

  const [comparePayload, searchPayload] = await Promise.all([comparePromise, searchPromise]);

  const productsFromCompare = Array.isArray(comparePayload) ? comparePayload : [];
  const supportingProducts = Array.isArray((searchPayload as Record<string, unknown>).products)
    ? ((searchPayload as { products: Array<Record<string, unknown>> }).products)
    : [];
  const gyms = Array.isArray((searchPayload as Record<string, unknown>).gyms)
    ? ((searchPayload as { gyms: Array<Record<string, unknown>> }).gyms)
    : [];
  const programmes = Array.isArray((searchPayload as Record<string, unknown>).programmes)
    ? ((searchPayload as { programmes: Array<Record<string, unknown>> }).programmes)
    : [];

  const combinedProducts = [...productsFromCompare];
  for (const item of supportingProducts) {
    if (item && typeof item === "object") {
      combinedProducts.push(item);
    }
  }

  if (compareError && searchError) {
    throw (compareError instanceof Error ? compareError : new Error("Recherche indisponible"));
  }

  return {
    products: combinedProducts,
    gyms,
    programmes,
  };
}

export { EMPTY_RESULTS as EMPTY_SEARCH_RESULTS };
