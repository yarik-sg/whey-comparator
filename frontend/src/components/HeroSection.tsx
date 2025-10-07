"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <section className="relative overflow-hidden bg-white pb-24 pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-br from-orange-50 via-white to-white" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr,0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
            Comparateur nouvelle génération
          </div>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Le meilleur prix pour vos compléments sportifs
          </h1>
          <p className="text-lg leading-relaxed text-slate-600">
            Accédez instantanément aux offres les plus compétitives sur la whey, les protéines végétales
            ou les packs de nutrition. Analysez les notes, les économies et les tendances pour acheter au moment idéal.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-search" className="sr-only">
                Recherche de compléments
              </label>
              <Input
                id="hero-search"
                name="query"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Recherchez une whey par marque, objectif ou type"
                aria-describedby="popular-searches"
                className="h-14 rounded-full border-orange-100 bg-white shadow-md"
              />
              <Button type="submit" size="lg" className="sm:w-auto">
                Rechercher
              </Button>
            </div>
            <div
              id="popular-searches"
              className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
            >
              <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
                Recherches populaires
              </span>
              {popularSearches.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                  aria-label={`Rechercher ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onStartComparison} className="shadow-md">
              Lancer le comparateur
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={onViewDeals}
              className="border border-slate-200"
            >
              Voir les promotions
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-100 bg-white shadow-2xl">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-orange-100 blur-3xl" aria-hidden />
            <div className="space-y-6 p-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
                Aperçu en temps réel
              </p>
              <div className="space-y-4">
                <div className="rounded-3xl bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-500">Promo flash</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Whey Isolate 1,5kg</p>
                  <p className="text-sm text-slate-500">-18% vs prix moyen du mois dernier</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200/80 p-4 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Prix moyen</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">27,90 €</p>
                    <p className="text-xs text-green-500">-2,4% cette semaine</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/80 p-4 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Marchands suivis</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">18</p>
                    <p className="text-xs text-slate-400">Actualisation toutes les 2h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
