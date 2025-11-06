"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { popularCategories, type PopularCategory } from "@/data/popularCategories";
import apiClient from "@/lib/apiClient";
import { getFallbackDeals } from "@/lib/fallbackCatalogue";
import { buildDisplayImageUrl } from "@/lib/images";
import type { DealItem } from "@/types/api";

const EURO_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const PROMOS_PER_CATEGORY = 6;

type FetchState = "idle" | "loading" | "success" | "error";

type CategoryPromoState = PopularCategory & {
  status: FetchState;
  error: string | null;
  deals: DealItem[];
  usingFallback: boolean;
};

type CategoryResult = {
  id: string;
  deals: DealItem[];
  usingFallback: boolean;
  error?: string;
};

const promoCategories: PopularCategory[] = popularCategories.map((category) => ({
  ...category,
  description: category.description,
}));

function computeDiscountPercentage(deal: DealItem): number | null {
  const priceAmount = typeof deal.price?.amount === "number" ? deal.price.amount : null;
  const referenceAmount = typeof deal.totalPrice?.amount === "number" ? deal.totalPrice.amount : null;

  if (
    priceAmount !== null &&
    referenceAmount !== null &&
    Number.isFinite(priceAmount) &&
    Number.isFinite(referenceAmount) &&
    referenceAmount > priceAmount
  ) {
    return Math.round(((referenceAmount - priceAmount) / referenceAmount) * 100);
  }

  return null;
}

function getPricePerKg(deal: DealItem): number | null {
  if (typeof deal.pricePerKg === "number" && Number.isFinite(deal.pricePerKg) && deal.pricePerKg > 0) {
    return deal.pricePerKg;
  }
  return null;
}

function getWeightKg(deal: DealItem): number | null {
  if (typeof deal.weightKg === "number" && Number.isFinite(deal.weightKg) && deal.weightKg > 0) {
    return deal.weightKg;
  }
  return null;
}

function getFormattedPrice(price: DealItem["price"] | DealItem["totalPrice"]): string | null {
  if (!price) {
    return null;
  }

  if (price.formatted) {
    return price.formatted;
  }

  if (typeof price.amount === "number" && Number.isFinite(price.amount)) {
    const currency = price.currency ?? "EUR";
    const formatted = EURO_FORMATTER.format(price.amount);
    return currency === "EUR" ? formatted : `${formatted} ${currency}`;
  }

  return null;
}

function getDisplayPrice(deal: DealItem): string {
  return getFormattedPrice(deal.price) ?? "Prix non disponible";
}

function getReferencePrice(deal: DealItem): string | null {
  const formatted = getFormattedPrice(deal.totalPrice);
  const priceAmount = typeof deal.price?.amount === "number" ? deal.price.amount : null;
  const referenceAmount = typeof deal.totalPrice?.amount === "number" ? deal.totalPrice.amount : null;

  if (formatted && referenceAmount !== null && priceAmount !== null && referenceAmount > priceAmount) {
    return formatted;
  }

  return null;
}

function buildHighlights(deal: DealItem): string[] {
  const highlights: string[] = [];
  const discount = computeDiscountPercentage(deal);
  const pricePerKg = getPricePerKg(deal);
  const weightKg = getWeightKg(deal);

  if (discount && discount > 0) {
    highlights.push(`Remise -${discount}%`);
  }
  if (pricePerKg !== null) {
    highlights.push(`${pricePerKg.toFixed(2)} €/kg`);
  }
  if (weightKg !== null) {
    highlights.push(`Pack ${weightKg.toLocaleString("fr-FR")} kg`);
  }

  return highlights;
}

function compareDeals(a: DealItem, b: DealItem): number {
  const bestA = (a.bestPrice ? 1 : 0) + (a.isBestPrice ? 1 : 0);
  const bestB = (b.bestPrice ? 1 : 0) + (b.isBestPrice ? 1 : 0);
  if (bestA !== bestB) {
    return bestB - bestA;
  }

  const discountA = computeDiscountPercentage(a) ?? 0;
  const discountB = computeDiscountPercentage(b) ?? 0;
  if (discountA !== discountB) {
    return discountB - discountA;
  }

  const pricePerKgA = getPricePerKg(a);
  const pricePerKgB = getPricePerKg(b);
  if (pricePerKgA !== pricePerKgB) {
    if (pricePerKgA === null) return 1;
    if (pricePerKgB === null) return -1;
    return pricePerKgA - pricePerKgB;
  }

  const weightA = getWeightKg(a);
  const weightB = getWeightKg(b);
  if (weightA !== weightB) {
    if (weightA === null) return 1;
    if (weightB === null) return -1;
    return weightB - weightA;
  }

  const priceA = typeof a.price?.amount === "number" ? a.price.amount : Number.POSITIVE_INFINITY;
  const priceB = typeof b.price?.amount === "number" ? b.price.amount : Number.POSITIVE_INFINITY;
  if (priceA !== priceB) {
    return priceA - priceB;
  }

  const ratingA = typeof a.rating === "number" ? a.rating : 0;
  const ratingB = typeof b.rating === "number" ? b.rating : 0;
  if (ratingA !== ratingB) {
    return ratingB - ratingA;
  }

  const reviewsA = typeof a.reviewsCount === "number" ? a.reviewsCount : 0;
  const reviewsB = typeof b.reviewsCount === "number" ? b.reviewsCount : 0;
  if (reviewsA !== reviewsB) {
    return reviewsB - reviewsA;
  }

  return 0;
}

function selectTopPromotions(deals: DealItem[], limit = PROMOS_PER_CATEGORY): DealItem[] {
  const seen = new Set<string>();
  const uniqueDeals = deals.filter((deal) => {
    const key = deal.id || `${deal.vendor}-${deal.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  const prioritized = uniqueDeals.slice().sort(compareDeals);
  const selected: DealItem[] = [];
  const fallback: DealItem[] = [];

  for (const deal of prioritized) {
    const hasPromoMetric =
      (computeDiscountPercentage(deal) ?? 0) > 0 ||
      getPricePerKg(deal) !== null ||
      getWeightKg(deal) !== null;

    if (hasPromoMetric && selected.length < limit) {
      selected.push(deal);
    } else {
      fallback.push(deal);
    }
  }

  for (const deal of fallback) {
    if (selected.length >= limit) {
      break;
    }
    selected.push(deal);
  }

  return selected.slice(0, limit);
}

type SerpIntegrationResult = {
  deals: DealItem[];
  source: "serp" | "fallback" | "none";
  error?: string;
};

function mergeDeals(base: DealItem[], incoming: DealItem[], limit: number): DealItem[] {
  if (incoming.length === 0) {
    return base;
  }

  return selectTopPromotions([...base, ...incoming], limit);
}

async function fetchSerpDealsWithFallback({
  query,
  limit,
  existingDeals = [],
}: {
  query: string;
  limit: number;
  existingDeals?: DealItem[];
}): Promise<SerpIntegrationResult> {
  const baseDeals = existingDeals.length > 0 ? selectTopPromotions(existingDeals, limit) : [];

  const useCatalogueFallback = (error?: string): SerpIntegrationResult => {
    const fallbackDeals = getFallbackDeals({ limit: limit * 3, query });
    if (fallbackDeals.length === 0) {
      return { deals: baseDeals, source: "none", error };
    }

    const combined = mergeDeals(baseDeals, fallbackDeals, limit);
    if (combined.length === 0) {
      return { deals: baseDeals, source: "none", error };
    }

    return {
      deals: combined,
      source: "fallback",
      error,
    };
  };

  if (!query) {
    return useCatalogueFallback();
  }

  try {
    const params = new URLSearchParams({ q: query, limit: String(limit * 3) });
    const response = await fetch(`/api/catalogue/serp?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      await response.text();
      const reason = `SerpAPI request failed with status ${response.status}`;
      return useCatalogueFallback(reason);
    }

    const data = await response.json();
    const deals: DealItem[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.deals)
        ? data.deals
        : [];

    if (deals.length === 0) {
      return useCatalogueFallback("SerpAPI returned no deals");
    }

    const combined = mergeDeals(baseDeals, deals, limit);
    return {
      deals: combined.length > 0 ? combined : baseDeals,
      source: "serp",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SerpAPI request error";
    return useCatalogueFallback(message);
  }
}

function PromoDealCard({ deal }: { deal: DealItem }) {
  const discount = computeDiscountPercentage(deal);
  const highlights = buildHighlights(deal);
  const rating = typeof deal.rating === "number" ? deal.rating : null;
  const reviews = typeof deal.reviewsCount === "number" ? deal.reviewsCount : null;
  const formattedPrice = getDisplayPrice(deal);
  const referencePrice = getReferencePrice(deal);
  const imageUrl = buildDisplayImageUrl(deal.image) || "/placeholder.png";

  return (
    <Card className="flex h-full flex-col overflow-hidden border-accent/70 p-0 shadow-glass transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-fitidion dark:border-primary/30">
      <div className="relative h-48 w-full overflow-hidden bg-accent">
        <Image
          src={imageUrl}
          alt={deal.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 hover:scale-105"
          loading="lazy"
        />
        {discount && discount > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
            -{discount}%
          </div>
        )}
        {(deal.bestPrice || deal.isBestPrice) && (
          <div className="absolute left-4 top-4 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-semibold text-white shadow">
            Meilleur prix
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
            {deal.source}
          </div>
          <h3 className="text-lg font-semibold text-dark dark:text-white">{deal.title}</h3>
          <p className="text-sm text-muted dark:text-muted/70">{deal.vendor}</p>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-dark dark:text-white">{formattedPrice}</span>
          {referencePrice && <span className="text-sm text-muted/80 dark:text-muted line-through">{referencePrice}</span>}
        </div>

        <div className="text-sm text-muted dark:text-muted/70" aria-label={rating ? `Note ${rating.toFixed(1)} sur 5${reviews ? ` basée sur ${reviews.toLocaleString("fr-FR")} avis` : ""}` : undefined}>
          {rating ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-dark dark:text-white">
                <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </span>
              {reviews && (
                <span className="text-xs text-muted/80 dark:text-muted">({reviews.toLocaleString("fr-FR")} avis)</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted/80 dark:text-muted">Avis en cours de collecte</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted dark:text-muted/70">
          {highlights.map((highlight) => (
            <span
              key={`${deal.id}-highlight-${highlight}`}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary"
            >
              {highlight}
            </span>
          ))}
          {deal.shippingText && (
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-muted dark:text-muted/70">
              {deal.shippingText}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          {deal.link ? (
            <Button asChild className="w-full rounded-full">
              <a href={deal.link} target="_blank" rel="noopener noreferrer nofollow">
                Voir l&apos;offre
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted/80 dark:text-muted">Offre en cours d&apos;actualisation.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function PromosPage() {
  const [categories, setCategories] = useState<CategoryPromoState[]>(() =>
    promoCategories.map((category) => ({
      ...category,
      status: "idle" as FetchState,
      error: null,
      deals: [],
      usingFallback: false,
    })),
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyResults = useCallback((results: CategoryResult[]) => {
    if (!isMountedRef.current) {
      return;
    }

    const resultMap = new Map<string, CategoryResult>();
    results.forEach((result) => {
      resultMap.set(result.id, result);
    });

    let successCount = 0;

    setCategories((prev) =>
      prev.map((category) => {
        const result = resultMap.get(category.id);
        if (!result) {
          return category;
        }

        if (result.deals.length > 0) {
          successCount += 1;
          return {
            ...category,
            status: "success" as FetchState,
            error: null,
            deals: result.deals,
            usingFallback: result.usingFallback,
          };
        }

        return {
          ...category,
          status: "error" as FetchState,
          error: result.error ?? "Impossible de charger les promotions pour le moment.",
          deals: [],
          usingFallback: false,
        };
      }),
    );

    if (successCount > 0) {
      setLastUpdated(new Date());
    }
  }, []);

  const fetchPromosData = useCallback(async (): Promise<CategoryResult[]> => {
    return Promise.all(
      promoCategories.map(async (category) => {
        const fallbackDeals = selectTopPromotions(
          getFallbackDeals({ limit: PROMOS_PER_CATEGORY * 2, query: category.query }),
          PROMOS_PER_CATEGORY,
        );

        let selected: DealItem[] = fallbackDeals;
        let usingFallback = fallbackDeals.length > 0;
        let hasRealApiData = false;
        let lastError: string | null = null;

        try {
          const deals = await apiClient.get<DealItem[]>("/compare", {
            cache: "no-store",
            query: { q: category.query, limit: 24 },
          });

          const normalizedDeals = selectTopPromotions(Array.isArray(deals) ? deals : [], PROMOS_PER_CATEGORY);
          if (normalizedDeals.length > 0) {
            selected = selectTopPromotions([...normalizedDeals, ...selected], PROMOS_PER_CATEGORY);
            hasRealApiData = true;
            usingFallback = false;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : "Erreur chargement promotions";
        }

        if (selected.length < PROMOS_PER_CATEGORY) {
          const serpResult = await fetchSerpDealsWithFallback({
            query: category.query,
            limit: PROMOS_PER_CATEGORY,
            existingDeals: selected,
          });

          if (serpResult.deals.length > 0) {
            selected = serpResult.deals;
            usingFallback = !hasRealApiData && serpResult.source === "fallback";
          } else if (!hasRealApiData && fallbackDeals.length === 0) {
            return {
              id: category.id,
              deals: [],
              usingFallback: false,
              error: serpResult.error ?? lastError ?? "Impossible de charger les promotions pour cette catégorie.",
            } satisfies CategoryResult;
          }
        }

        if (selected.length === 0) {
          return {
            id: category.id,
            deals: [],
            usingFallback: false,
            error: lastError ?? "Impossible de charger les promotions pour cette catégorie.",
          } satisfies CategoryResult;
        }

        return { id: category.id, deals: selected, usingFallback } satisfies CategoryResult;
      }),
    );
  }, []);

  const loadPromos = useCallback(async () => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        status: "loading" as FetchState,
        error: null,
        usingFallback: false,
      })),
    );

    const results = await fetchPromosData();
    applyResults(results);
  }, [applyResults, fetchPromosData]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    let cancelled = false;

    const initialize = async () => {
      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          status: "loading" as FetchState,
          error: null,
          usingFallback: false,
        })),
      );

      const results = await fetchPromosData();
      if (cancelled) {
        return;
      }
      applyResults(results);
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [applyResults, fetchPromosData]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    return lastUpdated.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const categoryNav = useMemo(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.label,
        href: `#promos-${category.id}`,
        count: category.status === "success" ? category.deals.length : null,
      })),
    [categories],
  );

  const isLoading = categories.some((category) => category.status === "loading");

  return (
    <div className="space-y-16 bg-[var(--background)] pb-20 text-[var(--foreground)]">
      <section className="relative overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(255,102,0,0.14),transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(253,220,142,0.12),transparent_55%)]" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-dark sm:text-4xl dark:text-white">Promos du moment</h1>
              <p className="max-w-2xl text-base text-muted dark:text-muted/70">
                Découvrez, pour chaque univers clé (whey, créatine, BCAA, accessoires…), nos six meilleures offres
                du moment. Nous priorisons les remises immédiates, les gros formats avantageux et les prix au kilo
                les plus bas pour vous aider à économiser.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button onClick={loadPromos} disabled={isLoading} className="rounded-full">
                {isLoading ? "Actualisation en cours…" : "Rafraîchir les offres"}
              </Button>
              {lastUpdatedLabel && (
                <p className="text-sm text-muted dark:text-muted/80">Dernière mise à jour à {lastUpdatedLabel}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {categoryNav.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-accent/70 bg-accent px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-secondary/60"
              >
                <span>{item.label}</span>
                {typeof item.count === "number" && (
                  <span className="text-xs text-primary/80">{item.count}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-16 px-4 sm:px-6">
        {categories.map((category) => (
          <section key={category.id} id={`promos-${category.id}`} className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-dark dark:text-white">{category.label}</h2>
                <p className="text-sm text-muted dark:text-muted/70">{category.description}</p>
                {category.usingFallback && (
                  <p className="text-xs font-medium text-primary">
                    Offres de démonstration affichées lorsque les données temps réel sont indisponibles.
                  </p>
                )}
              </div>
              <Link
                href={`/comparateur?q=${encodeURIComponent(category.query)}`}
                className="text-sm font-semibold text-primary transition hover:text-secondary"
              >
                Voir toutes les offres →
              </Link>
            </div>

            {category.status === "error" ? (
              <div className="space-y-3 rounded-3xl border border-red-300/40 bg-red-500/10 p-6 text-sm text-red-200">
                <p>{category.error ?? "Impossible de charger les promotions pour le moment."}</p>
                <Button onClick={loadPromos} className="rounded-full">
                  Réessayer
                </Button>
              </div>
            ) : category.status === "loading" ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: PROMOS_PER_CATEGORY }).map((_, index) => (
                  <div
                    key={`skeleton-${category.id}-${index}`}
                    className="h-[420px] animate-pulse rounded-3xl border border-accent/70 bg-accent"
                    aria-hidden
                  />
                ))}
              </div>
            ) : category.deals.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {category.deals.map((deal) => (
                  <PromoDealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-accent/70 bg-accent/80 p-6 text-sm text-muted dark:text-muted/70">
                <p>Aucune promotion active n&apos;a été détectée pour cette catégorie.</p>
                <p className="mt-2">
                  Lancez une recherche dédiée sur le comparateur pour suivre les prochaines offres :
                  <Link
                    href={`/comparateur?q=${encodeURIComponent(category.query)}`}
                    className="ml-1 font-semibold text-primary hover:text-secondary"
                  >
                    ouvrir le comparateur
                  </Link>
                  .
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      <WhyChooseUsSection />
      <PriceAlertsSection catalogueHref="/products" />
    </div>
  );
}
