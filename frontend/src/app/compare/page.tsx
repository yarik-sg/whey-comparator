"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocation } from "react-router-dom";

import PriceHistoryChart from "./PriceHistoryChart";
import {
  cacheCompareProduct,
  loadCachedCompareProduct,
  type CompareProductPreview,
} from "@/lib/compareNavigation";

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

async function fetchComparisonProduct(productId: string): Promise<CompareProductResponse | null> {
  try {
    const response = await fetch(`/api/compare?id=${encodeURIComponent(productId)}`, {
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

function buildPreviewFromResponse(
  id: string,
  data: CompareProductResponse,
): CompareProductPreview {
  const offers = Array.isArray(data.offers) ? data.offers : [];
  const priceStats = computePriceStats(offers, data.price?.min ?? null);
  const primarySource = resolvePrimarySource(offers, data.brand);
  const hasPrice = typeof priceStats.min === "number" && Number.isFinite(priceStats.min);
  const image = typeof data.image === "string" && data.image.trim().length > 0 ? data.image : null;

  return {
    id,
    title: data.name ?? `Produit ${id}`,
    brand: data.brand ?? null,
    image,
    source: primarySource,
    priceText: hasPrice ? formatCurrency(priceStats.min) : null,
    priceValue: hasPrice ? priceStats.min : null,
    rating:
      typeof data.rating === "number" && Number.isFinite(data.rating) ? data.rating : null,
    reviewsCount: null,
  };
}

function mergePreview(
  base: CompareProductPreview | null,
  next: CompareProductPreview,
): CompareProductPreview {
  if (!base || base.id !== next.id) {
    return next;
  }

  return {
    ...base,
    ...next,
    id: next.id,
    title: next.title || base.title,
    brand: next.brand ?? base.brand ?? null,
    image: next.image ?? base.image ?? null,
    source: next.source ?? base.source ?? null,
    priceText: next.priceText ?? base.priceText ?? null,
    priceValue:
      typeof next.priceValue === "number"
        ? next.priceValue
        : typeof base.priceValue === "number"
          ? base.priceValue
          : null,
    rating:
      typeof next.rating === "number"
        ? next.rating
        : typeof base.rating === "number"
          ? base.rating
          : null,
    reviewsCount:
      typeof next.reviewsCount === "number"
        ? next.reviewsCount
        : typeof base.reviewsCount === "number"
          ? base.reviewsCount
          : null,
  };
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const location = useLocation();
  const id = useMemo(() => {
    const raw = searchParams.get("id");
    return typeof raw === "string" ? raw.trim() : "";
  }, [searchParams]);

  const navigationPreview =
    location && typeof location.state === "object" && location.state !== null
      ? (location.state as { product?: CompareProductPreview }).product ?? null
      : null;

  const [productPreview, setProductPreview] = useState<CompareProductPreview | null>(() => {
    if (navigationPreview && navigationPreview.id) {
      return navigationPreview;
    }
    if (id) {
      return loadCachedCompareProduct(id) ?? null;
    }
    return null;
  });
  const [productData, setProductData] = useState<CompareProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (navigationPreview && navigationPreview.id) {
      setProductPreview(navigationPreview);
      cacheCompareProduct(navigationPreview);
    }
  }, [navigationPreview]);

  useEffect(() => {
    if (!id) {
      setProductPreview(null);
      setProductData(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setProductPreview((current) => {
      if (current && current.id === id) {
        return current;
      }
      return loadCachedCompareProduct(id) ?? null;
    });
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setErrorMessage(null);

    fetchComparisonProduct(id).then((data) => {
      if (cancelled) {
        return;
      }

      if (!data) {
        setProductData(null);
        setIsLoading(false);
        setErrorMessage("Impossible de récupérer les données du produit.");
        return;
      }

      setProductData(data);
      setIsLoading(false);
      setErrorMessage(null);

      const previewFromApi = buildPreviewFromResponse(id, data);
      cacheCompareProduct(previewFromApi);
      setProductPreview((current) => mergePreview(current, previewFromApi));
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const offers = useMemo<CompareOffer[]>(() => {
    if (!productData || !Array.isArray(productData.offers)) {
      return [];
    }
    return productData.offers;
  }, [productData]);

  const priceStats = useMemo<PriceStats>(() => {
    if (!productData) {
      return { min: null, max: null, average: null };
    }
    return normalizePriceSummary(productData.price, offers);
  }, [productData, offers]);

  const priceHistory = useMemo(() => {
    if (!productData) {
      return [] as PriceHistoryEntry[];
    }
    return normalizeHistory(productData.history);
  }, [productData]);

  const chartData = useMemo(() => buildChartDataset(priceHistory), [priceHistory]);

  const primarySource = useMemo(() => {
    if (productData) {
      return resolvePrimarySource(offers, productData.brand);
    }
    return productPreview?.source ?? null;
  }, [offers, productData, productPreview]);

  const productImage = useMemo(() => {
    const candidates = [productData?.image, productPreview?.image];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return "/no-image.png";
  }, [productData, productPreview]);

  const displayTitle = productData?.name ?? productPreview?.title ?? "Comparaison FitIdion";
  const displayBrand = productData?.brand ?? productPreview?.brand ?? null;
  const displayDescription = productData?.description ?? null;

  const basePriceText = productData
    ? formatCurrency(priceStats.min)
    : productPreview?.priceText ?? "—";
  const averagePriceText = productData ? formatCurrency(priceStats.average) : "—";
  const minPriceText = productData ? formatCurrency(priceStats.min) : productPreview?.priceText ?? "—";
  const maxPriceText = productData ? formatCurrency(priceStats.max) : "—";

  const ratingNode = productData
    ? renderRating(productData.rating ?? null, primarySource)
    : typeof productPreview?.rating === "number"
      ? renderRating(productPreview.rating, primarySource)
      : null;

  const shouldShowLoader = isLoading && !productData && !errorMessage;

  if (!id) {
    return (
      <main className="min-h-screen bg-[#FFF5EB] pb-20 pt-16 text-[color:var(--text)] dark:bg-[color:var(--accent)]">
        <div className="mx-auto max-w-4xl px-4">
          <div className={`${CARD_BASE_CLASSES} p-8 text-center`}>
            Identifiant produit manquant.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF5EB] pb-24 pt-16 text-[color:var(--text)] dark:bg-[color:var(--accent)]">
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
        <header className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#FF6600]">Comparateur</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{displayTitle}</h1>
          <p className="mx-auto max-w-2xl text-sm text-[color:var(--muted)]">
            Comparez instantanément les meilleures offres partenaires pour optimiser vos achats nutrition et accessoires.
            Visualisez l&apos;historique des prix et accédez aux boutiques officielles en un clic.
          </p>
        </header>

        {productPreview ? (
          <section className="product-header flex items-center gap-6 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 shadow-sm">
            <img
              src={productImage}
              alt={productPreview.title}
              className="h-24 w-24 rounded-2xl object-cover"
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).src = "/no-image.png";
              }}
            />
            <div className="space-y-1">
              {productPreview.brand ? (
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6600]">{productPreview.brand}</p>
              ) : null}
              <h2 className="text-xl font-semibold text-[color:var(--text)]">{productPreview.title}</h2>
              {productPreview.source ? (
                <p className="text-sm text-[color:var(--muted)]">{productPreview.source}</p>
              ) : null}
              {productPreview.priceText ? (
                <p className="text-base font-semibold text-[color:var(--text)]">{productPreview.priceText}</p>
              ) : null}
              {typeof productPreview.rating === "number" ? (
                <p className="text-xs text-[color:var(--muted)]">
                  Note {productPreview.rating.toFixed(1)} / 5
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {errorMessage ? (
          <div className={`${CARD_BASE_CLASSES} p-8 text-center text-sm text-[color:var(--muted)]`}>
            {errorMessage}
          </div>
        ) : null}

        {shouldShowLoader ? (
          <div className={`${CARD_BASE_CLASSES} p-8 text-center text-sm text-[color:var(--muted)]`}>
            Chargement des offres en cours…
          </div>
        ) : null}

        {productData ? (
          <section className="grid gap-8 lg:grid-cols-[340px,1fr]">
            <div className={`${CARD_BASE_CLASSES} overflow-hidden`}>
              <div className="relative h-80 w-full bg-[color:var(--secondary)]">
                <Image
                  src={productImage}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 340px"
                  loading="lazy"
                />
              </div>
              <div className="space-y-4 p-6">
                <div className="space-y-1">
                  {displayBrand ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6600]">{displayBrand}</p>
                  ) : null}
                  <h2 className="text-xl font-semibold text-[color:var(--text)]">{displayTitle}</h2>
                </div>
                {displayDescription ? (
                  <p className="text-sm text-[color:var(--muted)]">{displayDescription}</p>
                ) : null}
                {ratingNode}
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
                                <img src={logoUrl} alt={offer.seller} className="h-full w-full object-contain" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-lg" aria-hidden>
                                  🏷️
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-[color:var(--text)]">{offer.seller}</p>
                                {sourceText ? (
                                  <p className="text-xs text-[color:var(--muted)]">{sourceText}</p>
                                ) : null}
                              </div>
                              <div className="space-y-1">
                                <p className="text-lg font-semibold text-[color:var(--text)]">
                                  {formatCurrency(offer.price)}
                                </p>
                                {hasDiscount ? (
                                  <p className="text-xs text-[color:var(--muted)] line-through">{oldPriceText}</p>
                                ) : null}
                              </div>
                              <div className="space-y-1 text-xs text-[color:var(--muted)]">
                                <p>Livraison : {shippingText}</p>
                                {deliveryText ? <p>Expédition : {deliveryText}</p> : null}
                                {ratingText ? <p>Note vendeur : {ratingText}</p> : null}
                              </div>
                            </div>
                          </div>

                          {offer.url ? (
                            <a
                              href={offer.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={CTA_BUTTON_CLASSES}
                            >
                              Voir l&apos;offre
                            </a>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={`${CARD_BASE_CLASSES} space-y-6 p-6`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--text)]">Historique des prix</h2>
                    <p className="text-sm text-[color:var(--muted)]">
                      Visualisez l&apos;évolution du prix du produit pour anticiper les meilleures périodes d&apos;achat.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--secondary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                    <span aria-hidden>📈</span>
                    Tendances
                  </span>
                </div>

                {chartData.length > 0 ? (
                  <div className="h-64">
                    <PriceHistoryChart data={chartData} />
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/60 p-6 text-center text-sm text-[color:var(--muted)]">
                    Historique insuffisant pour ce produit.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
