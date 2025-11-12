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

function resolveVendorLogo(seller: string, provided?: string | null): string | null {
  if (provided && provided.trim().length > 0) {
    return provided;
  }

  const trimmed = seller.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  const direct = VENDOR_LOGOS[normalized];
  if (direct) {
    return direct;
  }

  const fuzzy = Object.entries(VENDOR_LOGOS).find(([key]) => normalized.includes(key));
  return fuzzy ? fuzzy[1] : null;
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
              {productData.image ? (
                <Image
                  src={productData.image}
                  alt={productData.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 340px"
                  loading="lazy"
                />
              ) : (
                <Image
                  src="/FitIdion_Icon.png"
                  alt="Image produit indisponible"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 340px"
                  loading="lazy"
                />
              )}
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
                <div className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[color:var(--secondary)]/60 text-xs uppercase tracking-wide text-[color:var(--muted)]">
                      <tr>
                        <th className="px-4 py-3 text-left">Marchand</th>
                        <th className="px-4 py-3 text-left">Prix</th>
                        <th className="px-4 py-3 text-left">Livraison</th>
                        <th className="px-4 py-3 text-right">Lien</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((offer, index) => {
                        const logoUrl = resolveVendorLogo(offer.seller, offer.logo);
                        const isBestPrice = index === 0;
                        const hasDiscount =
                          typeof offer.old_price === "number"
                          && typeof offer.price === "number"
                          && offer.old_price > offer.price;
                        const oldPriceText = formatCurrency(
                          typeof offer.old_price === "number" ? offer.old_price : null,
                        );

                        return (
                          <tr
                            key={`${offer.seller}-${offer.url ?? index}`}
                            className={`border-t border-[color:var(--border-soft)]/80 transition-colors hover:bg-[#FFF5EB]/80 dark:hover:bg-[color:var(--secondary)]/50 ${
                              isBestPrice ? "bg-[#FFF5EB]/60 dark:bg-[color:var(--secondary)]/40" : "bg-[color:var(--surface)]"
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {logoUrl ? (
                                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white">
                                    <Image
                                      src={logoUrl}
                                      alt={offer.seller}
                                      fill
                                      className="object-contain p-1"
                                      sizes="32px"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6600]/10 text-xs font-semibold text-[#FF6600]">
                                    {offer.seller.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-[color:var(--text)]">{offer.seller}</p>
                                  {typeof offer.rating === "number" && Number.isFinite(offer.rating) ? (
                                    <p className="text-xs text-[color:var(--muted)]">{offer.rating.toFixed(1)} / 5</p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col text-[color:var(--text)]">
                                <span className="text-base font-semibold">{formatCurrency(offer.price)}</span>
                                {hasDiscount ? (
                                  <span className="text-xs text-[color:var(--muted)] line-through">{oldPriceText}</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-[color:var(--muted)]">
                              {offer.shipping ?? "À vérifier"}
                              {offer.delivery_time ? (
                                <span className="block text-xs text-[color:var(--muted)]/80">{offer.delivery_time}</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {offer.url ? (
                                <Link href={offer.url} className={CTA_BUTTON_CLASSES} target="_blank" rel="noopener noreferrer">
                                  Voir l&apos;offre
                                </Link>
                              ) : (
                                <span className="text-xs text-[color:var(--muted)]">Lien indisponible</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
