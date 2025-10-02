"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { deals, Deal } from "@/data/deals";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

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

function useDealCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!deadline) {
      return;
    }

    const update = () => {
      setRemaining(formatRemainingTime(deadline));
    };

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, [deadline]);

  return remaining;
}

const starArray = Array.from({ length: 5 });

function DealCard({ deal, index }: { deal: Deal; index: number }) {
  const countdown = useDealCountdown(deal.deadline);
  const discountBadge = useMemo(
    () => `-${deal.discountPercent}%`,
    [deal.discountPercent]
  );

  return (
    <motion.article
      key={deal.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${deal.color} p-6 shadow-lg`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-white/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1">
            {deal.badge}
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
        <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1">
          {discountBadge}
        </span>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl bg-black/20">
        <img
          src={deal.imageUrl}
          alt={deal.imageAlt}
          className="h-48 w-full object-cover object-center sm:h-52"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-white">
        {deal.productName}
      </h3>
      <p className="mt-3 text-sm text-white/90">{deal.hook}</p>
      <div
        className="mt-4 flex flex-wrap items-center gap-2 text-white"
        aria-label={`Note ${deal.rating.toFixed(1)} sur 5 basée sur ${deal.reviewCount} avis`}
      >
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {starArray.map((_, starIndex) => {
            const isFilled = starIndex + 1 <= Math.round(deal.rating);

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
        <span className="text-sm font-medium">{deal.rating.toFixed(1)}</span>
        <span className="text-xs text-white/70">
          ({deal.reviewCount.toLocaleString("fr-FR")} avis)
        </span>
      </div>
      <div className="mt-5 flex items-end gap-3 text-white">
        <span className="text-3xl font-bold">
          {priceFormatter.format(deal.currentPrice)}
        </span>
        <span className="text-sm text-white/70 line-through">
          {priceFormatter.format(deal.originalPrice)}
        </span>
      </div>
      {countdown && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white/80">
          <span>⏱️ Offre</span>
          <span>{countdown}</span>
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-medium text-white"
      >
        {deal.ctaLabel}
      </motion.button>
    </motion.article>
  );
}

export function DealsShowcase() {
  return (
    <section id="promotions" className="bg-[#0b1320] py-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Promos à ne pas manquer
            </h2>
            <p className="mt-3 text-gray-300">
              Des offres négociées avec les meilleurs e-shops spécialisés fitness.
            </p>
          </div>
          <p className="text-sm text-gray-400">Actualisées plusieurs fois par jour</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {deals.map((deal, index) => (
            <DealCard key={deal.id} deal={deal} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
