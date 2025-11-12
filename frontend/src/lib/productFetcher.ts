import { fetchSerpApi } from "@/lib/productAggregator.js";

export type ProductPriceSummary = {
  min: number | null;
  max: number | null;
  avg: number | null;
};

export type ProductHistoryEntry = {
  date: string;
  price: number | null;
};

export type ProductOffer = {
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

export type ProductData = {
  id: string;
  name: string;
  image: string | null;
  brand: string | null;
  description: string | null;
  rating: number | null;
  price: ProductPriceSummary;
  offers: ProductOffer[];
  history: ProductHistoryEntry[];
};

type RawSerpProduct = Record<string, unknown>;

type NormalizedSerpProduct = {
  id: string | null;
  name: string | null;
  price: number | null;
  old_price: number | null;
  image: string | null;
  brand: string | null;
  vendor: string | null;
  url: string | null;
  rating: number | null;
  description: string | null;
};

function toNumber(value: unknown): number | null {
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

function toString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeSerpProduct(entry: unknown): NormalizedSerpProduct | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const raw = entry as RawSerpProduct;

  const id = toString(raw.id)
    || toString(raw.product_id)
    || toString(raw.productId)
    || toString(raw.position)
    || null;

  const name = toString(raw.name) || toString(raw.title) || null;
  const vendor = toString(raw.vendor)
    || toString(raw.store)
    || toString(raw.source)
    || toString(raw.merchant)
    || null;
  const brand = toString(raw.brand) || null;
  const image = toString(raw.image)
    || toString(raw.thumbnail)
    || toString(raw.image_url)
    || null;
  const description = toString(raw.description)
    || toString(raw.snippet)
    || toString(raw.summary)
    || null;
  const url = toString(raw.url) || toString(raw.link) || null;
  const price = toNumber(raw.price) ?? toNumber(raw.extracted_price);
  const oldPrice = toNumber(raw.old_price)
    ?? toNumber(raw.compare_at_price)
    ?? toNumber(raw.previous_price)
    ?? null;
  const rating = toNumber(raw.rating);

  return {
    id,
    name,
    price,
    old_price: oldPrice,
    image,
    brand,
    vendor,
    url,
    rating,
    description,
  };
}

function dedupeOffers(offers: ProductOffer[]): ProductOffer[] {
  const seen = new Map<string, ProductOffer>();

  for (const offer of offers) {
    const keyParts = [offer.seller.trim().toLowerCase()];
    if (offer.url) {
      keyParts.push(offer.url);
    }
    const key = keyParts.join("::");

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, offer);
      continue;
    }

    const existingPrice = typeof existing.price === "number"
      ? existing.price
      : Number.POSITIVE_INFINITY;
    const nextPrice = typeof offer.price === "number" ? offer.price : Number.POSITIVE_INFINITY;

    if (nextPrice < existingPrice) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const priceA = typeof a.price === "number" ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" ? b.price : Number.POSITIVE_INFINITY;

    if (priceA !== priceB) {
      return priceA - priceB;
    }

    const ratingA = typeof a.rating === "number" ? a.rating : -1;
    const ratingB = typeof b.rating === "number" ? b.rating : -1;
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }

    return a.seller.localeCompare(b.seller, "fr", { sensitivity: "base" });
  });
}

function roundCurrency(value: number): number {
  return Number.parseFloat(value.toFixed(2));
}

function computePriceStats(offers: ProductOffer[], fallbackPrice: number | null): ProductPriceSummary {
  const values: number[] = [];

  for (const offer of offers) {
    if (typeof offer.price === "number" && Number.isFinite(offer.price)) {
      values.push(offer.price);
    }
  }

  if (typeof fallbackPrice === "number" && Number.isFinite(fallbackPrice)) {
    values.push(fallbackPrice);
  }

  if (values.length === 0) {
    return { min: null, max: null, avg: null };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const total = values.reduce((sum, price) => sum + price, 0);
  const avg = total / values.length;

  return { min: roundCurrency(min), max: roundCurrency(max), avg: roundCurrency(avg) };
}

function deriveSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

function simulateBasePrice(seed: number): number {
  const normalized = (seed % 2500) / 100; // 0 -> 24.99
  const price = 24.5 + normalized;
  return roundCurrency(price);
}

function buildSyntheticHistory(basePrice: number, seed: number): ProductHistoryEntry[] {
  if (typeof basePrice !== "number" || !Number.isFinite(basePrice) || basePrice <= 0) {
    return [];
  }

  const entries: ProductHistoryEntry[] = [];
  const now = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const snapshot = new Date(now);
    snapshot.setDate(now.getDate() - index * 5);
    const variation = Math.sin(seed + index) * 0.07 + ((seed % 11) - 5) / 120;
    const computed = Math.max(basePrice * (1 + variation), basePrice * 0.82);
    entries.push({ date: snapshot.toISOString(), price: roundCurrency(computed) });
  }

  return entries;
}

function pickBestProduct(products: NormalizedSerpProduct[], query: string): NormalizedSerpProduct | null {
  if (products.length === 0) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery) {
    const exact = products.find((product) => product.name?.toLowerCase() === normalizedQuery);
    if (exact) {
      return exact;
    }

    const includes = products.find((product) => product.name?.toLowerCase().includes(normalizedQuery));
    if (includes) {
      return includes;
    }
  }

  const withPrice = products.find((product) => typeof product.price === "number");
  if (withPrice) {
    return withPrice;
  }

  return products[0];
}

function toOffer(product: NormalizedSerpProduct): ProductOffer {
  const seller = product.vendor
    || product.brand
    || product.name
    || "Marchand";

  return {
    seller,
    price: typeof product.price === "number" && Number.isFinite(product.price)
      ? roundCurrency(product.price)
      : null,
    old_price: typeof product.old_price === "number" && Number.isFinite(product.old_price)
      ? roundCurrency(product.old_price)
      : null,
    url: product.url ?? null,
    shipping: null,
    delivery_time: null,
    rating: typeof product.rating === "number" && Number.isFinite(product.rating)
      ? roundCurrency(product.rating)
      : null,
    logo: null,
    source: product.vendor ?? "Google Shopping",
  };
}

function ensureOffers(offers: ProductOffer[], query: string, seed: number): ProductOffer[] {
  if (offers.length > 0) {
    return offers;
  }

  const simulatedPrice = simulateBasePrice(seed);
  const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;

  return [
    {
      seller: "Boutique partenaire",
      price: simulatedPrice,
      old_price: roundCurrency(simulatedPrice * 1.08),
      url,
      shipping: null,
      delivery_time: null,
      rating: null,
      logo: null,
      source: "Simulation",
    },
  ];
}

function normalizeDescription(description: string | null, query: string): string | null {
  if (description) {
    return description;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return "Comparaison générée automatiquement.";
  }

  return `Analyse des offres en ligne pour \"${trimmed}\".`;
}

function normalizeId(id: string | null, fallback: string): string {
  const normalized = id?.trim();
  if (normalized) {
    return normalized;
  }

  return fallback
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    || "produit";
}

function normalizeName(name: string | null, query: string): string {
  const normalized = name?.trim();
  if (normalized) {
    return normalized;
  }

  const trimmed = query.trim();
  return trimmed.length > 0 ? trimmed : "Produit";
}

export async function getProductData(
  queryOrId: string,
  options: { query?: string } = {},
): Promise<ProductData> {
  const identifier = queryOrId.trim();
  if (!identifier) {
    return {
      id: "produit",
      name: "Produit",
      image: null,
      brand: null,
      description: "Comparaison générée automatiquement.",
      rating: null,
      price: { min: null, max: null, avg: null },
      offers: [],
      history: [],
    };
  }

  const query = options.query?.trim() && options.query.trim().length > 0
    ? options.query.trim()
    : identifier;

  let serpResults: NormalizedSerpProduct[] = [];
  try {
    const rawResults = await fetchSerpApi(query, { limit: 16 });
    serpResults = rawResults
      .map(normalizeSerpProduct)
      .filter((product): product is NormalizedSerpProduct => Boolean(product));
  } catch (error) {
    console.error("productFetcher.serp", error);
  }

  const seed = deriveSeed(identifier + query);
  const bestProduct = pickBestProduct(serpResults, query);

  const offers = ensureOffers(
    dedupeOffers(serpResults.map(toOffer).filter((offer) => Boolean(offer.seller))),
    query,
    seed,
  );

  const referencePrice = bestProduct?.price ?? offers[0]?.price ?? null;
  let priceStats = computePriceStats(offers, referencePrice);

  if (priceStats.min === null && priceStats.max === null && priceStats.avg === null) {
    const simulated = simulateBasePrice(seed);
    priceStats = {
      min: roundCurrency(simulated * 0.95),
      max: roundCurrency(simulated * 1.08),
      avg: simulated,
    };
  }

  const baseForHistory = priceStats.avg
    ?? priceStats.min
    ?? priceStats.max
    ?? simulateBasePrice(seed);

  const history = buildSyntheticHistory(baseForHistory, seed);

  return {
    id: normalizeId(bestProduct?.id ?? null, identifier),
    name: normalizeName(bestProduct?.name ?? null, query),
    image: bestProduct?.image ?? null,
    brand: bestProduct?.brand ?? bestProduct?.vendor ?? null,
    description: normalizeDescription(bestProduct?.description ?? null, query),
    rating: typeof bestProduct?.rating === "number" && Number.isFinite(bestProduct.rating)
      ? roundCurrency(bestProduct.rating)
      : null,
    price: priceStats,
    offers,
    history,
  };
}
