import { NextRequest, NextResponse } from "next/server";

import type { ProductData, ProductOffer, ProductHistoryEntry } from "@/lib/productFetcher";
import { getProductData } from "@/lib/productFetcher";

const FALLBACK_IMAGE = "/no-image.png";

function buildFallbackOffers(query: string): ProductOffer[] {
  const encodedQuery = encodeURIComponent(query || "produit");
  const offerTemplates: Array<Omit<ProductOffer, "price" | "old_price"> & { price: number; old_price: number }>> = [
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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get("id")?.trim();

  if (!rawId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const query = url.searchParams.get("q")?.trim();

  try {
    const product = await getProductData(rawId, { query: query ?? undefined });
    return NextResponse.json(product);
  } catch (error) {
    console.error("compareRoute.get", error);
    const fallback = buildFallbackProduct(rawId, query ?? rawId);
    return NextResponse.json(fallback, { status: 200 });
  }
}
