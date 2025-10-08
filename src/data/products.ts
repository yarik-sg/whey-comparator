export type ProductType = 'whey' | 'creatine' | 'other';

export interface Price {
  amount: number | null;
  currency: string | null;
  formatted: string | null;
}

export interface Deal {
  id: string;
  title: string;
  vendor: string;
  price: Price;
  totalPrice?: Price | null;
  shippingCost?: number | null;
  shippingText?: string | null;
  inStock?: boolean | null;
  stockStatus?: string | null;
  link?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  bestPrice: boolean;
  isBestPrice?: boolean;
  source: string;
  productId?: number | null;
  expiresAt?: string | null;
  weightKg?: number | null;
  pricePerKg?: number | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  category?: string | null;
  flavor?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  price: number | null;
  bestPrice?: Price | null;
  totalPrice?: Price | null;
  bestDeal?: Deal | null;
  offersCount: number;
  inStock?: boolean | null;
  stockStatus?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  proteinPerEuro?: number | null;
  proteinPerServing?: number | null;
  servingSize?: number | null;
  pricePerKg?: number | null;
  bestVendor?: string | null;
  badges: string[];
  promotionEndsAt?: string | null;
  link?: string | null;
}

export interface RawPrice {
  amount?: number | string | null;
  currency?: string | null;
  formatted?: string | null;
}

export interface RawDeal {
  id?: string | null;
  title?: string | null;
  vendor?: string | null;
  price?: RawPrice | null;
  totalPrice?: RawPrice | null;
  shippingCost?: number | string | null;
  shippingText?: string | null;
  inStock?: boolean | null;
  stockStatus?: string | null;
  link?: string | null;
  image?: string | null;
  rating?: number | string | null;
  reviewsCount?: number | string | null;
  bestPrice?: boolean | null;
  isBestPrice?: boolean | null;
  source?: string | null;
  productId?: number | null;
  expiresAt?: string | null;
  weightKg?: number | string | null;
  pricePerKg?: number | string | null;
}

export interface RawProduct {
  id: number | string;
  name: string;
  brand?: string | null;
  flavour?: string | null;
  image?: string | null;
  image_url?: string | null;
  category?: string | null;
  protein_per_serving_g?: number | string | null;
  serving_size_g?: number | string | null;
  bestPrice?: RawPrice | null;
  totalPrice?: RawPrice | null;
  bestDeal?: RawDeal | null;
  offersCount?: number | string | null;
  inStock?: boolean | null;
  stockStatus?: string | null;
  rating?: number | string | null;
  reviewsCount?: number | string | null;
  proteinPerEuro?: number | string | null;
  pricePerKg?: number | string | null;
  bestVendor?: string | null;
  link?: string | null;
}

export interface ProductListResponse {
  products?: RawProduct[];
}

const parseNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePrice = (price?: RawPrice | null): Price | null => {
  if (!price) {
    return null;
  }

  return {
    amount: parseNullableNumber(price.amount),
    currency: typeof price.currency === 'string' ? price.currency : null,
    formatted: typeof price.formatted === 'string' ? price.formatted : null,
  };
};

export const normalizeDeal = (deal: RawDeal): Deal => {
  const price = normalizePrice(deal.price) ?? { amount: null, currency: null, formatted: null };
  const totalPrice = normalizePrice(deal.totalPrice);

  const ensureId = (value?: string | null) => {
    if (value && value.trim().length > 0) {
      return value;
    }

    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      try {
        return crypto.randomUUID();
      } catch (error) {
        // ignore and use fallback
      }
    }

    return `deal-${Math.random().toString(36).slice(2, 10)}`;
  };

  return {
    id: ensureId(deal.id),
    title: deal.title ?? 'Offre',
    vendor: deal.vendor ?? 'Marchand',
    price,
    totalPrice,
    shippingCost: parseNullableNumber(deal.shippingCost),
    shippingText: deal.shippingText ?? null,
    inStock: typeof deal.inStock === 'boolean' ? deal.inStock : null,
    stockStatus: deal.stockStatus ?? null,
    link: deal.link ?? null,
    image: deal.image ?? null,
    rating: parseNullableNumber(deal.rating),
    reviewsCount: parseNullableNumber(deal.reviewsCount),
    bestPrice: Boolean(deal.bestPrice ?? deal.isBestPrice ?? false),
    isBestPrice: Boolean(deal.isBestPrice ?? deal.bestPrice ?? false),
    source: deal.source ?? 'Catalogue',
    productId: deal.productId ?? null,
    expiresAt: deal.expiresAt ?? null,
    weightKg: parseNullableNumber(deal.weightKg),
    pricePerKg: parseNullableNumber(deal.pricePerKg),
  };
};

const toTitleCase = (value: string) =>
  value
    .split(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+/u)
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(' ');

export const inferProductType = (
  category?: string | null,
  name?: string | null,
  brand?: string | null,
): ProductType => {
  const reference = `${category ?? ''} ${name ?? ''} ${brand ?? ''}`.toLowerCase();

  if (reference.includes('creatine') || reference.includes('créatine')) {
    return 'creatine';
  }

  if (
    reference.includes('whey') ||
    reference.includes('isolate') ||
    reference.includes('protéine') ||
    reference.includes('protein')
  ) {
    return 'whey';
  }

  return 'other';
};

const buildBadges = (product: RawProduct, normalized: Product): string[] => {
  const badges = new Set<string>();

  if (product.category) {
    badges.add(toTitleCase(product.category));
  }

  if (normalized.bestVendor) {
    badges.add(normalized.bestVendor);
  }

  if (normalized.inStock === true) {
    badges.add('En stock');
  } else if (normalized.inStock === false) {
    badges.add('Rupture');
  }

  return Array.from(badges).slice(0, 3);
};

export const normalizeProduct = (product: RawProduct): Product => {
  const name = product.name?.trim() || 'Produit';
  const brand = product.brand?.trim() || 'Marque inconnue';
  const bestPrice = normalizePrice(product.bestPrice);
  const totalPrice = normalizePrice(product.totalPrice);
  const bestDeal = product.bestDeal ? normalizeDeal(product.bestDeal) : null;

  const imageUrl = product.image_url ?? product.image ?? bestDeal?.image ?? null;
  const price = totalPrice?.amount ?? bestPrice?.amount ?? null;
  const type = inferProductType(product.category, product.name, product.brand);

  const normalized: Product = {
    id: String(product.id),
    name,
    brand,
    type,
    category: product.category ?? null,
    flavor: product.flavour ?? null,
    imageUrl,
    imageAlt: `${brand} ${name}`.trim(),
    price,
    bestPrice,
    totalPrice,
    bestDeal,
    offersCount: Number.parseInt(String(product.offersCount ?? 0), 10) || 0,
    inStock: typeof product.inStock === 'boolean' ? product.inStock : null,
    stockStatus: product.stockStatus ?? null,
    rating: parseNullableNumber(product.rating),
    reviewsCount: parseNullableNumber(product.reviewsCount),
    proteinPerEuro: parseNullableNumber(product.proteinPerEuro),
    proteinPerServing: parseNullableNumber(product.protein_per_serving_g),
    servingSize: parseNullableNumber(product.serving_size_g),
    pricePerKg: parseNullableNumber(product.pricePerKg),
    bestVendor: product.bestVendor ?? bestDeal?.vendor ?? null,
    badges: [],
    promotionEndsAt: null,
    link: product.link ?? bestDeal?.link ?? null,
  };

  normalized.badges = buildBadges(product, normalized);

  return normalized;
};

export const ensurePrice = (price: Price | null | undefined, fallbackCurrency = 'EUR'): Price => ({
  amount: price?.amount ?? null,
  currency: price?.currency ?? fallbackCurrency,
  formatted: price?.formatted ?? null,
});
