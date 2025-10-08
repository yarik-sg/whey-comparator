"use client";

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
  deals?: DealItem[];
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

function PromoDealCard({ deal }: { deal: DealItem }) {
  const discount = computeDiscountPercentage(deal);
  const highlights = buildHighlights(deal);
  const rating = typeof deal.rating === "number" ? deal.rating : null;
  const reviews = typeof deal.reviewsCount === "number" ? deal.reviewsCount : null;
  const formattedPrice = getDisplayPrice(deal);
  const referencePrice = getReferencePrice(deal);
  const imageUrl = buildDisplayImageUrl(deal.image) || "/placeholder.png";

  return (
    <Card className="flex h-full flex-col overflow-hidden border-orange-100 p-0 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-orange-50">
        <img
          src={imageUrl}
          alt={deal.title}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {discount && discount > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
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
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            {deal.source}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{deal.title}</h3>
          <p className="text-sm text-slate-500">{deal.vendor}</p>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-emerald-600">{formattedPrice}</span>
          {referencePrice && <span className="text-sm text-slate-400 line-through">{referencePrice}</span>}
        </div>

        <div className="text-sm text-slate-500" aria-label={rating ? `Note ${rating.toFixed(1)} sur 5${reviews ? ` basée sur ${reviews.toLocaleString("fr-FR")} avis` : ""}` : undefined}>
          {rating ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-slate-700">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" aria-hidden="true" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </span>
              {reviews && (
                <span className="text-xs text-slate-400">({reviews.toLocaleString("fr-FR")} avis)</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">Avis en cours de collecte</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {highlights.map((highlight) => (
            <span
              key={`${deal.id}-highlight-${highlight}`}
              className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-500"
            >
              {highlight}
            </span>
          ))}
          {deal.shippingText && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-500">
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
            <p className="text-sm text-slate-400">Offre en cours d&apos;actualisation.</p>
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyResults = useCallback((map: Map<string, CategoryResult>, successCount: number) => {
    if (!isMountedRef.current) {
      return;
    }

    setCategories((prev) =>
      prev.map((category) => {
        const result = map.get(category.id);
        if (!result) {
          return category;
        }

        if (result.error) {
          const fallback = getFallbackDeals({ query: category.query, limit: PROMOS_PER_CATEGORY });
          if (fallback.length > 0) {
            return {
              ...category,
              status: "success" as FetchState,
              error: null,
              deals: fallback,
              usingFallback: true,
            };
          }

          return {
            ...category,
            status: "error" as FetchState,
            error: result.error,
            deals: [],
            usingFallback: false,
          };
        }

        const selectedDeals = selectTopPromotions(result.deals ?? []);

        if (selectedDeals.length === 0) {
          const fallback = getFallbackDeals({ query: category.query, limit: PROMOS_PER_CATEGORY });
          if (fallback.length > 0) {
            return {
              ...category,
              status: "success" as FetchState,
              error: null,
              deals: fallback,
              usingFallback: true,
            };
          }
        }

        return {
          ...category,
          status: "success" as FetchState,
          error: null,
          deals: selectedDeals,
          usingFallback: false,
        };
      }),
    );

    if (successCount > 0) {
      setLastUpdated(new Date());
    }
  }, []);

  const fetchPromosData = useCallback(async () => {
    const results = await Promise.all(
      promoCategories.map(async (category) => {
        try {
          const deals = await apiClient.get<DealItem[]>("/compare", {
            cache: "no-store",
            query: { q: category.query, limit: 24 },
          });

          return { id: category.id, deals };
        } catch (error) {
          console.error("Erreur chargement promos", category.query, error);
          return {
            id: category.id,
            error: "Impossible de charger les promotions pour cette catégorie.",
          };
        }
      }),
    );

    const map = new Map<string, CategoryResult>();
    let successCount = 0;

    results.forEach((result) => {
      if (result.deals) {
        map.set(result.id, { deals: result.deals });
        successCount += 1;
      } else {
        map.set(result.id, { error: result.error ?? "Impossible de charger les promotions." });
      }
    });

    return { map, successCount };
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

    const { map, successCount } = await fetchPromosData();
    applyResults(map, successCount);
  }, [applyResults, fetchPromosData]);

  useEffect(() => {
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

      const { map, successCount } = await fetchPromosData();
      if (cancelled) {
        return;
      }
      applyResults(map, successCount);
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
    <div className="space-y-16 pb-20">
      <section className="bg-orange-50/80 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Promos du moment</h1>
              <p className="max-w-2xl text-base text-slate-600">
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
                <p className="text-sm text-slate-500">Dernière mise à jour à {lastUpdatedLabel}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {categoryNav.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 transition hover:border-orange-300 hover:text-orange-500"
              >
                <span>{item.label}</span>
                {typeof item.count === "number" && (
                  <span className="text-xs text-orange-400">{item.count}</span>
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
                <h2 className="text-2xl font-semibold text-slate-900">{category.label}</h2>
                <p className="text-sm text-slate-500">{category.description}</p>
                {category.usingFallback && (
                  <p className="text-xs font-medium text-orange-500">
                    Offres de démonstration affichées lorsque les données temps réel sont indisponibles.
                  </p>
                )}
              </div>
              <Link
                href={`/comparateur?q=${encodeURIComponent(category.query)}`}
                className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
              >
                Voir toutes les offres →
              </Link>
            </div>

            {category.status === "error" ? (
              <div className="space-y-3 rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
                <p>{category.error ?? "Impossible de charger les promotions pour le moment."}</p>
                <Button onClick={loadPromos} className="rounded-full bg-red-500 text-white hover:bg-red-600">
                  Réessayer
                </Button>
              </div>
            ) : category.status === "loading" ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: PROMOS_PER_CATEGORY }).map((_, index) => (
                  <div
                    key={`skeleton-${category.id}-${index}`}
                    className="h-[420px] animate-pulse rounded-3xl border border-orange-100 bg-white"
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
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                <p>Aucune promotion active n&apos;a été détectée pour cette catégorie.</p>
                <p className="mt-2">
                  Lancez une recherche dédiée sur le comparateur pour suivre les prochaines offres :
                  <Link
                    href={`/comparateur?q=${encodeURIComponent(category.query)}`}
                    className="ml-1 font-semibold text-orange-500 hover:text-orange-400"
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
