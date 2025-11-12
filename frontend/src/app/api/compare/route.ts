import { NextRequest, NextResponse } from "next/server";

import type {
  ProductData,
  ProductOffer,
  ProductHistoryEntry,
  ProductPriceSummary,
} from "@/lib/productFetcher";
import { getProductData } from "@/lib/productFetcher";

const FALLBACK_IMAGE = "/no-image.png";

function buildFallbackOffers(query: string): ProductOffer[] {
  const encodedQuery = encodeURIComponent(query || "produit");
  const offerTemplates: Array<Omit<ProductOffer, "price" | "old_price"> & { price: number; old_price: number }> = [
    {
      seller: "Amazon",
      price: 31.99,
      old_price: 36.99,
      url: `https://www.amazon.fr/s?k=${encodedQuery}`,
      shipping: "Livraison Prime éligible",
      delivery_time: "24-48h",
      rating: 4.7,
      logo: "https://logo.clearbit.com/amazon.fr",
      source: "Simulation",
      image: "https://logo.clearbit.com/amazon.fr",
    },
    {
      seller: "Decathlon",
      price: 33.49,
      old_price: 38.99,
      url: `https://www.decathlon.fr/search?Ntt=${encodedQuery}`,
      shipping: "Retrait 1h magasin",
      delivery_time: "2-3 jours",
      rating: 4.6,
      logo: "https://logo.clearbit.com/decathlon.fr",
      source: "Simulation",
      image: "https://logo.clearbit.com/decathlon.fr",
    },
    {
      seller: "Cdiscount",
      price: 30.99,
      old_price: 35.99,
      url: `https://www.cdiscount.com/search/10/${encodedQuery}.html`,
      shipping: "Dès 3,99€",
      delivery_time: "3-5 jours",
      rating: 4.3,
      logo: "https://logo.clearbit.com/cdiscount.com",
      source: "Simulation",
      image: "https://logo.clearbit.com/cdiscount.com",
    },
    {
      seller: "GO Sport",
      price: 34.49,
      old_price: 39.99,
      url: `https://www.go-sport.com/search?q=${encodedQuery}`,
      shipping: "Offert dès 60€",
      delivery_time: "3-4 jours",
      rating: 4.2,
      logo: "https://logo.clearbit.com/go-sport.com",
      source: "Simulation",
      image: "https://logo.clearbit.com/go-sport.com",
    },
    {
      seller: "Fnac",
      price: 35.99,
      old_price: 41.99,
      url: `https://www.fnac.com/SearchResult/ResultList.aspx?SCat=0%211&Search=${encodedQuery}`,
      shipping: "Retrait 1h magasin",
      delivery_time: "2-4 jours",
      rating: 4.4,
      logo: "https://logo.clearbit.com/fnac.com",
      source: "Simulation",
      image: "https://logo.clearbit.com/fnac.com",
    },
  ];

  return offerTemplates.map((offer) => ({
    ...offer,
    price: Number.parseFloat(offer.price.toFixed(2)),
    old_price: Number.parseFloat(offer.old_price.toFixed(2)),
  }));
}

function buildFallbackHistory(basePrice: number): ProductHistoryEntry[] {
  const entries: ProductHistoryEntry[] = [];
  const now = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const snapshot = new Date(now);
    snapshot.setDate(now.getDate() - index * 7);
    const variation = (index - 3) * 0.6;
    const price = Number.parseFloat((basePrice + variation).toFixed(2));
    entries.push({ date: snapshot.toISOString(), price });
  }

  return entries;
}

function buildFallbackProduct(id: string, query: string): ProductData {
  const normalizedId = id.trim() || "produit";
  const basePrice = 32.99;
  const offers = buildFallbackOffers(query || normalizedId);

  return {
    id: normalizedId,
    name: "Produit indisponible",
    image: FALLBACK_IMAGE,
    brand: null,
    description: "Comparaison générée automatiquement (mode secours).",
    rating: null,
    price: {
      min: 30.99,
      max: 35.99,
      avg: Number.parseFloat(basePrice.toFixed(2)),
    },
    offers,
    history: buildFallbackHistory(basePrice),
  };
}

function isSimulatedOffer(offer: ProductOffer): boolean {
  const source = offer.source?.toLowerCase() ?? "";
  if (source.includes("simulation")) {
    return true;
  }

  const seller = offer.seller.trim().toLowerCase();
  return seller.startsWith("boutique partenaire") || seller.includes("simulation");
}

function sortOffersByPrice(offers: ProductOffer[]): ProductOffer[] {
  return [...offers].sort((a, b) => {
    const priceA = typeof a.price === "number" && Number.isFinite(a.price)
      ? a.price
      : Number.POSITIVE_INFINITY;
    const priceB = typeof b.price === "number" && Number.isFinite(b.price)
      ? b.price
      : Number.POSITIVE_INFINITY;

    if (priceA !== priceB) {
      return priceA - priceB;
    }

    const ratingA = typeof a.rating === "number" && Number.isFinite(a.rating) ? a.rating : -1;
    const ratingB = typeof b.rating === "number" && Number.isFinite(b.rating) ? b.rating : -1;
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }

    return a.seller.localeCompare(b.seller, "fr", { sensitivity: "base" });
  });
}

function toPriceSummary(
  offers: ProductOffer[],
  fallback: ProductPriceSummary | null | undefined,
): ProductPriceSummary {
  const values: number[] = offers
    .map((offer) => (typeof offer.price === "number" && Number.isFinite(offer.price) ? offer.price : null))
    .filter((price): price is number => price !== null);

  if (values.length > 0) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const total = values.reduce((sum, value) => sum + value, 0);
    const avg = total / values.length;

    return {
      min: Number.parseFloat(min.toFixed(2)),
      max: Number.parseFloat(max.toFixed(2)),
      avg: Number.parseFloat(avg.toFixed(2)),
    };
  }

  const fallbackValues = [fallback?.min, fallback?.max, fallback?.avg]
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (fallbackValues.length > 0 && fallback) {
    return {
      min: typeof fallback.min === "number" && Number.isFinite(fallback.min)
        ? Number.parseFloat(fallback.min.toFixed(2))
        : null,
      max: typeof fallback.max === "number" && Number.isFinite(fallback.max)
        ? Number.parseFloat(fallback.max.toFixed(2))
        : null,
      avg: typeof fallback.avg === "number" && Number.isFinite(fallback.avg)
        ? Number.parseFloat(fallback.avg.toFixed(2))
        : null,
    };
  }

  return { min: null, max: null, avg: null };
}

function resolveProductImage(product: ProductData, offers: ProductOffer[]): string {
  if (product.image && product.image.trim() && product.image !== FALLBACK_IMAGE) {
    return product.image;
  }

  const candidate = offers.find((offer) => typeof offer.image === "string" && offer.image.trim().length > 0);
  if (candidate?.image) {
    return candidate.image;
  }

  return FALLBACK_IMAGE;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get("id")?.trim();

  if (!rawId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const query = url.searchParams.get("q")?.trim();

  try {
    const product = await getProductData(rawId, { query: query ?? undefined });

    const realOffers = sortOffersByPrice(
      (product.offers ?? []).filter((offer) => offer && !isSimulatedOffer(offer)),
    );

    if (realOffers.length === 0) {
      const fallback = buildFallbackProduct(rawId, query ?? rawId);
      return NextResponse.json(fallback, { status: 200 });
    }

    const priceSummary = toPriceSummary(realOffers, product.price);
    const rating = typeof product.rating === "number" && Number.isFinite(product.rating)
      ? product.rating
      : realOffers.find((offer) => typeof offer.rating === "number" && Number.isFinite(offer.rating))?.rating
        ?? null;

    const enrichedProduct: ProductData = {
      ...product,
      image: resolveProductImage(product, realOffers),
      rating,
      price: priceSummary,
      offers: realOffers,
    };

    return NextResponse.json(enrichedProduct);
  } catch (error) {
    console.error("compareRoute.get", error);
    const fallback = buildFallbackProduct(rawId, query ?? rawId);
    return NextResponse.json(fallback, { status: 200 });
  }
}
