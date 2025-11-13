import { NextRequest, NextResponse } from "next/server";

interface Offer {
  seller: string;
  price: number | null;
  url?: string;
  image?: string;
  rating?: number;
  logo?: string;
}

interface PriceSummary {
  min: number | null;
  max: number | null;
  avg: number | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const img = searchParams.get("img")?.trim() || undefined;

  if (!query) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const offers: Offer[] = [];

  if (process.env.SERPAPI_KEY) {
    try {
      const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&gl=fr&hl=fr&num=15&q=${encodeURIComponent(
        query,
      )}&api_key=${process.env.SERPAPI_KEY}`;
      const serpRes = await fetch(serpUrl, { cache: "no-store" });
      if (serpRes.ok) {
        const serpData = await serpRes.json();
        const mappedOffers: Offer[] =
          serpData.shopping_results?.map((p: any) => ({
            seller: p.source || p.store || "Marchand inconnu",
            price:
              p.extracted_price ??
              parseFloat(p.price?.replace(/[^\d.,]/g, "").replace(",", ".") || "0") ?? null,
            url: p.link || p.product_link,
            image: p.thumbnail || p.product_link,
            rating: p.rating,
            logo: `https://logo.clearbit.com/${(p.source || "google.com").replace(/\s+/g, "")}`,
          })) || [];
        offers.push(...mappedOffers.filter((offer) => offer.seller && offer.url));
      }
    } catch (error) {
      console.warn("compareRoute.serp", error);
    }
  }

  if (process.env.SCRAPERAPI_KEY) {
    try {
      const scrapeUrl = `https://api.scraperapi.com?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(
        "https://www.amazon.fr/s?k=" + query,
      )}`;
      const scrapeRes = await fetch(scrapeUrl, { cache: "no-store" });
      if (scrapeRes.ok) {
        const html = await scrapeRes.text();
        const match = html.match(/(\d+[.,]\d{2})\s?€/);
        if (match) {
          offers.push({
            seller: "Amazon",
            price: parseFloat(match[1].replace(",", ".")),
            url: `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`,
            image: "https://logo.clearbit.com/amazon.fr",
            logo: "https://logo.clearbit.com/amazon.fr",
          });
        }
      }
    } catch (error) {
      console.warn("compareRoute.scraper", error);
    }
  }

  const validPrices = offers
    .filter((o) => typeof o.price === "number" && !Number.isNaN(o.price))
    .map((o) => o.price as number);

  const price: PriceSummary = validPrices.length
    ? {
        min: Math.min(...validPrices),
        max: Math.max(...validPrices),
        avg: parseFloat((validPrices.reduce((a, b) => a + b, 0) / validPrices.length).toFixed(2)),
      }
    : { min: null, max: null, avg: null };

  const history = validPrices.length
    ? Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 7 * 86400000).toISOString(),
        price: parseFloat((((price.avg ?? 0) + (Math.random() - 0.5) * 3).toFixed(2))),
      }))
    : [];

  const sortedOffers = offers.sort((a, b) => ((a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY)));

  return NextResponse.json({
    id: query,
    name: query,
    image: img || "/no-image.png",
    price,
    offers: sortedOffers,
    history,
  });
}
