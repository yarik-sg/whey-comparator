"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { EquipmentCard } from "@/components/EquipmentCard";
import { GymCard } from "@/components/GymCard";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import type { ProductSummary, ProgramSummary, EquipmentSummary } from "@/types/api";
import { normalizeApiGymLocation, type ApiGymLocation } from "@/lib/gymLocator";

interface UnifiedSearchResponse {
  products: ProductSummary[];
  gyms: ApiGymLocation[];
  programs: ProgramSummary[];
  equipments: EquipmentSummary[];
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const normalizedQuery = queryParam.trim();

  const [searchInput, setSearchInput] = useState(queryParam);
  const [results, setResults] = useState<UnifiedSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!normalizedQuery) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const fetchResults = async () => {
      try {
        const response = await fetch(
          `/api/proxy?target=search&q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Impossible de charger les résultats (code ${response.status}).`);
        }

        const payload: UnifiedSearchResponse = await response.json();
        setResults(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Une erreur est survenue pendant la recherche.";
        setError(message);
        setResults(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => controller.abort();
  }, [normalizedQuery]);

  const normalizedGyms = useMemo(
    () => (results?.gyms ? results.gyms.map(normalizeApiGymLocation) : []),
    [results?.gyms],
  );
  const products = results?.products ?? [];
  const programs = results?.programs ?? [];
  const equipments = results?.equipments ?? [];

  const hasAnyResults =
    products.length > 0 ||
    normalizedGyms.length > 0 ||
    programs.length > 0 ||
    equipments.length > 0;

  const handleSearchSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        router.push("/search");
        return;
      }

      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-background text-dark dark:bg-dark dark:text-[var(--text)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-dark dark:text-[var(--text)]">
            Moteur de recherche FitIdion
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted dark:text-[var(--text-2)]">
            {normalizedQuery
              ? `Résultats pour « ${normalizedQuery} »`
              : "Recherchez des compléments, des salles de sport, des programmes ou des équipements en un seul endroit."}
          </p>
          <div className="mx-auto max-w-3xl">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="mt-12 space-y-12">
          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-left text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </div>
          ) : null}

          {!normalizedQuery && !isLoading ? (
            <div className="rounded-3xl border border-accent/60 bg-accent p-6 text-left text-sm text-muted dark:border-accent-d/40 dark:bg-[rgba(148,163,184,0.12)] dark:text-[var(--text-2)]">
              Tapez un mot-clé pour explorer nos produits, programmes, équipements et gyms partenaires.
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span className="text-sm font-semibold">Analyse des résultats…</span>
            </div>
          ) : null}

          {!isLoading && normalizedQuery && !hasAnyResults && !error ? (
            <div className="rounded-3xl border border-accent/60 bg-background/90 px-6 py-8 text-center text-sm text-muted dark:border-accent-d/40 dark:bg-dark/80 dark:text-[var(--text-2)]">
              Aucun résultat trouvé pour « {normalizedQuery} »
            </div>
          ) : null}

          {hasAnyResults ? (
            <div className="space-y-16">
              {products.length > 0 ? (
                <section className="space-y-6">
                  <header className="flex flex-col gap-2 text-left sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-2xl font-semibold text-primary">Produits</h2>
                    <span className="text-sm text-muted">{products.length} résultat{products.length > 1 ? "s" : ""}</span>
                  </header>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ) : null}

              {normalizedGyms.length > 0 ? (
                <section className="space-y-6">
                  <header className="flex flex-col gap-2 text-left sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-2xl font-semibold text-primary">Gyms</h2>
                    <span className="text-sm text-muted">
                      {normalizedGyms.length} résultat{normalizedGyms.length > 1 ? "s" : ""}
                    </span>
                  </header>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {normalizedGyms.map((gym) => (
                      <GymCard key={gym.id} gym={gym} />
                    ))}
                  </div>
                </section>
              ) : null}

              {programs.length > 0 ? (
                <section className="space-y-6">
                  <header className="flex flex-col gap-2 text-left sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-2xl font-semibold text-primary">Programmes</h2>
                    <span className="text-sm text-muted">{programs.length} programme{programs.length > 1 ? "s" : ""}</span>
                  </header>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {programs.map((program) => (
                      <ProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                </section>
              ) : null}

              {equipments.length > 0 ? (
                <section className="space-y-6">
                  <header className="flex flex-col gap-2 text-left sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-2xl font-semibold text-primary">Équipements</h2>
                    <span className="text-sm text-muted">
                      {equipments.length} équipement{equipments.length > 1 ? "s" : ""}
                    </span>
                  </header>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {equipments.map((equipment) => (
                      <EquipmentCard key={equipment.id} equipment={equipment} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
