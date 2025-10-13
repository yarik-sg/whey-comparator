"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Flame, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { getFallbackDeals } from "@/lib/fallbackCatalogue";
import { buildDisplayImageUrl } from "@/lib/images";
import type { DealItem } from "@/types/api";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type FetchState = "idle" | "loading" | "success" | "error";

const formatRemainingTime = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now();

  if (Number.isNaN(diff) || diff <= 0) {
    return "Expirée";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}j ${hours}h ${minutes}m`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
};

function useDealCountdown(deadline?: string | null, enabled?: boolean) {
  const [remaining, setRemaining] = useState<string | undefined>();

  useEffect(() => {
    if (!deadline || !enabled) {
      setRemaining(undefined);
      return;
    }

    const update = () => {
      setRemaining(formatRemainingTime(deadline));
    };

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, [deadline, enabled]);

  return remaining;
}

function DealCard({
  deal,
  index,
  hydrated,
}: {
  deal: DealItem;
  index: number;
  hydrated: boolean;
}) {
  const countdown = useDealCountdown(deal.expiresAt, hydrated);
  const ratingValue = typeof deal.rating === "number" ? deal.rating : null;
  const reviewCount = typeof deal.reviewsCount === "number" ? deal.reviewsCount : null;

  const formattedPrice = useMemo(() => {
    if (deal.price?.formatted) {
      return deal.price.formatted;
    }

    if (typeof deal.price?.amount === "number") {
      const currency = deal.price.currency ?? "EUR";
      const formatted = priceFormatter.format(deal.price.amount);
      return currency === "EUR" ? formatted : `${formatted} ${currency}`;
    }

    return "Prix non disponible";
  }, [deal.price]);

  const referencePrice = useMemo(() => {
    if (deal.totalPrice?.formatted) {
      return deal.totalPrice.formatted;
    }

    if (typeof deal.totalPrice?.amount === "number") {
      const currency = deal.totalPrice.currency ?? "EUR";
      const formatted = priceFormatter.format(deal.totalPrice.amount);
      return currency === "EUR" ? formatted : `${formatted} ${currency}`;
    }

    return null;
  }, [deal.totalPrice]);

  const discountPercentage = useMemo(() => {
    if (
      typeof deal.price?.amount === "number" &&
      typeof deal.totalPrice?.amount === "number" &&
      deal.totalPrice.amount > deal.price.amount
    ) {
      return Math.round(((deal.totalPrice.amount - deal.price.amount) / deal.totalPrice.amount) * 100);
    }
    return null;
  }, [deal.price?.amount, deal.totalPrice?.amount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group flex h-full flex-col overflow-hidden border-accent/40 bg-white shadow-neo transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:border-accent-d/40 dark:bg-[rgba(30,41,59,0.85)]">
        <CardHeader className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={buildDisplayImageUrl(deal.image) || "/placeholder.png"}
              alt={deal.title}
              className="h-56 w-full rounded-3xl object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {discountPercentage && (
              <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                En promo
              </div>
            )}
            {discountPercentage && (
              <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                -{discountPercentage}%
              </div>
            )}
            {deal.bestPrice && (
              <div className="absolute left-4 bottom-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-semibold text-white shadow">
                <Award className="h-3 w-3" aria-hidden="true" /> Meilleur prix
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted dark:text-muted/70">
            {deal.weightKg && <span>{deal.weightKg.toLocaleString("fr-FR")} kg</span>}
            {deal.pricePerKg && <span>{deal.pricePerKg.toFixed(2)} €/kg</span>}
            {countdown && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                ⏱️ {countdown}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-dark dark:text-white">{deal.title}</h3>
            <p className="mt-1 text-sm text-muted dark:text-muted/70">{deal.vendor}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">{deal.source}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between space-y-6">
          <div
            className="flex flex-wrap items-center gap-2 text-sm text-muted dark:text-muted/70"
            aria-label={
              ratingValue
                ? `Note ${ratingValue.toFixed(1)} sur 5${
                    reviewCount ? ` basée sur ${reviewCount} avis` : ""
                  }`
                : undefined
            }
          >
            {ratingValue ? (
              <>
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, starIndex) => {
                    const isFilled = starIndex + 1 <= Math.round(ratingValue);

                    return (
                      <Star
                        key={`${deal.id}-star-${starIndex}`}
                        className={`h-4 w-4 ${isFilled ? "fill-primary text-primary" : "text-white/30 dark:text-muted"}`}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <span className="font-semibold text-dark dark:text-white">
                  {ratingValue.toFixed(1)}
                </span>
                {reviewCount && (
                  <span className="text-xs text-muted/80 dark:text-muted">
                    ({reviewCount.toLocaleString("fr-FR")} avis)
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted/80 dark:text-muted">Avis à venir</span>
            )}
          </div>
          <div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-dark dark:text-white">{formattedPrice}</p>
              {referencePrice && <span className="text-sm text-muted/80 dark:text-muted line-through">{referencePrice}</span>}
            </div>
            {deal.shippingText && <p className="text-xs text-muted/80 dark:text-muted">{deal.shippingText}</p>}
          </div>
          {deal.link ? (
            <Button asChild className="w-full rounded-full">
              <a href={deal.link} target="_blank" rel="noopener noreferrer nofollow">
                Comparer les prix
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted/80 dark:text-muted">Offre en cours d&apos;actualisation.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DealsShowcase() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [state, setState] = useState<FetchState>("idle");
  const [hydrated, setHydrated] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const fallbackDeals = useMemo(() => getFallbackDeals({ limit: 9 }), []);
  const router = useRouter();
  const quickFilters = useMemo(
    () => [
      { label: "Whey", query: "whey isolate" },
      { label: "Créatine", query: "creatine" },
      { label: "BCAA", query: "bcaa" },
      { label: "Vegan", query: "vegan protein" },
      { label: "Accessoires", query: "fitness accessoires" },
    ],
    [],
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchDeals = async () => {
      setState("loading");
      try {
        const data = await apiClient.get<DealItem[]>("/compare", {
          cache: "no-store",
          query: { limit: 9 },
        });

        if (!mounted) {
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          setDeals(data);
          setUsingFallback(false);
          setState("success");
        } else if (fallbackDeals.length > 0) {
          setDeals(fallbackDeals);
          setUsingFallback(true);
          setState("success");
        } else {
          setDeals([]);
          setUsingFallback(false);
          setState("success");
        }
      } catch (error) {
        console.error("Erreur chargement deals", error);
        if (mounted) {
          if (fallbackDeals.length > 0) {
            setDeals(fallbackDeals);
            setUsingFallback(true);
            setState("success");
          } else {
            setState("error");
          }
        }
      }
    };

    fetchDeals();

    return () => {
      mounted = false;
    };
  }, []);

  const hasDeals = deals.length > 0;

  return (
    <section id="promotions" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,102,0,0.18),transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_10%,rgba(253,220,142,0.14),transparent_58%)]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-dark sm:text-4xl dark:text-white">
              Promos du moment
            </h2>
            <p className="text-base text-muted dark:text-muted/70">
              Offres vérifiées et mises à jour plusieurs fois par jour auprès de nos partenaires.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {quickFilters.map(({ label, query }) => (
            <button
              key={label}
              type="button"
              onClick={() => router.push(`/comparateur?q=${encodeURIComponent(query)}`)}
              className="inline-flex items-center rounded-full border border-primary/20 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-dark transition hover:border-primary/40 hover:bg-primary hover:text-white dark:border-primary/40 dark:bg-[rgba(51,65,85,0.4)] dark:text-text-1"
            >
              {label}
            </button>
          ))}
        </div>

        {usingFallback && (
          <p className="mt-2 text-sm font-medium text-primary">
            Offres de démonstration affichées lorsque les promotions temps réel sont indisponibles.
          </p>
        )}

        {state === "error" && (
          <p className="mt-8 rounded-3xl border border-red-200/60 bg-red-500/10 p-5 text-sm text-red-200">
            Impossible de charger les promotions. Réessayez plus tard.
          </p>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {state !== "success"
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[420px] animate-pulse rounded-3xl border border-accent/50 bg-accent/60 dark:border-accent-d/40 dark:bg-[rgba(30,41,59,0.6)]"
                  aria-hidden
                />
              ))
            : hasDeals
            ? deals.map((deal, index) => (
                <DealCard
                  key={deal.id ?? `${deal.vendor}-${deal.title}`}
                  deal={deal}
                  index={index}
                  hydrated={hydrated}
                />
              ))
            : (
                <p className="col-span-full rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-muted dark:text-muted/70">
                  Aucune promotion disponible pour le moment.
                </p>
              )}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => router.push("/catalogue")}
          >
            Voir toutes les offres
          </Button>
        </div>
      </div>
    </section>
  );
}
