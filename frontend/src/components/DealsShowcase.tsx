"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import apiClient from "@/lib/apiClient";
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
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}j ${hours}h ${minutes}m`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

function useDealCountdown(deadline?: string | null, enabled?: boolean) {
  const [remaining, setRemaining] = useState<string | undefined>(undefined);

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

const starArray = Array.from({ length: 5 });
const gradients = [
  "from-orange-500/80 to-red-500/80",
  "from-blue-500/80 to-cyan-500/80",
  "from-purple-500/80 to-pink-500/80",
  "from-emerald-500/80 to-lime-500/80",
  "from-slate-900/70 to-slate-800/70",
];

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
  const gradient = gradients[index % gradients.length];
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
    <motion.article
      key={deal.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-white/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1">
            {deal.source}
          </span>
          {deal.bestPrice && (
            <span
              className="inline-flex items-center gap-2 rounded-full bg-lime-300/90 px-3 py-1 text-slate-900"
              aria-label="Meilleur prix actuel"
            >
              🏆 Meilleur prix
            </span>
          )}
        </div>
        {deal.pricePerKg && (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1">
            {deal.pricePerKg.toFixed(2)} €/kg
          </span>
        )}
      </div>
      <div className="mt-5 overflow-hidden rounded-xl bg-black/20">
        <img
          src={buildDisplayImageUrl(deal.image) || "/placeholder.png"}
          alt={deal.title}
          className="h-48 w-full object-cover object-center sm:h-52"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-white">{deal.title}</h3>
      <p className="mt-1 text-sm font-medium text-white/90">{deal.vendor}</p>
      {deal.weightKg && (
        <p className="mt-1 text-xs text-white/70">
          Conditionnement : {deal.weightKg.toLocaleString("fr-FR")} kg
        </p>
      )}
      <div
        className="mt-4 flex flex-wrap items-center gap-2 text-white"
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
                    className={isFilled ? "text-yellow-300" : "text-white/40"}
                  >
                    ★
                  </span>
                );
              })}
            </div>
            <span className="text-sm font-medium">
              {ratingValue.toFixed(1)}
            </span>
            {reviewCount && (
              <span className="text-xs text-white/70">
                ({reviewCount.toLocaleString("fr-FR")} avis)
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-white/70">Avis à venir</span>
        )}
      </div>
      <div className="mt-5 flex items-end gap-3 text-white">
        <span className="text-3xl font-bold">{formattedPrice}</span>
      </div>
      {countdown && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white/80">
          <span>⏱️ Offre</span>
          <span>{countdown}</span>
        </div>
      )}
      {deal.link ? (
        <motion.a
          href={deal.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-medium text-white"
        >
          Voir l&apos;offre →
        </motion.a>
      ) : (
        <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm font-medium text-white/60">
          Offre indisponible
        </span>
      )}
    </motion.article>
  );
}

export function DealsShowcase() {
  const [status, setStatus] = useState<FetchState>("idle");
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDeals = async () => {
      setStatus("loading");
      setError(null);

      try {
        const data = await apiClient.get<DealItem[]>("/compare", {
          query: { limit: 9 },
          cache: "no-store",
        });

        if (!isMounted) {
          return;
        }

        setDeals(Array.isArray(data) ? data : []);
        setStatus("success");
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les promotions",
        );
        setStatus("error");
      }
    };

    loadDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(
    () =>
      deals.map((deal, index) => ({
        deal,
        index,
      })),
    [deals],
  );

  return (
    <section id="promotions" className="bg-[#0b1320] py-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Promos à ne pas manquer
            </h2>
            <p className="mt-3 text-gray-300">
              Des offres négociées avec les meilleurs e-shops spécialisés
              fitness.
            </p>
          </div>
          <p className="text-sm text-gray-400">Actualisées plusieurs fois par jour</p>
        </div>
        {status === "loading" && (
          <p className="text-center text-gray-300">
            Chargement des meilleures offres…
          </p>
        )}
        {status === "error" && error && (
          <p className="text-center text-red-300">{error}</p>
        )}
        {status === "success" && cards.length === 0 && (
          <p className="text-center text-gray-300">
            Aucune promotion disponible pour le moment.
          </p>
        )}
        {cards.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map(({ deal, index }) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                hydrated={hydrated}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
