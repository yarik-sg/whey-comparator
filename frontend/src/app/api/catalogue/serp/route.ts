import { NextResponse } from "next/server";

import type { ApiPrice, DealItem } from "@/types/api";

export const dynamic = "force-dynamic";

const EURO_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const MAX_RESULTS = 24;
const SERP_ENDPOINT = "https://serpapi.com/search.json";

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const match = value.match(/-?[0-9][0-9.,\s]*/);
  if (!match) {
    return null;
  }
  const normalized = match[0].replace(/\s+/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return null;
  }
  const rounded = Math.round(parsed);
  return Number.isFinite(rounded) ? rounded : null;
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().toUpperCase();
  }
  return null;
}

function buildPricePayload(item: Record<string, unknown>): ApiPrice {
  const extracted = parseNumber(item.extracted_price);
  const amount = extracted ?? parseNumber(item.price);
  const currency = normalizeCurrency(item.currency) ?? "EUR";
  const formatted =
    typeof item.price === "string" && item.price.trim().length > 0
      ? item.price.trim()
      : amount !== null
        ? EURO_FORMATTER.format(amount)
        : null;

  return {
    amount,
    currency: amount !== null ? currency : null,
    formatted,
  };
}

function parseShippingCost(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    if (normalized.includes("gratuit")) {
      return 0;
    }
    return parseNumber(value);
  }
  return null;
}

function normalizeLink(link: unknown): string | null {
  if (typeof link !== "string") {
    return null;
  }
  const trimmed = link.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    const redirect = url.searchParams.get("url");
    if (redirect) {
      try {
        const redirected = new URL(redirect);
        if (redirected.protocol === "http:" || redirected.protocol === "https:") {
          return redirected.toString();
        }
      } catch {
        return url.toString();
      }
    }
    return url.toString();
  } catch {
    return null;
  }
}

function extractWeightKg(text: string): number | null {
  const normalized = text.toLowerCase();
  const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)\b/);
  if (!match) {
    return null;
  }
  const value = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value)) {
    return null;
  }
  const unit = match[2];
  switch (unit) {
    case "kg":
    case "l":
      return value;
    case "g":
    case "ml":
      return value / 1000;
    default:
      return null;
  }
}

function parseAvailability(value: unknown): { inStock: boolean | null; text: string | null } {
  if (typeof value !== "string") {
    return { inStock: null, text: null };
  }
  const text = value.trim();
  if (!text) {
    return { inStock: null, text: null };
  }
  const normalized = text.toLowerCase();
  if (/(rupture|indisponible|épuisé|épuisée)/.test(normalized)) {
    return { inStock: false, text };
  }
  if (/(stock|disponible|available|livraison rapide)/.test(normalized)) {
    return { inStock: true, text };
  }
  return { inStock: null, text };
}

function pickImage(item: Record<string, unknown>): string | null {
  const candidates: unknown[] = [item.thumbnail, item.image];

  const photos = item.product_photos;
  if (Array.isArray(photos)) {
    for (const photo of photos) {
      if (photo && typeof photo === "object") {
        const photoRecord = photo as Record<string, unknown>;
        candidates.push(photoRecord.link, photoRecord.image, photoRecord.thumbnail, photoRecord.source);
      }
    }
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate;
    }
  }

  return null;
}

function buildDealFromShoppingResult(item: Record<string, unknown>): DealItem | null {
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!title) {
    return null;
  }

  const vendor =
    (typeof item.source === "string" && item.source.trim()) ||
    (typeof item.merchant === "string" && item.merchant.trim()) ||
    "Marchand";

  const price = buildPricePayload(item);
  if (price.amount === null && !price.formatted) {
    return null;
  }

  const { inStock, text: stockStatus } = parseAvailability(item.availability ?? item.delivery);
  const shippingText =
    typeof item.shipping === "string" && item.shipping.trim().length > 0 ? item.shipping.trim() : null;
  const shippingCost = parseShippingCost(item.shipping ?? item.shipping_cost);
  const link = normalizeLink(item.product_link ?? item.link);
  const image = pickImage(item);
  const rating = parseNumber(item.rating);
  const reviewsCount = parseInteger(item.reviews);

  const weightKg = extractWeightKg(title);
  const pricePerKg =
    price.amount !== null && weightKg ? Number.parseFloat((price.amount / weightKg).toFixed(2)) : null;

  const rawProductId = typeof item.product_id === "string" ? item.product_id : String(item.product_id ?? "");
  const numericProductId = Number.parseInt(rawProductId, 10);
  const productId = Number.isFinite(numericProductId) ? numericProductId : null;

  const dealId = productId !== null ? `serp-${productId}` : `serp-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return {
    id: dealId,
    title,
    vendor,
    price,
    totalPrice: price,
    shippingCost,
    shippingText,
    inStock,
    stockStatus,
    link,
    image,
    rating,
    reviewsCount,
    bestPrice: false,
    isBestPrice: false,
    source: "Google Shopping (SerpAPI)",
    productId,
    expiresAt: null,
    weightKg,
    pricePerKg,
  };
}

async function querySerpApi(query: string, limit: number, apiKey: string) {
  const url = new URL(SERP_ENDPOINT);
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "fr");
  url.searchParams.set("gl", "fr");
  url.searchParams.set("num", String(Math.min(Math.max(limit * 3, limit), MAX_RESULTS)));
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "whey-comparator-catalogue/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await response.text();
    throw new Error(`SerpAPI request failed with status ${response.status}`);
  }

  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limitParam = searchParams.get("limit");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Missing 'q' query parameter" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const limitParsed = limitParam ? Number.parseInt(limitParam, 10) : NaN;
  const limit = Number.isFinite(limitParsed) ? Math.min(Math.max(limitParsed, 1), MAX_RESULTS) : 12;

  const apiKey = process.env.SERPAPI_KEY ?? process.env.NEXT_PUBLIC_SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SerpAPI key is not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const payload = await querySerpApi(query, limit, apiKey);

    if (payload && typeof payload === "object" && "error" in payload) {
      return NextResponse.json(
        { error: String(payload.error ?? "SerpAPI error") },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const shoppingResults = Array.isArray(payload?.shopping_results) ? payload.shopping_results : [];

    const mapped: DealItem[] = [];
    const seen = new Set<string>();

    for (const rawItem of shoppingResults) {
      if (!rawItem || typeof rawItem !== "object") {
        continue;
      }

      const deal = buildDealFromShoppingResult(rawItem as Record<string, unknown>);
      if (!deal) {
        continue;
      }

      const dedupeKey = `${deal.vendor.toLowerCase()}|${deal.title.toLowerCase()}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      mapped.push(deal);
    }

    mapped.sort((a, b) => {
      const priceA = a.price.amount ?? Number.POSITIVE_INFINITY;
      const priceB = b.price.amount ?? Number.POSITIVE_INFINITY;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      const reviewsA = a.reviewsCount ?? 0;
      const reviewsB = b.reviewsCount ?? 0;
      if (reviewsA !== reviewsB) {
        return reviewsB - reviewsA;
      }
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    const limited = mapped.slice(0, limit).map((deal, index) => ({
      ...deal,
      bestPrice: index === 0,
      isBestPrice: index === 0,
    }));

    return NextResponse.json(limited, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load SerpAPI promotions";
    return NextResponse.json(
      { error: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
