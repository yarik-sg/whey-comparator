"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
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
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white pb-24 pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_top,rgba(255,176,102,0.25),transparent_55%)]" />
      <div className="absolute left-1/2 top-16 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl" aria-hidden />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full space-y-10"
        >
          <span className="inline-flex items-center justify-center rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-500 shadow-sm ring-1 ring-orange-200/60 backdrop-blur">
            Comparateur intelligent
          </span>

          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Trouvez la <span className="text-orange-500">meilleure whey</span>,<br className="hidden sm:inline" /> au meilleur prix.
          </h1>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-600">
            Comparez des centaines de compléments et optimisez vos achats fitness grâce à notre comparateur intelligent.
            Profitez d&apos;un suivi continu des prix pour dénicher l&apos;offre idéale.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-full border border-orange-200/70 bg-white/80 p-2 shadow-xl shadow-orange-100/60 backdrop-blur sm:flex-row sm:items-center sm:p-2.5">
              <label htmlFor="hero-search" className="sr-only">
                Recherche de compléments
              </label>
              <Input
                id="hero-search"
                name="query"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ex : Whey isolat, Optimum Nutrition, créatine monohydrate"
                aria-describedby="popular-searches"
                className="h-14 rounded-full border-none bg-transparent px-6 text-base text-slate-700 placeholder:text-slate-400 focus-visible:ring-orange-300"
              />
              <Button type="submit" size="lg" className="w-full rounded-full sm:w-auto">
                <Search className="mr-2 h-5 w-5" aria-hidden="true" />
                Rechercher
              </Button>
            </div>

            <div
              id="popular-searches"
              className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500"
            >
              <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-orange-400">
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
                  className="rounded-full border border-white/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-orange-200 hover:bg-white hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                  aria-label={`Rechercher ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>

          <p className="text-sm font-medium text-slate-500">
            +900 produits comparés • 70 marques suivies • mises à jour 24/7
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onStartComparison} className="rounded-full px-8 shadow-lg">
              Lancer le comparateur
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={onViewDeals}
              className="rounded-full border border-transparent text-orange-500 hover:border-orange-200 hover:bg-orange-50"
            >
              Voir les promotions
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
