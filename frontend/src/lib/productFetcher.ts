const SERP_API_ENDPOINT = "https://serpapi.com/search.json";
const SCRAPER_TARGETS = [
  {
    label: "Amazon",
    hostname: "amazon.fr",
    buildUrl: (query: string) => `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`,
  },
  {
    label: "Cdiscount",
    hostname: "cdiscount.com",
    buildUrl: (query: string) => `https://www.cdiscount.com/search/10/${encodeURIComponent(query)}.html`,
  },
  {
    label: "Decathlon",
    hostname: "decathlon.fr",
    buildUrl: (query: string) => `https://www.decathlon.fr/search?Ntt=${encodeURIComponent(query)}`,
  },
];

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const FALLBACK_IMAGE = "/placeholder.png";
const DEFAULT_HISTORY_POINTS = 8;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export type ProductPriceSummary = {
  min: number | null;
  max: number | null;
  avg: number | null;
};

export type ProductHistoryEntry = {
  date: string;
  price: number;
};

export type ProductOffer = {
  title: string;
  seller: string;
  price: number | null;
  priceText: string | null;
  link: string | null;
  source: string | null;
  thumbnail: string | null;
  rating: number | null;
};

export type ProductData = {
  name: string;
  image: string;
  brand: string | null;
  description: string | null;
  rating: number | null;
  price: ProductPriceSummary;
  offers: ProductOffer[];
  history: ProductHistoryEntry[];
};

type SerpProductInfo = {
  name: string | null;
  brand: string | null;
  description: string | null;
  image: string | null;
};

type SerpShoppingResult = Record<string, unknown> & {
  title?: string;
  source?: string;
  store?: string;
  price?: string;
  extracted_price?: number;
  link?: string;
  product_link?: string;
  thumbnail?: string;
  rating?: number;
};

type SerpProductResult = Record<string, unknown> | null;

function pickString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const rawString = pickString(value);
  if (!rawString) {
    return null;
  }

  const sanitized = rawString.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
  if (!sanitized) {
    return null;
  }

  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(amount: number | null): string | null {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return null;
  }
  return priceFormatter.format(amount);
}

function normalizeUrl(value: unknown): string | null {
  const candidate = pickString(value);
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    return url.toString();
  } catch {
    return candidate.startsWith("/") ? candidate : `https://${candidate}`;
  }
}

function normalizeImage(value: unknown): string | null {
  const candidate = pickString(value);
  if (!candidate) {
    return null;
  }
  if (candidate.startsWith("data:")) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    return url.toString();
  } catch {
    return candidate;
  }
}

function extractSerpProductImage(result: SerpProductResult): string | null {
  if (!result) {
    return null;
  }

  const direct = normalizeImage((result as { thumbnail?: string }).thumbnail ?? null);
  if (direct) {
    return direct;
  }

  const images = (result as { images?: Array<Record<string, unknown>> }).images;
  if (Array.isArray(images)) {
    for (const entry of images) {
      const fromThumbnail = normalizeImage((entry as { thumbnail?: string }).thumbnail ?? null);
      if (fromThumbnail) {
        return fromThumbnail;
      }
      const fromLink = normalizeImage((entry as { link?: string }).link ?? null);
      if (fromLink) {
        return fromLink;
      }
    }
  }

  return null;
}

function dedupeOffers(offers: ProductOffer[]): ProductOffer[] {
  const seen = new Set<string>();
  const result: ProductOffer[] = [];

  for (const offer of offers) {
    const key = `${offer.seller.toLowerCase()}|${offer.link ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(offer);
  }

  return result;
}

function mapShoppingResult(result: SerpShoppingResult, fallbackTitle: string): ProductOffer {
  const seller = pickString(result.source) ?? pickString(result.store) ?? "Boutique";
  const title = pickString(result.title) ?? fallbackTitle;
  const price =
    typeof result.extracted_price === "number" && Number.isFinite(result.extracted_price)
      ? result.extracted_price
      : parsePrice(result.price);

  return {
    title,
    seller,
    price,
    priceText: pickString(result.price) ?? formatPrice(price),
    link: normalizeUrl(result.product_link ?? result.link ?? null),
    source: seller,
    thumbnail: normalizeImage(result.thumbnail ?? null),
    rating:
      typeof result.rating === "number" && Number.isFinite(result.rating)
        ? result.rating
        : null,
  } satisfies ProductOffer;
}

async function fetchSerpApiProduct(query: string): Promise<{ info: SerpProductInfo; offers: ProductOffer[] }> {
  const apiKey = process.env.SERPAPI_KEY ?? process.env.NEXT_PUBLIC_SERPAPI_KEY;
  if (!apiKey) {
    return { info: { name: null, brand: null, description: null, image: null }, offers: [] };
  }

  try {
    const url = new URL(SERP_API_ENDPOINT);
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("gl", "fr");
    url.searchParams.set("hl", "fr");
    url.searchParams.set("num", "24");
    url.searchParams.set("api_key", apiKey);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("productFetcher.serp", { status: response.status });
      return { info: { name: null, brand: null, description: null, image: null }, offers: [] };
    }

    const payload = await response.json();
    const shoppingResults: SerpShoppingResult[] = Array.isArray(payload?.shopping_results)
      ? payload.shopping_results
      : [];

    const offers = shoppingResults.map((entry) => mapShoppingResult(entry, query));

    const productResult = (payload?.product_results ?? null) as SerpProductResult;
    const firstResult = shoppingResults[0] ?? null;

    const info: SerpProductInfo = {
      name: pickString(productResult?.title) ?? pickString(firstResult?.title) ?? null,
      brand:
        pickString(productResult?.brand)
        ?? pickString(productResult?.manufacturer)
        ?? pickString(firstResult?.source)
        ?? null,
      description:
        pickString(productResult?.description)
        ?? pickString(payload?.organic_results?.[0]?.snippet)
        ?? null,
      image:
        extractSerpProductImage(productResult)
        ?? normalizeImage(firstResult?.thumbnail)
        ?? null,
    };

    return { info, offers };
  } catch (error) {
    console.error("productFetcher.serp:error", error);
    return { info: { name: null, brand: null, description: null, image: null }, offers: [] };
  }
}

function extractPriceFromHtml(html: string): number | null {
  const match = html.match(/(\d{1,4}(?:[.,]\d{2}))\s?€/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseFloat(match[1].replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchScraperApiOffers(query: string): Promise<ProductOffer[]> {
  const apiKey = process.env.SCRAPERAPI_KEY ?? process.env.NEXT_PUBLIC_SCRAPERAPI_KEY;
  if (!apiKey) {
    return [];
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const offers: ProductOffer[] = [];

  await Promise.all(
    SCRAPER_TARGETS.map(async (target) => {
      try {
        const targetUrl = target.buildUrl(trimmed);
        const scraperUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(scraperUrl, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const html = await response.text();
        const price = extractPriceFromHtml(html);
        if (price === null) {
          return;
        }

        const thumbnail = `https://logo.clearbit.com/${target.hostname}`;
        offers.push({
          title: `${target.label} · ${trimmed}`,
          seller: target.label,
          price,
          priceText: formatPrice(price),
          link: targetUrl,
          source: target.label,
          thumbnail,
          rating: null,
        });
      } catch (error) {
        console.warn("productFetcher.scraper", error);
      }
    }),
  );

  return offers;
}

function computePriceSummary(offers: ProductOffer[]): ProductPriceSummary {
  const prices = offers
    .map((offer) => offer.price)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (prices.length === 0) {
    return { min: null, max: null, avg: null };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Number.parseFloat((prices.reduce((sum, value) => sum + value, 0) / prices.length).toFixed(2));

  return { min, max, avg };
}

function buildPriceHistory(summary: ProductPriceSummary, offers: ProductOffer[]): ProductHistoryEntry[] {
  const referencePrice =
    summary.avg
    ?? summary.min
    ?? summary.max
    ?? offers.find((offer) => typeof offer.price === "number" && Number.isFinite(offer.price))?.price
    ?? 49.9;

  return Array.from({ length: DEFAULT_HISTORY_POINTS }).map((_, index) => {
    const offset = DEFAULT_HISTORY_POINTS - index;
    const variation = Math.sin(index * 1.2) * 0.05 * referencePrice;
    const price = Number.parseFloat((referencePrice + variation).toFixed(2));
    const date = new Date(Date.now() - offset * WEEK_IN_MS).toISOString();

    return { date, price } satisfies ProductHistoryEntry;
  });
}

function ensureDescription(description: string | null, fallbackName: string): string {
  if (description) {
    return description;
  }
  return `Historique des offres pour « ${fallbackName} ».`;
}

function ensureImage(image: string | null, fallback: string | null): string {
  const normalized = normalizeImage(image) ?? normalizeImage(fallback) ?? FALLBACK_IMAGE;
  return normalized;
}

export async function getProductData(
  query: string,
  options: { image?: string | null; brand?: string | null; description?: string | null } = {},
): Promise<ProductData> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("Missing product query");
  }

  const [serpPayload, scraperOffers] = await Promise.all([
    fetchSerpApiProduct(normalizedQuery),
    fetchScraperApiOffers(normalizedQuery).catch(() => []),
  ]);

  const serpOffers = serpPayload.offers;
  const combinedOffers = dedupeOffers([...serpOffers, ...scraperOffers]);

  if (combinedOffers.length === 0) {
    combinedOffers.push({
      title: normalizedQuery,
      seller: "FitIdion",
      price: null,
      priceText: null,
      link: null,
      source: "FitIdion",
      thumbnail: null,
      rating: null,
    });
  }

  combinedOffers.sort((a, b) => {
    const priceA = typeof a.price === "number" && Number.isFinite(a.price) ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" && Number.isFinite(b.price) ? b.price : Number.POSITIVE_INFINITY;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    return a.seller.localeCompare(b.seller, "fr", { sensitivity: "base" });
  });

  const price = computePriceSummary(combinedOffers);
  const history = buildPriceHistory(price, combinedOffers);
  const displayName = serpPayload.info.name ?? normalizedQuery;
  const brand = options.brand?.trim() || serpPayload.info.brand || null;
  const description = ensureDescription(options.description ?? serpPayload.info.description ?? null, displayName);
  const image = ensureImage(serpPayload.info.image, options.image ?? null);
  const rating = combinedOffers.find((offer) => typeof offer.rating === "number" && Number.isFinite(offer.rating))?.rating ?? null;

  return {
    name: displayName,
    image,
    brand,
    description,
    rating,
    price,
    offers: combinedOffers,
    history,
  };
}
