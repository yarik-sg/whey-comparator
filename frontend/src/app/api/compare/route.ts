import { NextRequest, NextResponse } from "next/server";

import {
  type CompareResponse,
  type NormalizedOffer,
  handleCompareDetailRequest,
} from "../proxy/route";

type PriceStats = {
  min: number | null;
  max: number | null;
  average: number | null;
};

type CompareApiResponse = {
  id: string;
  name: string;
  image: string | null;
  brand: string | null;
  description: string | null;
  rating: number | null;
  price: {
    min: number | null;
    max: number | null;
    avg: number | null;
  };
  offers: NormalizedOffer[];
  history: Array<{ date: string; price: number | null }>;
};

function computePriceStats(offers: NormalizedOffer[], basePrice: number | null): PriceStats {
  const candidatePrices: number[] = [];

  for (const offer of offers) {
    if (typeof offer.price === "number" && Number.isFinite(offer.price)) {
      candidatePrices.push(offer.price);
    }
  }

  if (typeof basePrice === "number" && Number.isFinite(basePrice)) {
    candidatePrices.push(basePrice);
  }

  if (candidatePrices.length === 0) {
    return {
      min: null,
      max: null,
      average: null,
    };
  }

  const min = Math.min(...candidatePrices);
  const max = Math.max(...candidatePrices);
  const total = candidatePrices.reduce((sum, value) => sum + value, 0);
  const average = total / candidatePrices.length;

  return { min, max, average };
}

function normaliseHistory(
  history: CompareResponse["price_history"],
): Array<{ date: string; price: number | null }> {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const { date, price } = entry as { date?: unknown; price?: unknown };
      if (typeof date !== "string" || date.trim().length === 0) {
        return null;
      }

      if (typeof price === "number" && Number.isFinite(price)) {
        return { date, price };
      }

      return { date, price: null };
    })
    .filter((entry): entry is { date: string; price: number | null } => Boolean(entry))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get("id")?.trim();

  if (!rawId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const response = await handleCompareDetailRequest(url);
  if (!response.ok) {
    return response;
  }

  const payload = (await response.json()) as CompareResponse;

  const priceStats = computePriceStats(payload.offers ?? [], payload.base_price ?? null);
  const normalizedHistory = normaliseHistory(payload.price_history);

  const body: CompareApiResponse = {
    id: payload.id,
    name: payload.name,
    image: payload.image ?? null,
    brand: payload.brand ?? null,
    description: payload.description ?? null,
    rating: payload.rating ?? null,
    price: {
      min: priceStats.min,
      max: priceStats.max,
      avg: priceStats.average,
    },
    offers: Array.isArray(payload.offers) ? payload.offers : [],
    history: normalizedHistory,
  };

  return NextResponse.json(body);
}
