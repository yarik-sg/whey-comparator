"use client";

import { motion, animate } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SearchBar } from "@/components/SearchBar";
import { SearchModal } from "@/components/SearchModal";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStartComparison: () => void;
  onViewDeals: () => void;
}

export function HeroSection({ onStartComparison, onViewDeals }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const popularSearches = useMemo(
    () => ["Whey isolate chocolat", "Protéine vegan", "Optimum Nutrition", "Créatine monohydrate"],
    [],
  );

  const heroLogos = useMemo(
    () => [
      {
        name: "MyProtein",
        logo: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/myprotein-logo.svg",
      },
      {
        name: "Prozis",
        logo: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/prozis-logo.svg",
      },
      {
        name: "Amazon",
        logo: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/amazon-logo.svg",
      },
      {
        name: "Optimum Nutrition",
        logo: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/optimum-nutrition-logo.svg",
      },
      {
        name: "Decathlon",
        logo: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/decathlon-coach-logo.svg",
      },
    ],
    [],
  );

  const counters = useMemo(
    () => [
      { value: 900, prefix: "+", suffix: "", label: "produits comparés" },
      { value: 70, prefix: "", suffix: "+", label: "marques suivies" },
      { value: 24, prefix: "", suffix: "/7", label: "mises à jour" },
    ],
    [],
  );

  const handleSearch = useCallback(
    (query?: string) => {
      const trimmedQuery = (query ?? searchQuery).trim();
      if (!trimmedQuery) {
        return;
      }

      setIsSearchModalOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    },
    [router, searchQuery],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearchModalOpen(value.trim().length > 0);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) {
      setIsSearchModalOpen(true);
    }
  }, [searchQuery]);

  const handleSearchModalClose = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearchModalOpen(false);
    }
  }, [searchQuery]);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-b from-orange-50 via-orange-50/40 to-white pb-16 pt-20 text-text transition-colors dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#0a0f1f] sm:pt-24"
    >
      {/* Le hero utilise désormais un simple dégradé pour rester léger et fiable sur mobile. */}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 text-center sm:px-8 md:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-3xl flex-col items-center gap-8"
        >
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-primary shadow-sm ring-1 ring-primary/20">
            La plateforme du Fitness Intelligent
          </span>

          <div className="space-y-5">
            <h1 className="font-heading text-3xl font-semibold leading-tight text-[color:var(--text)] sm:text-4xl lg:text-4xl">
              Trouvez les meilleurs produits, au meilleur prix.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-[color:var(--text)]/80 sm:text-lg">
              Comparez des centaines de compléments, suivez les variations de prix et économisez sur chacune de vos commandes fitness.
            </p>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            suggestions={popularSearches}
            onSuggestionSelect={(suggestion) => handleSearch(suggestion)}
            onSubmit={(value) => handleSearch(value)}
            onFocus={handleSearchFocus}
            placeholder="Rechercher un produit, un gym, un programme…"
          />
          <SearchModal query={searchQuery} isOpen={isSearchModalOpen} onClose={handleSearchModalClose} />

          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/30 bg-white/60 px-6 py-4 text-xs uppercase tracking-[0.28em] text-muted shadow-sm backdrop-blur">
              {heroLogos.map(({ name, logo }) => (
                <span key={name} className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <Image
                      src={logo}
                      alt={`Logo ${name}`}
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                      loading="lazy"
                    />
                  </span>
                  {name}
                </span>
              ))}
            </div>

            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              {counters.map(({ value, prefix, suffix, label }) => (
                <HeroCounter key={label} value={value} prefix={prefix} suffix={suffix} label={label} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={onViewDeals} className="group inline-flex items-center gap-3 px-8 py-3 text-base">
              Voir toutes les offres
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <button
              type="button"
              onClick={onStartComparison}
              className="text-sm font-semibold text-[color:var(--text)]/70 underline-offset-4 transition hover:text-primary hover:underline"
            >
              Lancer le comparateur intelligent
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroCounter({
  value,
  prefix = "",
  suffix = "",
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => {
      controls.stop();
    };
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/40 bg-[color:var(--accent)]/90 p-5 text-center shadow-soft backdrop-blur"
    >
      <motion.span className="text-3xl font-semibold text-[color:var(--text)]">
        {prefix}
        {displayValue}
        {suffix}
      </motion.span>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.32em] text-muted">{label}</p>
    </motion.div>
  );
}
