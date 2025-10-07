"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { buildDisplayImageUrl } from "@/lib/images";
import type { DealItem } from "@/types/api";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type FetchState = "idle" | "loading" | "success" | "error";

const starArray = Array.from({ length: 5 });

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
  const reviewCount =
    typeof deal.reviewsCount === "number" ? deal.reviewsCount : null;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={buildDisplayImageUrl(deal.image) || "/placeholder.png"}
              alt={deal.title}
              className="h-52 w-full rounded-3xl object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-500 shadow">
              {deal.source}
            </div>
            {deal.bestPrice && (
              <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 shadow">
                🏆 Meilleur prix
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {deal.weightKg && <span>{deal.weightKg.toLocaleString("fr-FR")} kg</span>}
            {deal.pricePerKg && <span>{deal.pricePerKg.toFixed(2)} €/kg</span>}
            {countdown && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-orange-500">
                ⏱️ {countdown}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{deal.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{deal.vendor}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between space-y-6">
          <div
            className="flex flex-wrap items-center gap-2 text-sm text-slate-600"
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
                  {starArray.map((_, starIndex) => {
                    const isFilled = starIndex + 1 <= Math.round(ratingValue);

                    return (
                      <span
                        key={`${deal.id}-star-${starIndex}`}
                        className={isFilled ? "text-orange-400" : "text-slate-200"}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
                <span className="font-semibold text-slate-700">
                  {ratingValue.toFixed(1)}
                </span>
                {reviewCount && (
                  <span className="text-xs text-slate-400">
                    ({reviewCount.toLocaleString("fr-FR")} avis)
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400">Avis à venir</span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{formattedPrice}</p>
            {deal.shippingText && (
              <p className="text-xs text-slate-400">{deal.shippingText}</p>
            )}
          </div>
          {deal.link ? (
            <Button asChild className="w-full rounded-full">
              <a href={deal.link} target="_blank" rel="noopener noreferrer nofollow">
                Voir l&apos;offre
              </a>
            </Button>
          ) : (
            <p className="text-sm text-slate-400">Offre en cours d&apos;actualisation.</p>
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

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchDeals = async () => {
      setState("loading");
      try {
        const data = await apiClient.get<DealItem[]>("/deals", {
          cache: "no-store",
        });

        if (!mounted) {
          return;
        }

        setDeals(data);
        setState("success");
      } catch (error) {
        console.error("Erreur chargement deals", error);
        if (mounted) {
          setState("error");
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
    <section id="promotions" className="bg-white py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Promos du moment
            </h2>
            <p className="text-base text-slate-500">
              Offres vérifiées et mises à jour plusieurs fois par jour auprès de nos partenaires.
            </p>
          </div>
        </div>

        {state === "error" && (
          <p className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Impossible de charger les promotions. Réessayez plus tard.
          </p>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {state !== "success"
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[420px] animate-pulse rounded-3xl border border-orange-50 bg-orange-50/60"
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
                <p className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  Aucune promotion disponible pour le moment.
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
