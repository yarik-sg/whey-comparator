import {
  fetchAmazon,
  fetchDecathlon,
  fetchSerpApi,
  scrapeMyProtein,
} from "@/lib/productAggregator.js";

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
  image: string | null;
};

export type ProductData = {
  id: string;
  name: string;
  image: string;
  brand: string | null;
  description: string | null;
  rating: number | null;
  price: ProductPriceSummary;
  offers: ProductOffer[];
  history: ProductHistoryEntry[];
};

type RawProduct = Record<string, unknown>;

type NormalizedProduct = {
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
  shipping?: string | null;
  delivery_time?: string | null;
};

type MerchantProfile = {
  key: string;
  label: string;
  logo: string;
  buildUrl: (query: string) => string;
  shipping?: string;
  delivery?: string;
  rating?: number;
  aliases?: string[];
};

const FALLBACK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
const MINIMUM_OFFER_COUNT = 5;

const MERCHANT_PROFILES: MerchantProfile[] = [
  {
    key: "amazon",
    label: "Amazon",
    logo: "https://logo.clearbit.com/amazon.fr",
    buildUrl: (query) => `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`,
    shipping: "Livraison Prime éligible",
    delivery: "24-48h",
    rating: 4.7,
    aliases: ["amazon fr", "amazon marketplace"],
  },
  {
    key: "decathlon",
    label: "Decathlon",
    logo: "https://logo.clearbit.com/decathlon.fr",
    buildUrl: (query) => `https://www.decathlon.fr/search?Ntt=${encodeURIComponent(query)}`,
    shipping: "Retrait 1h en magasin",
    delivery: "2-3 jours",
    rating: 4.6,
  },
  {
    key: "cdiscount",
    label: "Cdiscount",
    logo: "https://logo.clearbit.com/cdiscount.com",
    buildUrl: (query) => `https://www.cdiscount.com/search/10/${encodeURIComponent(query)}.html`,
    shipping: "Dès 3,99€",
    delivery: "3-5 jours",
    rating: 4.3,
  },
  {
    key: "alltricks",
    label: "Alltricks",
    logo: "https://logo.clearbit.com/alltricks.fr",
    buildUrl: (query) => `https://www.alltricks.fr/F-${encodeURIComponent(query)}`,
    shipping: "Livraison offerte dès 69€",
    delivery: "2-3 jours",
    rating: 4.5,
  },
  {
    key: "go-sport",
    label: "GO Sport",
    logo: "https://logo.clearbit.com/go-sport.com",
    buildUrl: (query) => `https://www.go-sport.com/search?q=${encodeURIComponent(query)}`,
    shipping: "Offert dès 60€",
    delivery: "3-4 jours",
    rating: 4.2,
    aliases: ["gosport"],
  },
  {
    key: "intersport",
    label: "Intersport",
    logo: "https://logo.clearbit.com/intersport.fr",
    buildUrl: (query) => `https://www.intersport.fr/search/${encodeURIComponent(query)}/`,
    shipping: "Livraison en 48h",
    delivery: "2-3 jours",
    rating: 4.1,
  },
  {
    key: "fnac",
    label: "Fnac",
    logo: "https://logo.clearbit.com/fnac.com",
    buildUrl: (query) => `https://www.fnac.com/SearchResult/ResultList.aspx?SCat=0%211&Search=${encodeURIComponent(query)}`,
    shipping: "Retrait 1h magasin",
    delivery: "2-4 jours",
    rating: 4.4,
  },
  {
    key: "darty",
    label: "Darty",
    logo: "https://logo.clearbit.com/darty.com",
    buildUrl: (query) => `https://www.darty.com/nav/recherche/${encodeURIComponent(query)}.html`,
    shipping: "Retrait 1h magasin",
    delivery: "2-3 jours",
    rating: 4.5,
  },
  {
    key: "rakuten",
    label: "Rakuten",
    logo: "https://logo.clearbit.com/rakuten.fr",
    buildUrl: (query) => `https://fr.shopping.rakuten.com/search/${encodeURIComponent(query)}`,
    shipping: "Selon vendeur",
    delivery: "3-7 jours",
    rating: 4.2,
  },
  {
    key: "leclerc",
    label: "E.Leclerc",
    logo: "https://logo.clearbit.com/e-leclerc.com",
    buildUrl: (query) => `https://www.e-leclerc.com/catalogue/search/${encodeURIComponent(query)}`,
    shipping: "Drive disponible",
    delivery: "2-4 jours",
    rating: 4.0,
    aliases: ["leclerc"],
  },
  {
    key: "auchan",
    label: "Auchan",
    logo: "https://logo.clearbit.com/auchan.fr",
    buildUrl: (query) => `https://www.auchan.fr/recherche/${encodeURIComponent(query)}`,
    shipping: "Livraison à domicile",
    delivery: "3-5 jours",
    rating: 4.0,
  },
  {
    key: "carrefour",
    label: "Carrefour",
    logo: "https://logo.clearbit.com/carrefour.fr",
    buildUrl: (query) => `https://www.carrefour.fr/s?q=${encodeURIComponent(query)}`,
    shipping: "Retrait 2h",
    delivery: "3-4 jours",
    rating: 4.1,
  },
];

const MERCHANT_INDEX = new Map<string, MerchantProfile>();
for (const profile of MERCHANT_PROFILES) {
  const normalizedKey = normalizeMerchantKey(profile.key || profile.label);
  if (normalizedKey) {
    MERCHANT_INDEX.set(normalizedKey, profile);
  }
  if (profile.aliases) {
    for (const alias of profile.aliases) {
      const aliasKey = normalizeMerchantKey(alias);
      if (aliasKey) {
        MERCHANT_INDEX.set(aliasKey, profile);
      }
    }
  }
  const labelKey = normalizeMerchantKey(profile.label);
  if (labelKey && !MERCHANT_INDEX.has(labelKey)) {
    MERCHANT_INDEX.set(labelKey, profile);
  }
}

function normalizeMerchantKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.replace(/[^a-z0-9]+/gi, "").toLowerCase();
}

function lookupMerchantProfile(value: string | null | undefined): MerchantProfile | null {
  if (!value) {
    return null;
  }
  const normalized = normalizeMerchantKey(value);
  if (!normalized) {
    return null;
  }

  const direct = MERCHANT_INDEX.get(normalized);
  if (direct) {
    return direct;
  }

  for (const [key, profile] of MERCHANT_INDEX.entries()) {
    if (normalized.includes(key)) {
      return profile;
    }
  }

  return null;
}

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

function normalizeSerpProduct(entry: unknown): NormalizedProduct | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const raw = entry as RawProduct;

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

function normalizeExternalProduct(entry: unknown, fallbackVendor?: string): NormalizedProduct | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const raw = entry as RawProduct;
  const id = toString(raw.id)
    || toString(raw.product_id)
    || toString(raw.productId)
    || null;
  const name = toString(raw.name) || toString(raw.title) || null;
  const vendor = toString(raw.vendor)
    || toString(raw.brand)
    || fallbackVendor
    || null;
  const brand = toString(raw.brand) || null;
  const image = toString(raw.image)
    || toString(raw.image_url)
    || toString(raw.imageUrl)
    || toString(raw.thumbnail)
    || (Array.isArray(raw.images)
      ? raw.images.find((item) => typeof item === "string" && item.trim().length > 0) ?? null
      : null);
  const description = toString(raw.description)
    || toString(raw.subtitle)
    || toString(raw.resume)
    || null;
  const url = toString(raw.url)
    || toString(raw.link)
    || toString(raw.permalink)
    || toString(raw.productUrl)
    || null;
  const price = toNumber(raw.price)
    ?? toNumber(raw.current_price)
    ?? toNumber(raw.currentPrice)
    ?? toNumber(raw.prix)
    ?? toNumber(raw.bestPrice)
    ?? toNumber(raw.amount)
    ?? null;
  const oldPrice = toNumber(raw.old_price)
    ?? toNumber(raw.previous_price)
    ?? toNumber(raw.referencePrice)
    ?? toNumber(raw.originalPrice)
    ?? null;
  const rating = toNumber(raw.rating)
    ?? toNumber(raw.note)
    ?? toNumber(raw.averageRating)
    ?? toNumber(raw.avis)
    ?? null;

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
    shipping: toString(raw.shipping) || null,
    delivery_time: toString(raw.delivery_time) || toString(raw.deliveryTime) || null,
  };
}

function dedupeOffers(offers: ProductOffer[]): ProductOffer[] {
  const seen = new Map<string, ProductOffer>();

  for (const offer of offers) {
    const sellerKey = offer.seller.trim().toLowerCase();
    const key = offer.url ? `${sellerKey}::${offer.url}` : sellerKey;

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

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
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

function createPseudoRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 0xffffffff;
    return state / 0xffffffff;
  };
}

function simulateBasePrice(seed: number): number {
  const normalized = (seed % 3500) / 100; // 0 -> 34.99
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

function pickBestProduct(products: NormalizedProduct[], query: string): NormalizedProduct | null {
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

function toOffer(product: NormalizedProduct, query: string): ProductOffer | null {
  const seller = product.vendor
    || product.brand
    || product.name
    || "Marchand partenaire";

  if (!seller) {
    return null;
  }

  const merchantProfile = lookupMerchantProfile(seller);
  const url = product.url ?? merchantProfile?.buildUrl(query) ?? null;

  const price = typeof product.price === "number" && Number.isFinite(product.price)
    ? roundCurrency(product.price)
    : null;
  const oldPrice = typeof product.old_price === "number" && Number.isFinite(product.old_price)
    ? roundCurrency(product.old_price)
    : null;
  const rating = typeof product.rating === "number" && Number.isFinite(product.rating)
    ? roundRating(product.rating)
    : merchantProfile?.rating ?? null;

  return {
    seller,
    price,
    old_price: oldPrice,
    url,
    shipping: product.shipping ?? merchantProfile?.shipping ?? null,
    delivery_time: product.delivery_time ?? merchantProfile?.delivery ?? null,
    rating,
    logo: merchantProfile?.logo ?? null,
    source: merchantProfile?.label ?? product.vendor ?? null,
    image: product.image ?? merchantProfile?.logo ?? null,
  };
}

function buildSimulatedOffers(
  count: number,
  query: string,
  seed: number,
  basePrice: number,
  existingSellers: Set<string>,
): ProductOffer[] {
  const offers: ProductOffer[] = [];
  const random = createPseudoRandom(seed);
  const base = basePrice > 0 ? basePrice : simulateBasePrice(seed);

  for (const profile of MERCHANT_PROFILES) {
    if (offers.length >= count) {
      break;
    }
    const key = normalizeMerchantKey(profile.label);
    if (existingSellers.has(key)) {
      continue;
    }

    const variation = (random() - 0.45) * 0.22; // [-0.099, +0.187)
    const price = roundCurrency(Math.max(base * (1 + variation), base * 0.85));
    const oldPrice = roundCurrency(price * (1 + Math.abs(variation) + 0.06));

    offers.push({
      seller: profile.label,
      price,
      old_price: oldPrice,
      url: profile.buildUrl(query),
      shipping: profile.shipping ?? "Livraison selon marchand",
      delivery_time: profile.delivery ?? null,
      rating: profile.rating ? roundRating(profile.rating) : null,
      logo: profile.logo,
      source: "Simulation",
      image: profile.logo,
    });

    existingSellers.add(key);
  }

  // Enrichir avec des partenaires génériques si nécessaire.
  let partnerIndex = 1;
  while (offers.length < count) {
    const partnerName = `Boutique partenaire ${partnerIndex}`;
    const variation = (random() - 0.5) * 0.14;
    const price = roundCurrency(Math.max(base * (1 + variation), base * 0.88));
    const oldPrice = roundCurrency(price * 1.08);

    offers.push({
      seller: partnerName,
      price,
      old_price: oldPrice,
      url: `https://www.idealo.fr/prix/${encodeURIComponent(query)}`,
      shipping: "Livraison variable",
      delivery_time: "3-6 jours",
      rating: null,
      logo: null,
      source: "Simulation",
      image: null,
    });

    existingSellers.add(normalizeMerchantKey(partnerName));
    partnerIndex += 1;
  }

  return offers;
}

function ensureOffers(offers: ProductOffer[], query: string, seed: number): ProductOffer[] {
  const deduped = dedupeOffers(offers.filter((offer) => Boolean(offer?.seller)));
  const existingSellers = new Set(
    deduped.map((offer) => normalizeMerchantKey(offer.seller)),
  );

  const needed = Math.max(
    MINIMUM_OFFER_COUNT - deduped.length,
    deduped.length === 0 ? MINIMUM_OFFER_COUNT : 0,
  );

  if (needed <= 0) {
    return deduped;
  }

  const basePrice = deduped[0]?.price ?? null;
  const simulated = buildSimulatedOffers(
    needed,
    query,
    seed,
    typeof basePrice === "number" ? basePrice : simulateBasePrice(seed),
    existingSellers,
  );

  return dedupeOffers([...deduped, ...simulated]);
}

function normalizeDescription(description: string | null, query: string): string | null {
  if (description) {
    return description;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return "Comparaison générée automatiquement.";
  }

  return `Analyse des offres en ligne pour "${trimmed}".`;
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
      image: FALLBACK_IMAGE,
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

  let serpResults: NormalizedProduct[] = [];
  let decathlonResults: NormalizedProduct[] = [];
  let amazonResults: NormalizedProduct[] = [];
  let myProteinResults: NormalizedProduct[] = [];

  const tasks: Promise<void>[] = [];

  tasks.push(
    fetchSerpApi(query, { limit: 24 })
      .then((raw) => {
        serpResults = raw
          .map(normalizeSerpProduct)
          .filter((product): product is NormalizedProduct => Boolean(product));
      })
      .catch((error) => {
        console.error("productFetcher.serp", error);
        serpResults = [];
      }),
  );

  tasks.push(
    fetchDecathlon(query)
      .then((raw) => {
        decathlonResults = raw
          .map((item: unknown) => normalizeExternalProduct(item, "Decathlon"))
          .filter((product): product is NormalizedProduct => Boolean(product));
      })
      .catch((error) => {
        console.error("productFetcher.decathlon", error);
        decathlonResults = [];
      }),
  );

  tasks.push(
    fetchAmazon(query)
      .then((raw) => {
        amazonResults = raw
          .map((item: unknown) => normalizeExternalProduct(item, "Amazon"))
          .filter((product): product is NormalizedProduct => Boolean(product));
      })
      .catch((error) => {
        console.error("productFetcher.amazon", error);
        amazonResults = [];
      }),
  );

  tasks.push(
    scrapeMyProtein(query)
      .then((raw) => {
        myProteinResults = raw
          .map((item: unknown) => normalizeExternalProduct(item, "MyProtein"))
          .filter((product): product is NormalizedProduct => Boolean(product));
      })
      .catch((error) => {
        console.error("productFetcher.myprotein", error);
        myProteinResults = [];
      }),
  );

  await Promise.all(tasks);

  const combinedProducts = [
    ...decathlonResults,
    ...amazonResults,
    ...myProteinResults,
    ...serpResults,
  ];

  const seed = deriveSeed(identifier + query);
  const bestProduct = pickBestProduct(combinedProducts, query);

  let offers = combinedProducts
    .map((product) => toOffer(product, query))
    .filter((offer): offer is ProductOffer => Boolean(offer?.seller));

  offers = ensureOffers(offers, query, seed).slice(0, 18);

  const referencePrice = bestProduct?.price ?? offers[0]?.price ?? simulateBasePrice(seed);
  let priceStats = computePriceStats(offers, typeof referencePrice === "number" ? referencePrice : null);

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

  const productImage = bestProduct?.image
    || offers.find((offer) => offer.image)?.image
    || FALLBACK_IMAGE;

  const productRating = typeof bestProduct?.rating === "number" && Number.isFinite(bestProduct.rating)
    ? roundRating(bestProduct.rating)
    : offers.find((offer) => typeof offer.rating === "number" && Number.isFinite(offer.rating))?.rating
    ?? null;

  return {
    id: normalizeId(bestProduct?.id ?? null, identifier),
    name: normalizeName(bestProduct?.name ?? null, query),
    image: productImage,
    brand: bestProduct?.brand ?? bestProduct?.vendor ?? null,
    description: normalizeDescription(bestProduct?.description ?? null, query),
    rating: productRating,
    price: priceStats,
    offers,
    history,
  };
}
