import { NextRequest, NextResponse } from "next/server";

const FALLBACK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
const PRICE_REGEX = /(\d+[.,]\d{2})\s?€/;

interface CompareOffer {
  seller: string;
  price: number | null;
  old_price: number | null;
  url: string | null;
  shipping: string | null;
  delivery_time: string | null;
  rating: number | null;
  logo?: string | null;
  source?: string | null;
  image?: string | null;
}

interface CompareProductPayload {
  id: string;
  name: string;
  image: string;
  brand: string | null;
  description: string | null;
  rating: number | null;
  price: {
    min: number | null;
    max: number | null;
    avg: number | null;
  } | null;
  offers: CompareOffer[];
  history: Array<{ date: string; price: number | null }>;
}

interface NormalizedSerpOffer {
  offer: CompareOffer | null;
  image: string | null;
}

interface ScraperSnapshot {
  offer: CompareOffer | null;
  title: string | null;
  image: string | null;
}

function toCleanString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
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

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    return toNumber(value);
  }
  return null;
}

function dedupeOffers(offers: CompareOffer[]): CompareOffer[] {
  const seen = new Map<string, CompareOffer>();

  for (const offer of offers) {
    const sellerKey = offer.seller.trim().toLowerCase();
    const uniqueKey = offer.url ? `${sellerKey}::${offer.url}` : sellerKey;

    if (!seen.has(uniqueKey)) {
      seen.set(uniqueKey, offer);
      continue;
    }

    const current = seen.get(uniqueKey);
    if (!current) {
      continue;
    }

    const currentPrice = typeof current.price === "number" && Number.isFinite(current.price)
      ? current.price
      : Number.POSITIVE_INFINITY;
    const nextPrice = typeof offer.price === "number" && Number.isFinite(offer.price)
      ? offer.price
      : Number.POSITIVE_INFINITY;

    if (nextPrice < currentPrice) {
      seen.set(uniqueKey, offer);
    }
  }

  return Array.from(seen.values());
}

function sortOffersByPrice(offers: CompareOffer[]): CompareOffer[] {
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

function summarizePrices(offers: CompareOffer[]): CompareProductPayload["price"] {
  const values = offers
    .map((offer) => (typeof offer.price === "number" && Number.isFinite(offer.price) ? offer.price : null))
    .filter((price): price is number => price !== null);

  if (values.length === 0) {
    return { min: null, max: null, avg: null };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    min: Number.parseFloat(min.toFixed(2)),
    max: Number.parseFloat(max.toFixed(2)),
    avg: Number.parseFloat(avg.toFixed(2)),
  };
}

function resolveImageSource(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return FALLBACK_IMAGE;
}

function normalizeSerpOffer(entry: Record<string, unknown>): NormalizedSerpOffer {
  const record = entry as Record<string, unknown>;
  const seller = toCleanString(record["source"])
    ?? toCleanString(record["store"])
    ?? toCleanString(record["merchant"])
    ?? toCleanString(record["vendor"]);
  const url = toCleanString(record["product_link"]) ?? toCleanString(record["link"]) ?? toCleanString(record["serpapi_product_link"]);
  const image = toCleanString(record["thumbnail"]) ?? toCleanString(record["image"]);

  if (!seller || !url) {
    return { offer: null, image };
  }

  const price = parsePrice(record["extracted_price"] ?? record["price"]);
  const oldPrice = parsePrice(record["extracted_previous_price"] ?? record["previous_price"]);
  const shipping = toCleanString(record["shipping"]) ?? toCleanString(record["shipping_cost"]);
  const delivery = toCleanString(record["delivery"]) ?? toCleanString(record["delivery_time"]);
  const rating = toNumber(record["rating"]);

  return {
    offer: {
      seller,
      price,
      old_price: oldPrice,
      url,
      shipping: shipping ?? null,
      delivery_time: delivery ?? null,
      rating,
      logo: null,
      source: "SerpAPI",
      image,
    },
    image,
  };
}

function escapeMetaKey(key: string): string {
  return key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(html: string, attribute: "name" | "property", key: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+${attribute}=["']${escapeMetaKey(key)}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractPriceFromHtml(html: string): number | null {
  const match = html.match(PRICE_REGEX);
  if (!match) {
    return null;
  }
  return Number.parseFloat(match[1].replace(/,/g, "."));
}

function resolveSellerLabel(url: string | null, fallbackBrand: string | null): string | null {
  if (fallbackBrand) {
    return fallbackBrand;
  }
  if (!url) {
    return null;
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return host || null;
  } catch {
    return null;
  }
}

async function fetchSerpOffers(query: string): Promise<{ offers: CompareOffer[]; image: string | null }> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn("compareRoute.serp", "Missing SERPAPI_KEY environment variable");
    return { offers: [], image: null };
  }

  const url = `https://serpapi.com/search.json?engine=google_shopping&gl=fr&hl=fr&num=20&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.warn("compareRoute.serp", `Request failed with status ${response.status}`);
      return { offers: [], image: null };
    }

    const payload = (await response.json()) as { shopping_results?: Array<Record<string, unknown>> };
    const results = Array.isArray(payload.shopping_results) ? payload.shopping_results : [];

    const offers: CompareOffer[] = [];
    let fallbackImage: string | null = null;

    for (const entry of results) {
      const normalized = normalizeSerpOffer(entry);
      if (normalized.offer) {
        offers.push(normalized.offer);
      }
      if (!fallbackImage && normalized.image) {
        fallbackImage = normalized.image;
      }
    }

    return { offers, image: fallbackImage };
  } catch (error) {
    console.warn("compareRoute.serp", error);
    return { offers: [], image: null };
  }
}

async function fetchScraperSnapshot(productUrl: string | null, brand: string | null): Promise<ScraperSnapshot> {
  const apiKey = process.env.SCRAPERAPI_KEY;
  if (!productUrl || !apiKey) {
    if (!apiKey) {
      console.warn("compareRoute.scraper", "Missing SCRAPERAPI_KEY environment variable");
    }
    return { offer: null, title: null, image: null };
  }

  const url = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(productUrl)}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.warn("compareRoute.scraper", `Request failed with status ${response.status}`);
      return { offer: null, title: null, image: null };
    }

    const html = await response.text();
    const price = extractPriceFromHtml(html);
    const title = extractMetaContent(html, "property", "og:title")
      ?? extractMetaContent(html, "name", "title")
      ?? extractTitleFromHtml(html);
    const image = extractMetaContent(html, "property", "og:image")
      ?? extractMetaContent(html, "name", "twitter:image");
    const seller = resolveSellerLabel(productUrl, brand);

    const offer = price !== null && seller
      ? {
          seller,
          price,
          old_price: null,
          url: productUrl,
          shipping: null,
          delivery_time: null,
          rating: null,
          logo: null,
          source: "ScraperAPI",
          image,
        }
      : null;

    return { offer, title: title ?? null, image: image ?? null };
  } catch (error) {
    console.warn("compareRoute.scraper", error);
    return { offer: null, title: null, image: null };
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = toCleanString(url.searchParams.get("q"));
  const imageParam = toCleanString(url.searchParams.get("img"));
  const brandParam = toCleanString(url.searchParams.get("brand"));
  const productUrl = toCleanString(url.searchParams.get("url"));

  if (!query) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  try {
    const [serpResult, scraperResult] = await Promise.all([
      fetchSerpOffers(query),
      fetchScraperSnapshot(productUrl, brandParam),
    ]);

    const mergedOffers = dedupeOffers([
      ...serpResult.offers,
      ...(scraperResult.offer ? [scraperResult.offer] : []),
    ]);
    const sortedOffers = sortOffersByPrice(mergedOffers);

    const payload: CompareProductPayload = {
      id: query,
      name: scraperResult.title ?? query,
      image: resolveImageSource(imageParam, scraperResult.image, serpResult.image),
      brand: brandParam ?? null,
      description: null,
      rating: sortedOffers.find((offer) => typeof offer.rating === "number" && Number.isFinite(offer.rating))?.rating ?? null,
      price: sortedOffers.length > 0 ? summarizePrices(sortedOffers) : { min: null, max: null, avg: null },
      offers: sortedOffers,
      history: [],
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("compareRoute.get", error);
    const fallback: CompareProductPayload = {
      id: query,
      name: query,
      image: resolveImageSource(imageParam),
      brand: brandParam ?? null,
      description: null,
      rating: null,
      price: { min: null, max: null, avg: null },
      offers: [],
      history: [],
    };

    return NextResponse.json(fallback, { status: 200 });
  }
}
