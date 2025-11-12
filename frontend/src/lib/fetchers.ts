import type { ProductOffer } from "@/lib/productFetcher";

const SCRAPER_TARGET_URLS = [
  (query: string) => `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`,
  (query: string) => `https://www.cdiscount.com/search/10/${encodeURIComponent(query)}.html`,
  (query: string) => `https://www.decathlon.fr/search?Ntt=${encodeURIComponent(query)}`,
  (query: string) => `https://www.bulk.com/fr/search/?q=${encodeURIComponent(query)}`,
  (query: string) => `https://www.alltricks.fr/Search?q=${encodeURIComponent(query)}`,
];

function buildLogoUrl(hostname: string): string {
  return `https://logo.clearbit.com/${hostname}`;
}

export async function fetchScrapedOffers(query: string): Promise<ProductOffer[]> {
  if (!process.env.SCRAPER_API_KEY) {
    return [];
  }

  const normalizedQuery = query?.trim();
  if (!normalizedQuery) {
    return [];
  }

  try {
    const targetUrls = SCRAPER_TARGET_URLS.map((builder) => builder(normalizedQuery));

    const results: ProductOffer[] = [];

    for (const url of targetUrls) {
      try {
        const apiUrl = `https://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          continue;
        }

        const html = await response.text();
        const match = html.match(/(\d+,\d+)\s?€/);
        if (!match) {
          continue;
        }

        const price = Number.parseFloat(match[1].replace(",", "."));
        if (!Number.isFinite(price)) {
          continue;
        }

        const hostname = new URL(url).hostname.replace(/^www\./, "");
        const logo = buildLogoUrl(hostname);

        results.push({
          seller: hostname,
          price,
          old_price: null,
          url,
          shipping: "Voir site marchand",
          delivery_time: "Variable",
          rating: null,
          logo,
          source: "ScraperAPI",
          image: logo,
        });
      } catch (error) {
        console.error("fetchScrapedOffers iteration error:", error);
      }
    }

    return results;
  } catch (error) {
    console.error("fetchScrapedOffers error:", error);
    return [];
  }
}
