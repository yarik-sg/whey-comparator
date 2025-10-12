"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import Image from "next/image";
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
    () => ["Whey isolate chocolat", "Protéine vegan", "Optimum Nutrition", "Créatine monohydrate"],
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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF6ED] via-[#FFF0E0] to-background text-text transition-colors dark:bg-dark">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,186,120,0.32),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(255,214,183,0.5),transparent_72%)] opacity-90 dark:bg-[radial-gradient(circle_at_18%_22%,rgba(255,148,77,0.12),transparent_60%),radial-gradient(circle_at_85%_10%,rgba(17,24,39,0.65),transparent_68%)]" aria-hidden />
        <div className="absolute inset-x-0 top-[-20%] h-[70%] rounded-[50%] bg-gradient-to-b from-[#FFE6CF]/90 via-[#FFF3E4]/50 to-transparent blur-3xl" aria-hidden />
        <div className="absolute inset-x-0 bottom-[-35%] h-[60%] bg-gradient-to-t from-[#FFD7AF]/50 via-transparent to-transparent blur-[120px]" aria-hidden />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl dark:bg-primary/30" aria-hidden />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-secondary/70 blur-[140px] dark:bg-accent/50" aria-hidden />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-16 px-6 py-24 text-center sm:px-8 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-2xl flex-col items-center justify-center gap-8"
        >
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-sm ring-1 ring-primary/20">
            Fitness Intelligent
          </span>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h1 className="text-4xl font-semibold leading-tight text-dark dark:text-white sm:text-5xl lg:text-6xl">
              Trouvez les meilleures <span className="text-primary">Offres</span>,<br className="hidden sm:inline" /> au meilleur prix.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-dark/80 dark:text-gray-300">
              Comparez, suivez et optimisez vos achats fitness grâce à Fitidion, la plateforme du Fitness Intelligent.
            </p>
          </div>

            <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col items-center gap-4">
              <div className="flex w-full flex-col gap-2 rounded-[2.75rem] border border-white/60 bg-white/95 p-3 shadow-md transition hover:shadow-xl dark:border-white/10 dark:bg-[#0f172a] sm:flex-row sm:items-center sm:gap-3">
                <label htmlFor="hero-search" className="sr-only">
                  Recherche de compléments
                </label>
                <div className="relative flex w-full items-center">
                  <Search className="pointer-events-none absolute left-5 h-5 w-5 text-primary" aria-hidden="true" />
                  <Input
                    id="hero-search"
                    name="query"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Ex : Whey isolate, créatine, ou BasicFit Paris…"
                    aria-describedby="popular-searches"
                    className="h-14 w-full rounded-full border-0 bg-transparent pl-12 pr-4 text-base text-dark placeholder:text-dark/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:text-white dark:placeholder:text-gray-300"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary via-[#FF8A3D] to-[#FF6B2C] px-7 text-base font-semibold text-white shadow-lg transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 sm:w-auto"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-20" aria-hidden />
                  <Search className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                  Rechercher
                </Button>
              </div>

              <div id="popular-searches" className="flex w-full flex-wrap items-center justify-center gap-3 md:justify-start">
                {popularSearches.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-dark transition hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-white"
                    aria-label={`Rechercher ${suggestion}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>

            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                onClick={onViewDeals}
                className="group flex items-center gap-3 rounded-full border border-transparent bg-gradient-to-r from-primary via-[#FF8A3D] to-[#FF6B2C] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 dark:hover:brightness-110"
              >
                Voir les promotions
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
              <button
                type="button"
                onClick={onStartComparison}
                className="text-sm font-semibold text-dark/70 underline-offset-4 transition hover:text-primary hover:underline dark:text-gray-300"
              >
                Lancer le comparateur intelligent
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }
