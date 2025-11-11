import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import apiClient, { ApiError } from "@/lib/apiClient";
import {
  fetchAmazon,
  fetchDecathlon,
  fetchSerpApi,
  mergeAndCleanResults,
  scrapeMyProtein,
} from "@/lib/productAggregator.js";

type AggregatedProduct = {
  id?: string;
  name?: string;
  price?: number | null;
  old_price?: number | null;
  image?: string | null;
  brand?: string | null;
  vendor?: string | null;
  url?: string | null;
  rating?: number | null;
  description?: string | null;
};

export type NormalizedOffer = {
  seller: string;
  price: number | null;
  old_price: number | null;
  url: string | null;
  shipping: string | null;
  delivery_time: string | null;
  rating: number | null;
  logo: string | null;
  source: string | null;
};

export type CompareResponse = {
  id: string;
  name: string;
  image: string | null;
  brand: string | null;
  description: string | null;
  rating: number | null;
  base_price: number | null;
  offers: NormalizedOffer[];
  price_history: Array<{ date: string; price: number }>;
};

type CompareCacheEntry = {
  expiresAt: number;
  payload: CompareResponse;
};

const CACHE_TTL_MS = 1000 * 60 * 15;
const compareCache = new Map<string, CompareCacheEntry>();
const SERP_VENDOR_LIMIT = 12;
const CDISCOUNT_KEYWORDS = ["cdiscount", "c-discount"];
const KNOWN_VENDOR_LOGOS: Record<string, string> = {
  amazon: "https://logo.clearbit.com/amazon.fr",
  decathlon: "https://logo.clearbit.com/decathlon.fr",
  myprotein: "https://logo.clearbit.com/myprotein.com",
  cdiscount: "https://logo.clearbit.com/cdiscount.com",
  "google shopping": "https://logo.clearbit.com/google.com",
};

function normalizeText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
    if (!cleaned) {
      return null;
    }
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function resolveVendorLogo(vendor: string | null | undefined): string | null {
  if (!vendor) {
    return null;
  }

  const normalized = vendor.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const direct = KNOWN_VENDOR_LOGOS[normalized];
  if (direct) {
    return direct;
  }

  const match = Object.entries(KNOWN_VENDOR_LOGOS).find(([key]) => normalized.includes(key));
  return match ? match[1] : null;
}

function stripVendorPrefix(id: string | null | undefined): string | null {
  if (!id) {
    return null;
  }
  const normalized = id.trim();
  if (!normalized) {
    return null;
  }
  const separatorIndex = normalized.indexOf(":");
  if (separatorIndex === -1) {
    return normalized.toLowerCase();
  }
  return normalized.slice(separatorIndex + 1).toLowerCase();
}

function normalizeQuery(id: string): string {
  const cleaned = id
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : id;
}

function asAggregatedProduct(entry: unknown): AggregatedProduct | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  return entry as AggregatedProduct;
}

function toNormalizedOffer(entry: AggregatedProduct): NormalizedOffer | null {
  const seller = normalizeText(entry.vendor)
    || normalizeText(entry.brand)
    || normalizeText(entry.name)
    || "Marchand";

  const price = normalizeNumber(entry.price ?? null);
  const oldPrice = normalizeNumber(entry.old_price ?? null);
  const url = normalizeText(entry.url);
  const rating = normalizeNumber(entry.rating);

  return {
    seller,
    price,
    old_price: oldPrice,
    url,
    shipping: null,
    delivery_time: null,
    rating,
    logo: resolveVendorLogo(entry.vendor ?? entry.brand ?? seller),
    source: normalizeText(entry.vendor) ?? null,
  };
}

function dedupeOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
  const seen = new Map<string, NormalizedOffer>();

  for (const offer of offers) {
    const keyParts = [offer.seller.toLowerCase()];
    if (offer.url) {
      keyParts.push(offer.url);
    }
    const key = keyParts.join("::");

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, offer);
      continue;
    }

    if (
      (offer.price ?? Number.POSITIVE_INFINITY)
      < (existing.price ?? Number.POSITIVE_INFINITY)
    ) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const priceA = a.price ?? Number.POSITIVE_INFINITY;
    const priceB = b.price ?? Number.POSITIVE_INFINITY;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    return a.seller.localeCompare(b.seller, "fr", { sensitivity: "base" });
  });
}

function pickBestProductMatch(products: AggregatedProduct[], productId: string, query: string): AggregatedProduct | null {
  const normalizedId = productId.trim().toLowerCase();
  const strippedId = stripVendorPrefix(productId);

  for (const product of products) {
    const candidateId = normalizeText(product.id)?.toLowerCase();
    if (!candidateId) {
      continue;
    }
    if (candidateId === normalizedId || (strippedId && candidateId === strippedId)) {
      return product;
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery) {
    const matchByName = products.find((product) => {
      const name = normalizeText(product.name)?.toLowerCase();
      if (!name) {
        return false;
      }
      return name.includes(normalizedQuery);
    });
    if (matchByName) {
      return matchByName;
    }
  }

  return products[0] ?? null;
}

function computeBasePrice(offers: NormalizedOffer[], product: AggregatedProduct | null): number | null {
  const candidatePrices = offers
    .map((offer) => offer.price)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price));

  if (candidatePrices.length > 0) {
    return Math.min(...candidatePrices);
  }

  const productPrice = normalizeNumber(product?.price ?? null);
  return productPrice ?? null;
}

function toDateString(date: Date): string {
  return date.toISOString();
}

function generateSyntheticHistory(price: number | null): Array<{ date: string; price: number }> {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return [];
  }

  const history: Array<{ date: string; price: number }> = [];
  const baseDate = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const snapshot = new Date(baseDate);
    snapshot.setDate(baseDate.getDate() - index * 5);
    const variation = (Math.sin(index) * 0.05 + Math.random() * 0.02 - 0.01) * price;
    const computed = Math.max(price * (1 + variation / price), price * 0.85);
    history.push({ date: toDateString(snapshot), price: Number.parseFloat(computed.toFixed(2)) });
  }

  return history;
}

async function fetchPriceHistory(productId: string): Promise<Array<{ date: string; price: number }>> {
  try {
    const encodedId = encodeURIComponent(productId);
    const data = await apiClient.get<{ history?: Array<Record<string, unknown>> }>(
      `/api/prices/history/${encodedId}`,
      {
        cache: "no-store",
        allowProxyFallback: false,
        query: { period: "90d" },
      },
    );

    const historyEntries = Array.isArray(data?.history) ? data.history : [];
    const normalized = historyEntries
      .map((entry) => {
        const date = normalizeText(entry?.date);
        const price = normalizeNumber(entry?.price);
        if (!date || price === null) {
          return null;
        }
        return { date, price };
      })
      .filter((entry): entry is { date: string; price: number } => Boolean(entry));

    if (normalized.length > 0) {
      normalized.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return normalized;
    }
  } catch {
    // Swallow errors silently and use fallback below.
  }

  return [];
}

async function fetchVendorProducts(query: string): Promise<AggregatedProduct[]> {
  if (!query) {
    return [];
  }

  const [decathlon, amazon, myProtein] = await Promise.all([
    fetchDecathlon(query).catch(() => []),
    fetchAmazon(query).catch(() => []),
    scrapeMyProtein(query).catch(() => []),
  ]);

  const primary = [...decathlon, ...amazon, ...myProtein]
    .map(asAggregatedProduct)
    .filter((product): product is AggregatedProduct => Boolean(product));

  return primary;
}

async function fetchSerpOffers(query: string): Promise<AggregatedProduct[]> {
  if (!query) {
    return [];
  }

  const serp = await fetchSerpApi(query, { limit: SERP_VENDOR_LIMIT }).catch(() => []);
  return serp.map(asAggregatedProduct).filter((product): product is AggregatedProduct => Boolean(product));
}

function extractCdiscountOffers(products: AggregatedProduct[]): AggregatedProduct[] {
  return products.filter((product) => {
    const vendor = normalizeText(product.vendor)?.toLowerCase() ?? "";
    return CDISCOUNT_KEYWORDS.some((keyword) => vendor.includes(keyword));
  });
}

function buildComparePayload(
  productId: string,
  query: string,
  combinedProducts: AggregatedProduct[],
  serpProducts: AggregatedProduct[],
  priceHistory: Array<{ date: string; price: number }>,
): CompareResponse {
  const merged = mergeAndCleanResults([...combinedProducts, ...serpProducts]) as AggregatedProduct[];
  const candidateProducts = merged.length > 0 ? merged : [...combinedProducts, ...serpProducts];
  const bestProduct = pickBestProductMatch(candidateProducts, productId, query);

  const offers = dedupeOffers(
    [
      ...combinedProducts,
      ...serpProducts,
      ...extractCdiscountOffers(serpProducts),
    ]
      .map(toNormalizedOffer)
      .filter((offer): offer is NormalizedOffer => Boolean(offer)),
  );

  const basePrice = computeBasePrice(offers, bestProduct);
  const history = priceHistory.length > 0 ? priceHistory : generateSyntheticHistory(basePrice);

  const normalizedName = normalizeText(bestProduct?.name)
    ?? normalizeText(query)
    ?? normalizeText(productId)
    ?? "Produit";

  return {
    id: normalizeText(bestProduct?.id) ?? productId,
    name: normalizedName,
    image: normalizeText(bestProduct?.image),
    brand: normalizeText(bestProduct?.brand),
    description: normalizeText(bestProduct?.description),
    rating: normalizeNumber(bestProduct?.rating),
    base_price: basePrice,
    offers,
    price_history: history,
  };
}

export async function handleCompareDetailRequest(
  url: URL,
): Promise<NextResponse> {
  const rawId = url.searchParams.get("id")?.trim();
  if (!rawId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const cached = compareCache.get(rawId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  const queryParam = url.searchParams.get("q")?.trim();
  const query = queryParam && queryParam.length > 0 ? queryParam : normalizeQuery(rawId);

  const [vendorProducts, serpProducts, history] = await Promise.all([
    fetchVendorProducts(query),
    fetchSerpOffers(query),
    fetchPriceHistory(rawId),
  ]);

  const payload = buildComparePayload(rawId, query, vendorProducts, serpProducts, history);

  compareCache.set(rawId, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return NextResponse.json(payload);
}

type RawGym = Record<string, unknown>;

async function loadLocalGymsFallback(): Promise<RawGym[] | null> {
  const baseDir = process.cwd();
  const candidatePaths = [
    path.join(baseDir, "data", "gyms-fallback.json"),
    path.join(baseDir, "data", "gyms_fallback.json"),
    path.join(baseDir, "src", "data", "gyms-fallback.json"),
    path.join(baseDir, "src", "data", "gyms_fallback.json"),
    path.join(baseDir, "..", "data", "gyms-fallback.json"),
    path.join(baseDir, "..", "data", "gyms_fallback.json"),
  ];

  for (const candidate of candidatePaths) {
    try {
      const contents = await fs.readFile(candidate, "utf-8");
      const parsed = JSON.parse(contents) as unknown;
      const gyms = flattenGyms(parsed);
      if (gyms.length > 0) {
        return gyms;
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code === "ENOENT") {
        continue;
      }
    }
  }

  return null;
}

function flattenGyms(input: unknown): RawGym[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is RawGym => Boolean(item) && typeof item === "object");
  }

  if (input && typeof input === "object") {
    const values = Object.values(input as Record<string, unknown>);
    const aggregated: RawGym[] = [];
    for (const value of values) {
      if (Array.isArray(value)) {
        aggregated.push(...value.filter((item): item is RawGym => Boolean(item) && typeof item === "object"));
      }
    }
    return aggregated;
  }

  return [];
}

function buildQuery(searchParams: URLSearchParams) {
  const forwarded = new URLSearchParams(searchParams);
  forwarded.delete("target");
  return forwarded.size > 0 ? forwarded : undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawTarget = url.searchParams.get("target")?.trim();

  if (!rawTarget) {
    return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
  }

  if (/^https?:\/\//i.test(rawTarget) || rawTarget.startsWith("//")) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const target = rawTarget.replace(/^\/+/, "");
  if (!target || target.startsWith("..")) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  if (target === "compare" && url.searchParams.has("id")) {
    return handleCompareDetailRequest(url);
  }

  try {
    const data = await apiClient.get(`/${target}`, {
      query: buildQuery(url.searchParams),
      headers: {
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? undefined,
      },
      cache: "no-store",
      allowProxyFallback: false,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status ?? 502;

      if (status === 404 && target === "gyms") {
        const fallbackGyms = await loadLocalGymsFallback();
        if (fallbackGyms) {
          return NextResponse.json(fallbackGyms);
        }
      }

      if (error.body) {
        try {
          const parsed = JSON.parse(error.body);
          return NextResponse.json(parsed, { status });
        } catch {
          return NextResponse.json({ error: error.body }, { status });
        }
      }

      return NextResponse.json({ error: error.message }, { status });
    }

    const message =
      error instanceof Error ? error.message : "Unable to proxy request";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
