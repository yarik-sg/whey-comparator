import type {
  ApiPrice,
  ComparisonEntry,
  ComparisonResponse,
  DealItem,
  ProductOffersResponse,
  ProductSummary,
  RelatedProductsResponse,
  ScraperOffer,
} from "@/types/api";

const DEFAULT_CURRENCY = "EUR";
const formatterCache = new Map<string, Intl.NumberFormat>();

function formatCurrency(amount: number, currency: string) {
  const normalizedCurrency = currency?.toUpperCase() || DEFAULT_CURRENCY;
  let formatter = formatterCache.get(normalizedCurrency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    });
    formatterCache.set(normalizedCurrency, formatter);
  }
  return formatter.format(amount);
}

type RawFallbackOffer = {
  id: string;
  title?: string;
  vendor: string;
  price: number;
  currency?: string;
  shippingCost?: number;
  shippingText?: string;
  inStock?: boolean;
  stockStatus?: string;
  link?: string;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  source?: string;
};

type RawFallbackProduct = {
  id: number;
  name: string;
  brand?: string;
  flavour?: string;
  category?: string;
  image?: string;
  weightKg?: number;
  proteinPerServing?: number;
  servingSize?: number;
  rating?: number;
  reviewsCount?: number;
  offers: RawFallbackOffer[];
};

const RAW_FALLBACK_PRODUCTS: RawFallbackProduct[] = [
  {
    id: 101,
    name: "Impact Whey Isolate 1 kg",
    brand: "MyProtein",
    flavour: "Vanille",
    category: "whey-protein",
    image: "https://images.unsplash.com/photo-1586402187872-4ebc2c4f7caf?auto=format&fit=crop&w=600&q=80",
    weightKg: 1,
    proteinPerServing: 23,
    servingSize: 25,
    rating: 4.7,
    reviewsCount: 1984,
    offers: [
      {
        id: "mp-impact-vanilla",
        title: "Impact Whey Isolate 1 kg",
        vendor: "MyProtein",
        price: 29.99,
        currency: "EUR",
        shippingCost: 4.99,
        shippingText: "Livraison 4,99 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.myprotein.fr/sports-nutrition/impact-whey-isolate/10852501.html",
        image: "https://images.unsplash.com/photo-1526402467855-1d8db87a98e7?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 1523,
        source: "Catalogue interne",
      },
      {
        id: "amazon-impact-vanilla",
        title: "Impact Whey Isolate 1 kg",
        vendor: "Amazon",
        price: 32.49,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "Expédié sous 24h",
        link: "https://www.amazon.fr/dp/B00PYX0K5W",
        image: "https://images.unsplash.com/photo-1598966733525-05cbe7d5ac26?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 1984,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 102,
    name: "100% Whey Gold Standard 908 g",
    brand: "Optimum Nutrition",
    flavour: "Double chocolat",
    category: "whey-protein",
    image: "https://images.unsplash.com/photo-1517638851339-4aa32003c11a?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.908,
    proteinPerServing: 24,
    servingSize: 30,
    rating: 4.8,
    reviewsCount: 842,
    offers: [
      {
        id: "decathlon-gold-standard",
        title: "Whey Gold Standard 908 g",
        vendor: "Decathlon",
        price: 39.99,
        currency: "EUR",
        shippingCost: 4.5,
        shippingText: "Livraison 4,50 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/whey-gold-standard-908g/_/R-p-X8735034",
        image: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 421,
        source: "Catalogue interne",
      },
      {
        id: "amazon-gold-standard",
        title: "Optimum Nutrition Gold Standard Whey 908 g",
        vendor: "Amazon",
        price: 42.9,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.amazon.fr/dp/B002DYIZEO",
        image: "https://images.unsplash.com/photo-1486225068466-1a1574128861?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 842,
        source: "SerpAPI",
      },
    ],
  },
];

function formatPrice(amount: number | null | undefined, currency = DEFAULT_CURRENCY): ApiPrice {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
    return {
      amount: rounded,
      currency,
      formatted: formatCurrency(rounded, currency),
    };
  }

  return {
    amount: null,
    currency,
    formatted: null,
  };
}

function clonePrice(price: ApiPrice | null | undefined): ApiPrice | null {
  if (!price) {
    return null;
  }

  return {
    amount: price.amount ?? null,
    currency: price.currency ?? null,
    formatted: price.formatted ?? null,
  };
}

function cloneDeal(deal: DealItem): DealItem {
  return {
    ...deal,
    price: clonePrice(deal.price) ?? formatPrice(null, deal.price.currency ?? DEFAULT_CURRENCY),
    totalPrice: deal.totalPrice ? clonePrice(deal.totalPrice) : null,
    shippingCost: deal.shippingCost ?? null,
    shippingText: deal.shippingText ?? null,
    inStock: deal.inStock ?? null,
    stockStatus: deal.stockStatus ?? null,
    link: deal.link ?? null,
    image: deal.image ?? null,
    rating: deal.rating ?? null,
    reviewsCount: deal.reviewsCount ?? null,
    bestPrice: deal.bestPrice ?? false,
    isBestPrice: deal.isBestPrice ?? false,
    source: deal.source,
    productId: deal.productId ?? null,
    expiresAt: deal.expiresAt ?? null,
    weightKg: deal.weightKg ?? null,
    pricePerKg: deal.pricePerKg ?? null,
  };
}

function cloneProduct(product: ProductSummary): ProductSummary {
  return {
    ...product,
    bestPrice: clonePrice(product.bestPrice) ?? formatPrice(null),
    totalPrice: product.totalPrice ? clonePrice(product.totalPrice) : null,
    bestDeal: product.bestDeal ? cloneDeal(product.bestDeal) : null,
    proteinPerEuro: product.proteinPerEuro ?? null,
    pricePerKg: product.pricePerKg ?? null,
    inStock: product.inStock ?? null,
    stockStatus: product.stockStatus ?? null,
    rating: product.rating ?? null,
    reviewsCount: product.reviewsCount ?? null,
    bestVendor: product.bestVendor ?? null,
    link: product.link ?? null,
  };
}

function buildOffer(rawOffer: RawFallbackOffer, product: RawFallbackProduct): DealItem {
  const currency = rawOffer.currency ?? DEFAULT_CURRENCY;
  const basePrice = formatPrice(rawOffer.price, currency);
  const totalAmount =
    typeof rawOffer.shippingCost === "number"
      ? rawOffer.price + rawOffer.shippingCost
      : rawOffer.price;
  const totalPrice =
    typeof totalAmount === "number" && Number.isFinite(totalAmount)
      ? formatPrice(totalAmount, currency)
      : null;

  const weightKg = product.weightKg ?? null;
  const pricePerKg =
    weightKg && totalAmount
      ? Math.round(((totalAmount / weightKg) + Number.EPSILON) * 100) / 100
      : null;

  return {
    id: rawOffer.id,
    title: rawOffer.title ?? rawOffer.vendor,
    vendor: rawOffer.vendor,
    price: basePrice,
    totalPrice,
    shippingCost:
      typeof rawOffer.shippingCost === "number" ? rawOffer.shippingCost : null,
    shippingText: rawOffer.shippingText ?? null,
    inStock: rawOffer.inStock ?? null,
    stockStatus: rawOffer.stockStatus ?? null,
    link: rawOffer.link ?? null,
    image: rawOffer.image ?? null,
    rating: rawOffer.rating ?? null,
    reviewsCount: rawOffer.reviewsCount ?? null,
    bestPrice: false,
    isBestPrice: false,
    source: rawOffer.source ?? rawOffer.vendor,
    productId: product.id,
    expiresAt: null,
    weightKg,
    pricePerKg,
  };
}

function getTotalAmount(offer: DealItem): number {
  const total = offer.totalPrice?.amount ?? offer.price.amount;
  if (typeof total === "number" && Number.isFinite(total)) {
    return total;
  }
  return Number.POSITIVE_INFINITY;
}

function markBestOffer(offers: DealItem[]): DealItem | null {
  let best: DealItem | null = null;
  let bestAmount = Number.POSITIVE_INFINITY;

  for (const offer of offers) {
    const amount = getTotalAmount(offer);
    if (amount < bestAmount) {
      best = offer;
      bestAmount = amount;
    }
  }

  if (best) {
    best.bestPrice = true;
    best.isBestPrice = true;
  }

  return best;
}

function buildProduct(
  product: RawFallbackProduct,
  offers: DealItem[],
  bestOffer: DealItem | null,
): ProductSummary {
  const bestPrice = clonePrice(bestOffer?.totalPrice ?? bestOffer?.price) ?? formatPrice(null);
  const totalPrice = clonePrice(bestOffer?.totalPrice);
  const bestDeal = bestOffer ? cloneDeal(bestOffer) : null;

  const weightKg = product.weightKg ?? null;
  const proteinPerServing = product.proteinPerServing ?? null;
  const servingSize = product.servingSize ?? null;

  let proteinPerEuro: number | null = null;
  const referenceAmount =
    (bestDeal?.totalPrice?.amount ?? bestDeal?.price.amount ?? bestPrice.amount) ?? null;

  if (
    typeof proteinPerServing === "number" &&
    typeof servingSize === "number" &&
    servingSize > 0 &&
    typeof weightKg === "number" &&
    weightKg > 0 &&
    typeof referenceAmount === "number" &&
    referenceAmount > 0
  ) {
    const servings = (weightKg * 1000) / servingSize;
    const totalProtein = servings * proteinPerServing;
    proteinPerEuro = Math.round(((totalProtein / referenceAmount) + Number.EPSILON) * 100) / 100;
  }

  const pricePerKg =
    typeof weightKg === "number" && weightKg > 0 && typeof referenceAmount === "number"
      ? Math.round(((referenceAmount / weightKg) + Number.EPSILON) * 100) / 100
      : null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? null,
    flavour: product.flavour ?? null,
    category: product.category ?? null,
    image: product.image ?? null,
    image_url: product.image ?? null,
    bestPrice,
    totalPrice,
    bestDeal,
    offersCount: offers.length,
    inStock: bestOffer?.inStock ?? null,
    stockStatus: bestOffer?.stockStatus ?? null,
    rating: product.rating ?? bestOffer?.rating ?? null,
    reviewsCount: product.reviewsCount ?? bestOffer?.reviewsCount ?? null,
    proteinPerEuro,
    protein_per_serving_g: proteinPerServing,
    serving_size_g: servingSize,
    pricePerKg,
    bestVendor: bestOffer?.vendor ?? null,
    link: bestOffer?.link ?? null,
  };
}

function buildEntry(product: RawFallbackProduct): ComparisonEntry {
  const offers = product.offers.map((offer) => buildOffer(offer, product));
  const bestOffer = markBestOffer(offers);
  const summary = buildProduct(product, offers, bestOffer);

  return {
    product: summary,
    offers,
  };
}

function buildScraperOffers(product: RawFallbackProduct): ScraperOffer[] {
  const timestamp = new Date().toISOString();

  return product.offers.map((rawOffer, index) => {
    return {
      id: index + 1,
      source: rawOffer.source ?? rawOffer.vendor,
      url: rawOffer.link ?? "",
      price: rawOffer.price,
      currency: rawOffer.currency ?? DEFAULT_CURRENCY,
      price_per_100g_protein: null,
      stock_status: rawOffer.stockStatus ?? null,
      in_stock: rawOffer.inStock ?? null,
      shipping_cost: rawOffer.shippingCost ?? null,
      shipping_text: rawOffer.shippingText ?? null,
      last_checked: timestamp,
    } satisfies ScraperOffer;
  });
}

function buildSummary(offers: DealItem[]): DealItem[] {
  const sorted = offers
    .slice()
    .sort((a, b) => getTotalAmount(a) - getTotalAmount(b));

  return sorted.slice(0, Math.min(sorted.length, 5)).map((offer, index) => {
    const cloned = cloneDeal(offer);
    if (index === 0) {
      cloned.bestPrice = true;
      cloned.isBestPrice = true;
    }
    return cloned;
  });
}

function normalizeIds(ids: readonly string[]): number[] {
  const normalized = new Set<number>();

  ids.forEach((value) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      normalized.add(parsed);
    }
  });

  return Array.from(normalized);
}

export function getFallbackProductSummaries(limit?: number): ProductSummary[] {
  const resolvedLimit = typeof limit === "number" && limit > 0 ? limit : RAW_FALLBACK_PRODUCTS.length;
  return RAW_FALLBACK_PRODUCTS.slice(0, resolvedLimit).map((product) => {
    const entry = buildEntry(product);
    return cloneProduct(entry.product);
  });
}

export function getFallbackProductOffers(productId: number): ProductOffersResponse | null {
  const product = RAW_FALLBACK_PRODUCTS.find((item) => item.id === productId);
  if (!product) {
    return null;
  }

  const entry = buildEntry(product);
  const offers = entry.offers.map((offer) => cloneDeal(offer));

  return {
    product: cloneProduct(entry.product),
    offers,
    sources: {
      scraper: buildScraperOffers(product),
    },
  } satisfies ProductOffersResponse;
}

function scoreRelatedProduct(
  base: RawFallbackProduct,
  candidate: RawFallbackProduct,
): number {
  let score = 0;

  if (base.brand && candidate.brand && base.brand === candidate.brand) {
    score += 2;
  }

  if (base.category && candidate.category && base.category === candidate.category) {
    score += 1;
  }

  if (typeof candidate.rating === "number") {
    score += Math.min(candidate.rating / 5, 1);
  }

  return score;
}

export function getFallbackRelatedProducts(
  productId: number,
  limit = 4,
): RelatedProductsResponse | null {
  const baseProduct = RAW_FALLBACK_PRODUCTS.find((item) => item.id === productId);

  if (!baseProduct) {
    return null;
  }

  const candidates = RAW_FALLBACK_PRODUCTS.filter((item) => item.id !== productId).map((item) => ({
    product: item,
    score: scoreRelatedProduct(baseProduct, item),
  }));

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.product.name.localeCompare(b.product.name, "fr", { sensitivity: "base" });
  });

  const selected = candidates.slice(0, Math.max(limit, 0)).map(({ product }) => {
    const entry = buildEntry(product);
    return cloneProduct(entry.product);
  });

  return {
    productId,
    related: selected,
  } satisfies RelatedProductsResponse;
}

export function getFallbackComparison(ids: readonly string[]): ComparisonResponse | null {
  const normalizedIds = normalizeIds(ids);
  if (normalizedIds.length === 0) {
    return null;
  }

  const entries = normalizedIds
    .map((id) => RAW_FALLBACK_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is RawFallbackProduct => Boolean(product))
    .map((product) => buildEntry(product));

  if (entries.length === 0) {
    return null;
  }

  const summaryOffers = buildSummary(entries.flatMap((entry) => entry.offers));

  return {
    products: entries.map((entry) => ({
      product: cloneProduct(entry.product),
      offers: entry.offers.map((offer) => cloneDeal(offer)),
    })),
    summary: summaryOffers,
  };
}

export function getFallbackIds(): string[] {
  return RAW_FALLBACK_PRODUCTS.map((product) => String(product.id));
}
