"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useMemo, useState } from "react";

interface HeroSectionProps {
  onStartComparison: () => void;
  onViewDeals: () => void;
}

export function HeroSection({ onStartComparison, onViewDeals }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const popularSearches = useMemo(
    () => ["Whey isolate chocolat", "Protéine vegan", "Optimum Nutrition", "Isolate sans lactose"],
    [],
  );

  const handleSearch = useCallback(
    (query?: string) => {
      const trimmedQuery = (query ?? searchQuery).trim();
      if (!trimmedQuery) {
        return;
      }

      router.push(`/comparateur?q=${encodeURIComponent(trimmedQuery)}`);
    },
    [router, searchQuery],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSearch();
    },
    [handleSearch],
  );

  return (
    <section className="relative overflow-hidden py-24 bg-gradient-to-br from-[#0d1b2a] via-[#1b263b] to-[#415a77] text-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="uppercase tracking-[0.3em] text-sm text-orange-400 mb-4">Comparateur nouvelle génération</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Ne payez plus jamais votre whey au prix fort
          </h1>
          <p className="mt-6 text-lg text-gray-200">
            Sport Comparator agrège les meilleures boutiques en ligne pour vous proposer
            des suppléments, équipements et tenues de sport au meilleur tarif, en temps réel.
          </p>
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <div>
              <label htmlFor="hero-search" className="sr-only">
                Recherche de compléments
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="hero-search"
                  name="query"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Recherchez une whey par marque, type ou objectif"
                  className="w-full rounded-full border border-white/10 bg-white/90 px-6 py-4 text-base text-slate-900 placeholder:text-slate-500 shadow-lg focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  aria-describedby="popular-searches"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 rounded-full bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Rechercher
                </button>
              </div>
            </div>
            <div id="popular-searches" className="flex flex-wrap items-center gap-2 text-sm text-gray-200">
              <span className="mr-2 font-medium uppercase tracking-wide text-xs text-orange-200">
                Recherches populaires :
              </span>
              {popularSearches.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-orange-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-slate-900"
                  aria-label={`Rechercher ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onStartComparison}
              className="rounded-full bg-orange-500 hover:bg-orange-400 transition-colors px-8 py-3 font-semibold shadow-lg"
            >
              Lancer le comparateur
            </button>
            <button
              onClick={onViewDeals}
              className="rounded-full border border-white/40 hover:border-orange-300 hover:text-orange-200 transition-colors px-8 py-3 font-semibold"
            >
              Voir les promos
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
