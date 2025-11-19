import apiClient from "./apiClient";

const DEFAULT_LIMIT = 24;
const DECATHLON_ENDPOINT =
  process.env.DECATHLON_SEARCH_URL
  || process.env.NEXT_PUBLIC_DECATHLON_SEARCH_URL
  || null;
const AMAZON_ENDPOINT =
  process.env.AMAZON_SEARCH_URL
  || process.env.NEXT_PUBLIC_AMAZON_SEARCH_URL
  || null;
const MYPROTEIN_ENDPOINT =
  process.env.MYPROTEIN_SEARCH_URL
  || process.env.NEXT_PUBLIC_MYPROTEIN_SEARCH_URL
  || null;
const SERP_ENDPOINT = "https://serpapi.com/search.json";
const BACKEND_VENDOR_KEYWORDS = {
  decathlon: ["decathlon"],
  amazon: ["amazon"],
  myprotein: ["myprotein"],
};
const backendProductsCache = new Map();
const backendFetchPromises = new Map();

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const DEFAULT_CATEGORY_LIMIT = 3;
const CLOTHING_KEYWORDS = [
  "short",
  "shorts",
  "t-shirt",
  "tshirt",
  "tee",
  "hoodie",
  "legging",
  "leggings",
  "jogging",
  "jogger",
  "sweatshirt",
  "brassière",
  "brassiere",
  "tank",
  "crop",
];

function toNumber(value) {
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

function pickString(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return null;
}

function pickFromRecord(record, keys) {
  for (const key of keys) {
    if (key in record) {
      const value = record[key];
      const asString = pickString(value);
      if (asString) {
        return asString;
      }
      const asNumber = toNumber(value);
      if (asNumber !== null) {
        return asNumber;
      }
    }
  }
  return null;
}

function normalisePrice(value) {
  const amount = toNumber(value);
  if (amount === null) {
    return null;
  }
  return amount;
}

function cleanProductName(value) {
  if (typeof value !== "string") {
    return "Produit";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function buildApiPriceObject(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return { amount: null, currency: "EUR", formatted: null };
  }

  return {
    amount,
    currency: "EUR",
    formatted: priceFormatter.format(amount),
  };
}

function toDealItem(product, { sourceLabel, forcedType } = {}) {
  const safeName = cleanProductName(product.name || product.title || product.description || "Produit");
  const vendorName = pickString(product.vendor) || pickString(product.brand) || sourceLabel || "Marketplace";
  const resolvedId = typeof product.id === "number" || typeof product.id === "string"
    ? String(product.id)
    : `${vendorName}:${safeName}`.toLowerCase();
  const priceAmount = normalisePrice(product.price);
  const previousAmount = normalisePrice(product.old_price);
  const ratingValue = typeof product.rating === "number" ? product.rating : toNumber(product.rating);

  return {
    id: resolvedId,
    title: safeName,
    vendor: vendorName,
    price: buildApiPriceObject(priceAmount),
    totalPrice: previousAmount ? buildApiPriceObject(previousAmount) : null,
    shippingCost: null,
    shippingText: product.description ?? null,
    inStock: null,
    stockStatus: forcedType ?? null,
    link: product.url ?? null,
    image: product.image ?? null,
    rating: typeof ratingValue === "number" ? ratingValue : null,
    reviewsCount: typeof product.reviewsCount === "number" ? product.reviewsCount : null,
    bestPrice: false,
    isBestPrice: false,
    source: sourceLabel || vendorName,
    productId: resolvedId,
    expiresAt: null,
    weightKg: null,
    pricePerKg: null,
  };
}

function normaliseProduct(record, vendor) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const data = record;
  const idCandidate = pickFromRecord(data, [
    "id",
    "product_id",
    "productId",
    "sku",
    "slug",
  ]);
  const nameCandidate = pickString(data.name)
    || pickString(data.title)
    || pickString(data.nom)
    || "Produit";
  const brandCandidate = pickString(data.brand)
    || pickString(data.vendorBrand)
    || pickString(data.marque);
  const imageCandidate = pickString(data.image)
    || pickString(data.image_url)
    || pickString(data.imageUrl)
    || pickString(data.thumbnail)
    || (Array.isArray(data.images)
      ? data.images.find((entry) => typeof entry === "string" && entry.trim().length > 0)
      : null);
  const descriptionCandidate = pickString(data.description)
    || pickString(data.short_description)
    || pickString(data.subtitle)
    || pickString(data.resume);
  const ratingCandidate = pickFromRecord(data, [
    "rating",
    "note",
    "averageRating",
    "avis",
  ]);
  const urlCandidate = pickString(data.url)
    || pickString(data.link)
    || pickString(data.permalink)
    || pickString(data.productUrl);

  const priceCandidate = pickFromRecord(data, [
    "price",
    "current_price",
    "currentPrice",
    "prix",
    "bestPrice",
    "amount",
  ]);
  const previousCandidate = pickFromRecord(data, [
    "old_price",
    "previous_price",
    "referencePrice",
    "price_before",
    "priceBefore",
    "originalPrice",
  ]);

  const id = typeof idCandidate === "number" || typeof idCandidate === "string"
    ? String(idCandidate)
    : `${vendor}:${nameCandidate}`.toLowerCase();
  const price = normalisePrice(priceCandidate);
  const oldPrice = normalisePrice(previousCandidate);
  const rating = typeof ratingCandidate === "number"
    ? ratingCandidate
    : toNumber(ratingCandidate);

  return {
    id,
    name: nameCandidate,
    price,
    old_price: oldPrice,
    image: imageCandidate ?? null,
    brand: brandCandidate ?? null,
    vendor,
    url: urlCandidate ?? null,
    rating: typeof rating === "number" && Number.isFinite(rating) ? rating : null,
    description: descriptionCandidate ?? null,
  };
}

function resolveEndpoint(endpoint, query) {
  if (!endpoint) {
    return null;
  }

  if (endpoint.includes("{query}")) {
    return endpoint.replace(/\{query\}/g, encodeURIComponent(query));
  }

  try {
    const url = new URL(endpoint);
    if (query && !url.searchParams.has("q")) {
      url.searchParams.set("q", query);
    }
    return url.toString();
  } catch {
    if (!query) {
      return endpoint;
    }
    const separator = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${separator}q=${encodeURIComponent(query)}`;
  }
}

async function fetchJson(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 10000);

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", ...options.headers },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json")) {
      console.warn("productAggregator.nonJson", {
        endpoint,
        contentType: response.headers.get("content-type") ?? null,
        preview: text.slice(0, 120),
      });
      return null;
    }

    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith("<")) {
      console.warn("productAggregator.invalidPayload", { endpoint, preview: trimmed.slice(0, 120) });
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (error) {
      console.error("productAggregator.parse", { endpoint, error });
      return null;
    }
  } catch (error) {
    if ((error instanceof Error && error.name === "AbortError") || error === null) {
      console.warn("productAggregator.timeout", { endpoint });
    } else {
      console.error("productAggregator.fetch", { endpoint, error });
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function filterByQuery(items, query) {
  if (!query) {
    return items;
  }
  const lower = query.toLowerCase();
  return items.filter((item) => {
    const haystack = `${item.name ?? ""} ${item.brand ?? ""} ${item.description ?? ""}`.toLowerCase();
    return haystack.includes(lower);
  });
}

function ensureArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.results)) {
      return payload.results;
    }
    if (Array.isArray(payload.items)) {
      return payload.items;
    }
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }
  return [];
}

function extractPriceFromObject(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  if ("amount" in entry) {
    const amount = toNumber(entry.amount);
    if (amount !== null) {
      return amount;
    }
  }

  if ("price" in entry) {
    const amount = toNumber(entry.price);
    if (amount !== null) {
      return amount;
    }
  }

  if ("value" in entry) {
    const amount = toNumber(entry.value);
    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

function normaliseDeal(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const idCandidate = pickString(entry.productId)
    || pickString(entry.id)
    || null;
  const vendorCandidate = pickString(entry.vendor)
    || pickString(entry.source)
    || null;
  const nameCandidate = pickString(entry.title)
    || pickString(entry.name)
    || vendorCandidate
    || "Produit";
  const descriptionCandidate = pickString(entry.stockStatus)
    || pickString(entry.description)
    || pickString(entry.shippingText);

  const priceCandidate = extractPriceFromObject(entry.price)
    || extractPriceFromObject(entry.totalPrice)
    || toNumber(entry.amount)
    || toNumber(entry.price);
  const previousCandidate = pickFromRecord(entry, [
    "previousPrice",
    "oldPrice",
    "priceBeforeDiscount",
    "strikePrice",
  ]);

  const ratingCandidate = pickFromRecord(entry, ["rating", "reviewsCount"]);

  return {
    id: idCandidate,
    name: nameCandidate,
    price: normalisePrice(priceCandidate),
    old_price: normalisePrice(previousCandidate),
    image: pickString(entry.image) ?? null,
    brand: pickString(entry.brand) ?? vendorCandidate ?? null,
    vendor: vendorCandidate,
    url: pickString(entry.link) ?? pickString(entry.url) ?? null,
    rating: typeof ratingCandidate === "number"
      ? ratingCandidate
      : toNumber(ratingCandidate),
    description: descriptionCandidate ?? null,
  };
}

function normalizeBackendProducts(query) {
  if (typeof query !== "string") {
    return null;
  }
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const cached = backendProductsCache.get(normalized);
  if (cached) {
    return cached;
  }
  return null;
}

async function fetchBackendProducts(query) {
  if (typeof query !== "string") {
    return [];
  }
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  const cached = backendProductsCache.get(normalized);
  if (cached) {
    return cached;
  }

  const ongoing = backendFetchPromises.get(normalized);
  if (ongoing) {
    return ongoing;
  }

  const fetchPromise = (async () => {
    try {
      const data = await apiClient.get(`/compare`, {
        query: { q: query, limit: 48, legacy: true },
        cache: "no-store",
        allowProxyFallback: false,
        preferProxy: true,
      });
      const records = ensureArray(data);
      const normalizedProducts = records
        .map((record) => normaliseDeal(record))
        .filter(Boolean);
      backendProductsCache.set(normalized, normalizedProducts);
      return normalizedProducts;
    } catch (error) {
      console.error("productAggregator.backend", { error });
      return [];
    } finally {
      backendFetchPromises.delete(normalized);
    }
  })();

  backendFetchPromises.set(normalized, fetchPromise);
  return fetchPromise;
}

async function fetchBackendVendorProducts(query, vendorKey) {
  const cachedProducts = normalizeBackendProducts(query);
  if (cachedProducts && cachedProducts.length > 0) {
    return filterBackendVendor(cachedProducts, vendorKey);
  }

  const products = await fetchBackendProducts(query);
  if (!products || products.length === 0) {
    return [];
  }
  return filterBackendVendor(products, vendorKey);
}

function filterBackendVendor(products, vendorKey) {
  if (!vendorKey) {
    return products;
  }
  const keywords = BACKEND_VENDOR_KEYWORDS[vendorKey];
  if (!keywords || keywords.length === 0) {
    return products;
  }

  return products.filter((product) => {
    const vendor = product.vendor || product.brand || "";
    const normalizedVendor = typeof vendor === "string" ? vendor.toLowerCase() : "";
    if (!normalizedVendor) {
      return false;
    }
    return keywords.some((keyword) => normalizedVendor.includes(keyword));
  });
}

async function fetchLegacyVendorProducts(query, endpoint, vendor) {
  const url = resolveEndpoint(endpoint, query);
  if (!url) {
    return [];
  }

  const payload = await fetchJson(url);
  const records = ensureArray(payload);
  const normalized = records
    .map((record) => normaliseProduct(record, vendor))
    .filter(Boolean);
  return filterByQuery(normalized, query).slice(0, DEFAULT_LIMIT);
}

export async function fetchDecathlon(query) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
  }

  const backendProducts = await fetchBackendVendorProducts(trimmed, "decathlon");
  if (backendProducts.length > 0) {
    return backendProducts.slice(0, DEFAULT_LIMIT);
  }

  if (DECATHLON_ENDPOINT) {
    return fetchLegacyVendorProducts(trimmed, DECATHLON_ENDPOINT, "Decathlon");
  }

  return [];
}

export async function fetchAmazon(query) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
  }

  const backendProducts = await fetchBackendVendorProducts(trimmed, "amazon");
  if (backendProducts.length > 0) {
    return backendProducts.slice(0, DEFAULT_LIMIT);
  }

  if (AMAZON_ENDPOINT) {
    return fetchLegacyVendorProducts(trimmed, AMAZON_ENDPOINT, "Amazon");
  }

  return [];
}

export async function scrapeMyProtein(query) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
  }

  const backendProducts = await fetchBackendVendorProducts(trimmed, "myprotein");
  if (backendProducts.length > 0) {
    return backendProducts.slice(0, DEFAULT_LIMIT);
  }

  if (MYPROTEIN_ENDPOINT) {
    return fetchLegacyVendorProducts(trimmed, MYPROTEIN_ENDPOINT, "MyProtein");
  }

  return [];
}

function buildSerpUrl(query, limit, apiKey) {
  const url = new URL(SERP_ENDPOINT);
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "fr");
  url.searchParams.set("gl", "fr");
  url.searchParams.set("num", String(limit));
  url.searchParams.set("api_key", apiKey);
  return url;
}

export async function fetchSerpApi(query, { limit = DEFAULT_LIMIT } = {}) {
  const apiKey = process.env.SERPAPI_KEY || process.env.NEXT_PUBLIC_SERPAPI_KEY;
  if (!apiKey || !query) {
    return [];
  }

  try {
    const url = buildSerpUrl(query, Math.max(limit * 2, limit), apiKey);
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "fitidion-search/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("productAggregator.serpError", { status: response.status });
      return [];
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.shopping_results) ? payload.shopping_results : [];
    return items
      .map((item, index) => {
        const productId = pickString(item.product_id)
          || (typeof item.product_id === "number" ? String(item.product_id) : null)
          || pickString(item.position)
          || (typeof item.position === "number" ? String(item.position) : null)
          || `serp-${index}`;

        return {
          id: productId,
          name: pickString(item.title) || "Produit",
          price: normalisePrice(item.price) ?? normalisePrice(item.extracted_price),
          old_price: normalisePrice(item.compare_at_price),
          image: pickString(item.thumbnail),
          brand: pickString(item.brand),
          vendor: pickString(item.source) || pickString(item.store) || "SerpAPI",
          url: pickString(item.link) || null,
          rating: toNumber(item.rating),
          description: pickString(item.description) || null,
        };
      })
      .filter((item) => item && item.name)
      .slice(0, limit);
  } catch (error) {
    console.error("productAggregator.serpFetch", { error });
    return [];
  }
}

export function mergeAndCleanResults(results) {
  const seen = new Map();

  for (const entry of results) {
    if (!entry || !entry.name) {
      continue;
    }

    const id = entry.id ?? `${entry.vendor}:${entry.name}`;
    const key = id.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, entry);
      continue;
    }

    const existingPrice = typeof existing.price === "number" ? existing.price : Number.POSITIVE_INFINITY;
    const nextPrice = typeof entry.price === "number" ? entry.price : Number.POSITIVE_INFINITY;

    if (nextPrice < existingPrice) {
      seen.set(key, { ...existing, ...entry });
      continue;
    }

    if (!existing.description && entry.description) {
      seen.set(key, { ...existing, description: entry.description });
    }
  }

  const deduped = Array.from(seen.values());
  deduped.sort((a, b) => {
    const priceA = typeof a.price === "number" ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" ? b.price : Number.POSITIVE_INFINITY;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    const ratingA = typeof a.rating === "number" ? a.rating : 0;
    const ratingB = typeof b.rating === "number" ? b.rating : 0;
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  return deduped;
}

async function fetchCategoryDeals({
  query,
  limit = DEFAULT_CATEGORY_LIMIT,
  serpQuery,
  predicate,
  source,
  forcedType,
}) {
  const resolvedLimit = Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_CATEGORY_LIMIT;
  const trimmedQuery = query?.trim();
  let collected = [];

  if (trimmedQuery) {
    const baseResults = await searchProducts(trimmedQuery, { limit: resolvedLimit * 4 }).catch(() => []);
    const normalizedBase = Array.isArray(baseResults) ? baseResults : [];
    collected = normalizedBase
      .map((entry) => ({
        ...entry,
        name: cleanProductName(entry.name || entry.title || entry.description || "Produit"),
        price: normalisePrice(entry.price),
        old_price: normalisePrice(entry.old_price),
      }))
      .filter((entry) => typeof entry.price === "number" && Number.isFinite(entry.price));

    if (typeof predicate === "function") {
      collected = collected.filter((entry) => predicate(entry));
    }
  }

  if (collected.length < resolvedLimit) {
    const serpQueryValue = serpQuery || trimmedQuery;
    const serpResults = await fetchSerpApi(serpQueryValue, { limit: resolvedLimit * 4 }).catch(() => []);
    const normalizedSerp = Array.isArray(serpResults)
      ? serpResults
          .map((entry, index) => ({
            id: entry.id || entry.productId || entry.product_id || entry.position || `serp-${index}`,
            name: cleanProductName(entry.name || entry.title || entry.description || "Produit"),
            price: normalisePrice(entry.price ?? entry.amount ?? entry.extracted_price),
            old_price: normalisePrice(entry.old_price ?? entry.compare_at_price),
            image: entry.image || entry.thumbnail || null,
            brand: entry.brand || entry.store || null,
            vendor: entry.vendor || entry.source || entry.store || entry.brand || "SerpAPI",
            url: entry.url || entry.link || null,
            rating: toNumber(entry.rating),
            description: entry.description || null,
          }))
          .filter((entry) => typeof entry.price === "number" && Number.isFinite(entry.price))
      : [];

    if (normalizedSerp.length > 0) {
      const merged = mergeAndCleanResults([...collected, ...normalizedSerp]);
      collected = typeof predicate === "function" ? merged.filter((entry) => predicate(entry)) : merged;
    }
  }

  collected.sort((a, b) => {
    const priceA = typeof a.price === "number" ? a.price : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" ? b.price : Number.POSITIVE_INFINITY;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  const limited = collected.slice(0, resolvedLimit);

  if (limited.length === 0) {
    return { deals: [], usedFallback: false };
  }

  return {
    deals: limited.map((entry) => toDealItem(entry, { sourceLabel: source, forcedType })),
    usedFallback: false,
  };
}

export async function fetchWheyAbove20(options = {}) {
  const { limit = DEFAULT_CATEGORY_LIMIT } = options;
  const minPrice = 20;
  return fetchCategoryDeals({
    query: "whey isolate",
    serpQuery: "whey isolate 1kg france",
    limit,
    source: "Sélection Whey",
    predicate: (entry) => typeof entry.price === "number" && entry.price >= minPrice,
  });
}

export async function fetchCreatine(options = {}) {
  const { limit = DEFAULT_CATEGORY_LIMIT } = options;
  return fetchCategoryDeals({
    query: "creatine monohydrate",
    serpQuery: "creatine monohydrate 500g",
    limit,
    source: "Sélection Créatine",
    predicate: (entry) => {
      const name = `${entry.name ?? ""} ${entry.description ?? ""}`.toLowerCase();
      return name.includes("créatine") || name.includes("creatine");
    },
  });
}

export async function fetchGymsharkClothes(options = {}) {
  const { limit = DEFAULT_CATEGORY_LIMIT } = options;
  return fetchCategoryDeals({
    query: "gymshark vêtements",
    serpQuery: "gymshark clothes france",
    limit,
    source: "Sélection Gymshark",
    forcedType: "clothes",
    predicate: (entry) => {
      const vendor = `${entry.vendor ?? entry.brand ?? ""}`.toLowerCase();
      if (!vendor.includes("gymshark")) {
        return false;
      }
      const name = `${entry.name ?? ""} ${entry.description ?? ""}`.toLowerCase();
      return CLOTHING_KEYWORDS.some((keyword) => name.includes(keyword));
    },
  });
}

export async function searchProducts(query, { limit = DEFAULT_LIMIT } = {}) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
  }

  const tasks = [
    fetchDecathlon(trimmed).catch(() => []),
    fetchAmazon(trimmed).catch(() => []),
    scrapeMyProtein(trimmed).catch(() => []),
  ];

  const [decathlon, amazon, myProtein] = await Promise.all(tasks);
  let combined = [...decathlon, ...amazon, ...myProtein];

  if (combined.length === 0) {
    const serp = await fetchSerpApi(trimmed, { limit }).catch(() => []);
    combined = serp;
  } else {
    const serp = await fetchSerpApi(trimmed, { limit }).catch(() => []);
    combined.push(...serp);
  }

  const merged = mergeAndCleanResults(combined);
  return merged.slice(0, limit);
}

export function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return priceFormatter.format(value);
}

export default {
  fetchDecathlon,
  fetchAmazon,
  scrapeMyProtein,
  fetchSerpApi,
  fetchWheyAbove20,
  fetchCreatine,
  fetchGymsharkClothes,
  mergeAndCleanResults,
  searchProducts,
  formatPrice,
};
