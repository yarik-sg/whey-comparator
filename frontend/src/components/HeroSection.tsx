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
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_20%,rgba(255,102,0,0.85),rgba(255,232,209,0.85))] pb-28 pt-24 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_60%)]" aria-hidden />
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-secondary/40 blur-[120px]" aria-hidden />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full space-y-10"
        >
          <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 shadow-lg shadow-fitidion-orange/10 ring-1 ring-white/20 backdrop-blur">
            Comparateur intelligent
          </span>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Trouvez la <span className="text-secondary">meilleure whey</span>,<br className="hidden sm:inline" /> au meilleur prix.
          </h1>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/80">
            Comparez des centaines de compléments et optimisez vos achats fitness grâce à notre comparateur intelligent.
            Profitez d&apos;un suivi continu des prix pour dénicher l&apos;offre idéale.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-full border border-white/20 bg-white/10 p-2 shadow-glow backdrop-blur-xl sm:flex-row sm:items-center sm:p-2.5">
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
                className="h-14 rounded-full border-white/20 bg-transparent px-6 text-base text-white placeholder:text-white/60 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              />
              <Button type="submit" size="lg" className="w-full rounded-full sm:w-auto">
                <Search className="mr-2 h-5 w-5" aria-hidden="true" />
                Rechercher
              </Button>
            </div>

            <div
              id="popular-searches"
              className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70"
            >
              <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-white/70">
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
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 shadow-lg shadow-fitidion-orange/10 transition hover:border-white/40 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  aria-label={`Rechercher ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>

          <p className="text-sm font-medium text-white/70">
            +900 produits comparés • 70 marques suivies • mises à jour 24/7
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onStartComparison} className="rounded-full px-8 shadow-glow">
              Lancer le comparateur
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={onViewDeals}
              className="rounded-full border border-white/20 bg-white/0 text-white hover:border-white/40 hover:bg-white/10"
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
