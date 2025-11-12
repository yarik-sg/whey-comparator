import Image from "next/image";
import Link from "next/link";
import PriceHistoryChart from "./PriceHistoryChart";

const CTA_BUTTON_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6600] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#e65a00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6600]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]";
const CARD_BASE_CLASSES =
  "rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-sm";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

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

type PriceHistoryEntry = {
  date: string;
  price: number | null;
};

type PriceStats = {
  min: number | null;
  max: number | null;
  average: number | null;
};

interface CompareProductResponse {
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
  history: PriceHistoryEntry[];
}

const VENDOR_LOGOS: Record<string, string> = {
  amazon: "https://logo.clearbit.com/amazon.fr",
  decathlon: "https://logo.clearbit.com/decathlon.fr",
  myprotein: "https://logo.clearbit.com/myprotein.com",
  cdiscount: "https://logo.clearbit.com/cdiscount.com",
  google: "https://logo.clearbit.com/google.com",
  "google shopping": "https://logo.clearbit.com/google.com",
};

function resolveBaseUrl() {
  const envBase =
    process.env.INTERNAL_PROXY_BASE_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || process.env.APP_URL
    || process.env.VERCEL_URL
    || null;

  if (envBase) {
    const normalized = envBase.replace(/\/$/, "");
    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }
    return `https://${normalized}`;
  }

  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

async function fetchComparisonProduct(productId: string): Promise<CompareProductResponse | null> {
  const baseUrl = resolveBaseUrl();
  const url = new URL("/api/compare", baseUrl);
  url.searchParams.set("id", productId);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CompareProductResponse;
    return data;
  } catch {
    return null;
  }
}

function formatCurrency(value: number | null): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return priceFormatter.format(value);
  }
  return "—";
}

function computePriceStats(offers: CompareOffer[], basePrice: number | null): PriceStats {
  const candidatePrices = offers
    .map((offer) => offer.price)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price));

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
  const average = candidatePrices.reduce((sum, value) => sum + value, 0) / candidatePrices.length;

  return { min, max, average };
}

function normalizePriceSummary(
  price: CompareProductResponse["price"],
  offers: CompareOffer[],
): PriceStats {
  const fallback = computePriceStats(offers, price?.min ?? null);

  if (!price) {
    return fallback;
  }

  const toNumber = (value: number | null | undefined): number | null => (
    typeof value === "number" && Number.isFinite(value) ? value : null
  );

  return {
    min: toNumber(price.min) ?? fallback.min,
    max: toNumber(price.max) ?? fallback.max,
    average: toNumber(price.avg) ?? fallback.average,
  };
}

function normalizeHistory(history: PriceHistoryEntry[] | null | undefined): PriceHistoryEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const date = typeof entry.date === "string" ? entry.date : null;
      const price = typeof entry.price === "number" && Number.isFinite(entry.price) ? entry.price : null;

      if (!date) {
        return null;
      }

      return { date, price };
    })
    .filter((entry): entry is PriceHistoryEntry => Boolean(entry))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function resolveVendorLogo(
  seller: string,
  provided?: string | null,
  fallbackImage?: string | null,
): string | null {
  if (provided && provided.trim().length > 0) {
    return provided;
  }

  const trimmed = seller.trim();
  if (!trimmed) {
    return fallbackImage ?? null;
  }

  const normalized = trimmed.toLowerCase();
  const direct = VENDOR_LOGOS[normalized];
  if (direct) {
    return direct;
  }

  const fuzzy = Object.entries(VENDOR_LOGOS).find(([key]) => normalized.includes(key));
  if (fuzzy) {
    return fuzzy[1];
  }

  return fallbackImage ?? null;
}

function resolvePrimarySource(offers: CompareOffer[], brand: string | null) {
  if (offers.length > 0) {
    const highlighted = offers[0];
    if (highlighted?.seller) {
      return highlighted.seller;
    }
  }
  if (brand) {
    return brand;
  }
  return null;
}

function buildChartDataset(history: PriceHistoryEntry[]) {
  return history.map((entry) => ({
    date: entry.date,
    price: entry.price ?? null,
  }));
}

function renderRating(rating: number | null, source: string | null) {
  if (rating === null || Number.isNaN(rating)) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6600]/10 px-3 py-1 text-xs font-semibold text-[#FF6600]">
      <span>{rating.toFixed(1)} / 5</span>
      {source ? <span className="text-[11px] text-[color:var(--muted)]">({source})</span> : null}
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]> | Promise<Record<string, string | string[]>>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const rawId = resolvedSearchParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || !id.trim()) {
    return (
      <main className="min-h-screen bg-[#FFF5EB] pb-20 pt-16 text-[color:var(--text)] dark:bg-[color:var(--accent)]">
        <div className="mx-auto max-w-4xl px-4">
          <div className={`${CARD_BASE_CLASSES} p-8 text-center`}>Identifiant produit manquant.</div>
        </div>
      </main>
    );
  }

  const productData = await fetchComparisonProduct(id.trim());

  if (!productData) {
    return (
      <main className="min-h-screen bg-[#FFF5EB] pb-20 pt-16 text-[color:var(--text)] dark:bg-[color:var(--accent)]">
        <div className="mx-auto max-w-4xl px-4">
          <div className={`${CARD_BASE_CLASSES} p-8 text-center`}>Impossible de récupérer les données du produit.</div>
        </div>
      </main>
    );
  }

  const offers = Array.isArray(productData.offers) ? productData.offers : [];
  const priceStats = normalizePriceSummary(productData.price, offers);
  const priceHistory = normalizeHistory(productData.history);
  const chartData = buildChartDataset(priceHistory);
  const primarySource = resolvePrimarySource(offers, productData.brand);
  const basePriceText = formatCurrency(priceStats.min);
  const averagePriceText = formatCurrency(priceStats.average);
  const minPriceText = formatCurrency(priceStats.min);
  const maxPriceText = formatCurrency(priceStats.max);
  const productImage =
    typeof productData.image === "string" && productData.image.trim().length > 0
      ? productData.image
      : "/no-image.png";

  return (
    <main className="min-h-screen bg-[#FFF5EB] pb-24 pt-16 text-[color:var(--text)] dark:bg-[color:var(--accent)]">
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
        <header className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#FF6600]">Comparateur</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{productData.name ?? "Comparaison FitIdion"}</h1>
          <p className="mx-auto max-w-2xl text-sm text-[color:var(--muted)]">
            Comparez instantanément les meilleures offres partenaires pour optimiser vos achats nutrition et accessoires.
            Visualisez l&apos;historique des prix et accédez aux boutiques officielles en un clic.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[340px,1fr]">
          <div className={`${CARD_BASE_CLASSES} overflow-hidden`}>
            <div className="relative h-80 w-full bg-[color:var(--secondary)]">
              <Image
                src={productImage}
                alt={productData.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 340px"
                loading="lazy"
              />
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-1">
                {productData.brand ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6600]">{productData.brand}</p>
                ) : null}
                <h2 className="text-xl font-semibold text-[color:var(--text)]">{productData.name}</h2>
              </div>
              {productData.description ? (
                <p className="text-sm text-[color:var(--muted)]">{productData.description}</p>
              ) : null}
              {renderRating(productData.rating ?? null, primarySource)}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${CARD_BASE_CLASSES} grid gap-6 p-6 sm:grid-cols-2`}>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">Prix de référence</p>
                <p className="mt-2 text-3xl font-bold text-[#FF6600]">{basePriceText}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Moyen</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--text)]">{averagePriceText}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Min</p>
                  <p className="mt-2 text-base font-semibold text-emerald-600 dark:text-emerald-400">{minPriceText}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Max</p>
                  <p className="mt-2 text-base font-semibold text-rose-600 dark:text-rose-400">{maxPriceText}</p>
                </div>
              </div>
            </div>

            <div className={`${CARD_BASE_CLASSES} p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--text)]">Offres disponibles</h2>
                  <p className="text-sm text-[color:var(--muted)]">
                    Classement automatique des marchands par prix TTC. Les frais de livraison sont affichés lorsqu&apos;ils sont
                    connus.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[color:var(--secondary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                  {offers.length} offre{offers.length > 1 ? "s" : ""}
                </span>
              </div>

              {offers.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/60 p-6 text-center text-sm text-[color:var(--muted)]">
                  Aucune offre trouvée pour ce produit pour le moment.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {offers.map((offer, index) => {
                    const logoUrl = resolveVendorLogo(offer.seller, offer.logo ?? null, offer.image ?? null);
                    const isBestPrice = index === 0;
                    const hasDiscount =
                      typeof offer.old_price === "number"
                      && typeof offer.price === "number"
                      && offer.old_price > offer.price;
                    const oldPriceText = formatCurrency(
                      typeof offer.old_price === "number" ? offer.old_price : null,
                    );
                    const shippingText = offer.shipping ?? "À vérifier";
                    const deliveryText = offer.delivery_time ?? null;
                    const ratingText =
                      typeof offer.rating === "number" && Number.isFinite(offer.rating)
                        ? `${offer.rating.toFixed(1)} / 5`
                        : null;
                    const sourceText = offer.source && offer.source !== offer.seller ? offer.source : null;

                    return (
                      <article
                        key={`${offer.seller}-${offer.url ?? index}`}
                        className={`relative flex h-full flex-col justify-between gap-4 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                          isBestPrice ? "ring-2 ring-[#FF6600]/40" : ""
                        }`}
                      >
                        {isBestPrice ? (
                          <span className="absolute right-5 top-5 inline-flex items-center rounded-full bg-[#FF6600]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#FF6600]">
                            Meilleur prix
                          </span>
                        ) : null}

                        <div className="flex items-start gap-4">
                          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white ring-1 ring-[color:var(--border-soft)]">
                            {logoUrl ? (
                              <Image
                                src={logoUrl}
                                alt={offer.seller}
                                fill
                                className="object-contain p-1.5"
                                sizes="48px"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#FF6600]">
                                {offer.seller.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[color:var(--text)]">{offer.seller}</p>
                            {sourceText ? (
                              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">{sourceText}</p>
                            ) : null}
                            {ratingText ? (
                              <p className="text-xs text-[color:var(--muted)]">{ratingText}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-2xl font-bold text-[#FF6600]">{formatCurrency(offer.price)}</p>
                            {hasDiscount ? (
                              <p className="text-xs text-[color:var(--muted)] line-through">{oldPriceText}</p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl bg-[color:var(--secondary)]/40 px-3 py-2 text-xs text-[color:var(--muted)]">
                            <p>
                              Livraison :
                              <span className="font-medium text-[color:var(--text)]"> {shippingText}</span>
                            </p>
                            {deliveryText ? (
                              <p className="mt-1">
                                Délai :
                                <span className="font-medium text-[color:var(--text)]"> {deliveryText}</span>
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            {offer.url ? (
                              <Link
                                href={offer.url}
                                className={CTA_BUTTON_CLASSES}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Voir l&apos;offre
                              </Link>
                            ) : (
                              <span className="text-xs text-[color:var(--muted)]">Lien indisponible</span>
                            )}
                            {isBestPrice ? (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Offre la plus avantageuse
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`${CARD_BASE_CLASSES} p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">Historique des prix</h2>
              <p className="text-sm text-[color:var(--muted)]">
                Analysez l&apos;évolution du tarif moyen sur plusieurs semaines pour anticiper les meilleures périodes d&apos;achat.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {chartData.length} point{chartData.length > 1 ? "s" : ""} de données
            </span>
          </div>

          {chartData.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/60 p-6 text-center text-sm text-[color:var(--muted)]">
              Historique indisponible pour ce produit pour le moment.
            </p>
          ) : (
            <div className="mt-6 h-72 w-full">
              <PriceHistoryChart data={chartData} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
