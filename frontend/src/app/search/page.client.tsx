"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  type CombinedSearchResults,
  type SearchSection,
  fetchCombinedSearchResults,
  isSearchResultsEmpty,
  summarizeSearchItem,
} from "@/lib/searchService";

export default function SearchPage() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState<CombinedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchCombinedSearchResults(query, { signal: controller.signal, limit: 12 })
      .then((payload) => {
        setResults(payload);
        setError(null);
      })
      .catch((cause) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(cause instanceof Error ? cause.message : "Recherche indisponible");
        setResults(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [query]);

  const sections = useMemo(
    () => [
      { key: "products" as SearchSection, label: "Produits" },
      { key: "gyms" as SearchSection, label: "Salles" },
      { key: "programmes" as SearchSection, label: "Programmes" },
    ],
    [],
  );

  if (!query) {
    return <p className="mt-20 text-center">Entrez une recherche.</p>;
  }

  if (isLoading) {
    return <p className="mt-20 text-center">Chargement...</p>;
  }

  if (error) {
    return <p className="mt-20 text-center text-red-500">{error}</p>;
  }

  if (!results || isSearchResultsEmpty(results)) {
    return <p className="mt-20 text-center">Aucun résultat pour «&nbsp;{query}&nbsp;».</p>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-10">
      {sections.map(({ key, label }) => {
        const items = results[key] ?? [];
        if (items.length === 0) {
          return null;
        }

        return (
          <section key={key}>
            <h2 className="mb-4 text-2xl font-bold capitalize text-primary">{label}</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item, index) => {
                const summary = summarizeSearchItem(key, item as Record<string, unknown>);

                return (
                  <Card key={`${key}-${index}`} className="p-4">
                    <h3 className="font-semibold">{summary.title}</h3>
                    {summary.subtitle ? <p className="text-sm text-muted">{summary.subtitle}</p> : null}
                    {summary.details ? <p className="text-xs text-muted">{summary.details}</p> : null}
                    {summary.price ? <p className="mt-2 text-sm font-semibold">{summary.price}</p> : null}
                    {summary.link ? (
                      <a href={summary.link} className="text-primary" rel="noreferrer">
                        Voir
                      </a>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
