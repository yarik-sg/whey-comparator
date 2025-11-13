import { NextRequest, NextResponse } from "next/server";

import apiClient from "@/lib/apiClient";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

interface BackendOffer {
  seller: string;
  title?: string | null;
  price?: number | null;
  price_text?: string | null;
  url?: string | null;
  image?: string | null;
  rating?: number | null;
  reviews?: number | null;
  source?: string | null;
}

interface BackendCompareResponse {
  query: string;
  product: {
    name: string;
    brand?: string | null;
    image?: string | null;
    url?: string | null;
  };
  price_stats?: {
    min: number | null;
    max: number | null;
    avg: number | null;
  } | null;
  offers: BackendOffer[];
  history: Array<{ date: string; price: number | null }>;
}

interface CompareOffer {
  title: string;
  seller: string;
  price: number | null;
  priceText: string | null;
  link: string | null;
  source: string | null;
  thumbnail: string | null;
  rating: number | null;
}

interface PriceHistoryEntry {
  date: string;
  price: number | null;
}

interface CompareProductResponse {
  name: string;
  image: string | null;
  brand: string | null;
  description: string | null;
  rating: number | null;
  price: {
    min: number | null;
    max: number | null;
    avg: number | null;
  } | null;
  offers: CompareOffer[];
  history: PriceHistoryEntry[];
}

function formatPrice(value: number | null | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return priceFormatter.format(value);
  }
  return null;
}

function mapOffers(offers: BackendOffer[], fallbackTitle: string): CompareOffer[] {
  return offers.map((offer) => ({
    title: offer.title?.trim() || fallbackTitle,
    seller: offer.seller?.trim() || fallbackTitle,
    price: typeof offer.price === "number" ? offer.price : null,
    priceText: offer.price_text?.trim() || formatPrice(offer.price ?? null),
    link: offer.url ?? null,
    source: offer.source ?? offer.seller ?? null,
    thumbnail: offer.image ?? null,
    rating: typeof offer.rating === "number" ? offer.rating : null,
  }));
}

function ensurePriceSummary(
  summary: BackendCompareResponse["price_stats"],
  offers: CompareOffer[],
): CompareProductResponse["price"] {
  if (summary) {
    return {
      min: summary.min ?? null,
      max: summary.max ?? null,
      avg: summary.avg ?? null,
    };
  }

  const numericPrices = offers
    .map((offer) => offer.price)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price));

  if (numericPrices.length === 0) {
    return { min: null, max: null, avg: null };
  }

  const min = Math.min(...numericPrices);
  const max = Math.max(...numericPrices);
  const avg = Number.parseFloat((numericPrices.reduce((sum, value) => sum + value, 0) / numericPrices.length).toFixed(2));

  return { min, max, avg };
}

function normalizeHistory(history: BackendCompareResponse["history"]): PriceHistoryEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      if (typeof entry.date !== "string") {
        return null;
      }
      return {
        date: entry.date,
        price: typeof entry.price === "number" && Number.isFinite(entry.price) ? entry.price : null,
      } satisfies PriceHistoryEntry;
    })
    .filter((entry): entry is PriceHistoryEntry => Boolean(entry))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function pickRating(offers: BackendOffer[]): number | null {
  for (const offer of offers) {
    if (typeof offer.rating === "number" && Number.isFinite(offer.rating)) {
      return offer.rating;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const image = searchParams.get("img")?.trim() ?? searchParams.get("image")?.trim() ?? null;
  const brand = searchParams.get("brand")?.trim() ?? searchParams.get("marque")?.trim() ?? null;
  const productUrl = searchParams.get("url")?.trim() ?? null;
  const descriptionParam = searchParams.get("description")?.trim()
    ?? searchParams.get("desc")?.trim()
    ?? null;

  if (!query) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  try {
    const data = await apiClient.get<BackendCompareResponse>("/compare", {
      query: {
        q: query,
        brand: brand ?? undefined,
        img: image ?? undefined,
        url: productUrl ?? undefined,
      },
      cache: "no-store",
    });

    const backend = data;
    const productName = backend.product?.name?.trim() || query;
    const resolvedOffers = mapOffers(backend.offers ?? [], productName);
    const price = ensurePriceSummary(backend.price_stats ?? null, resolvedOffers);
    const history = normalizeHistory(backend.history ?? []);
    const rating = pickRating(backend.offers ?? []);
    const imageSource = backend.product?.image ?? image ?? null;
    const brandSource = backend.product?.brand ?? brand ?? null;
    const description = descriptionParam ?? `Historique des offres pour « ${productName} ».`;

    const responsePayload: CompareProductResponse = {
      name: productName,
      image: imageSource,
      brand: brandSource,
      description,
      rating,
      price,
      offers: resolvedOffers,
      history,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("compareRoute.error", error);
    return NextResponse.json(
      { error: "Impossible de comparer ce produit pour le moment." },
      { status: 502 },
    );
  }
}
