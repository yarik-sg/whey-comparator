"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type CombinedSearchResults,
  type SearchSection,
  EMPTY_SEARCH_RESULTS,
  fetchCombinedSearchResults,
  isSearchResultsEmpty,
  summarizeSearchItem,
} from "@/lib/searchService";

interface SearchModalProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
}

const DEBOUNCE_DELAY = 300;

export function SearchModal({ query, isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [results, setResults] = useState<CombinedSearchResults>(EMPTY_SEARCH_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setResults(EMPTY_SEARCH_RESULTS);
      setIsLoading(false);
      setError(null);
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!debouncedQuery) {
      setResults(EMPTY_SEARCH_RESULTS);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchCombinedSearchResults(debouncedQuery, { signal: controller.signal, limit: 6 })
      .then((payload) => {
        setResults(payload);
        setError(null);
      })
      .catch((cause) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(cause instanceof Error ? cause.message : "Recherche indisponible");
        setResults(EMPTY_SEARCH_RESULTS);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const { style } = document.body;
    const originalOverflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const sections = useMemo<Array<{ key: SearchSection; label: string }>>(
    () => [
      { key: "products", label: "Produits" },
      { key: "gyms", label: "Salles" },
      { key: "programmes", label: "Programmes" },
    ],
    [],
  );

  const handleOverlayClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleViewAll = useCallback(() => {
    if (!query.trim()) {
      return;
    }
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [onClose, query, router]);

  if (!isOpen) {
    return null;
  }

  const emptyState = !isLoading && !error && isSearchResultsEmpty(results);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-16 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-search-title"
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-background text-[color:var(--text)] shadow-neo dark:border-white/5 dark:bg-dark">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 dark:border-white/5">
          <div>
            <p id="live-search-title" className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">
              Recherche instantanée
            </p>
            <p className="text-lg font-semibold text-primary">
              {query.trim() ? `Résultats pour « ${query.trim()} »` : "Commencez à taper pour chercher"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-transparent p-2 text-muted transition hover:border-primary/30 hover:text-primary"
            onClick={onClose}
            aria-label="Fermer la recherche"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <p>Analyse des meilleures offres…</p>
            </div>
          ) : error ? (
            <p className="py-8 text-center text-red-500">{error}</p>
          ) : emptyState ? (
            <p className="py-8 text-center text-muted">Aucun résultat pour cette recherche.</p>
          ) : (
            <div className="space-y-8">
              {sections.map(({ key, label }) => {
                const items = results[key] ?? [];
                if (items.length === 0) {
                  return null;
                }

                return (
                  <section key={key}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">{label}</h3>
                    <div className="space-y-3">
                      {items.map((item, index) => {
                        const summary = summarizeSearchItem(key, item as Record<string, unknown>);
                        const link = summary.link;
                        const content = (
                          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-white dark:border-white/5 dark:bg-[rgba(15,23,42,0.85)] dark:hover:border-primary/40">
                            <p className="font-semibold text-primary dark:text-white">{summary.title}</p>
                            {summary.subtitle ? <p className="text-sm text-muted">{summary.subtitle}</p> : null}
                            {summary.details ? <p className="text-xs text-muted">{summary.details}</p> : null}
                            {summary.price ? <p className="text-sm font-semibold text-dark dark:text-text-1">{summary.price}</p> : null}
                          </div>
                        );

                        if (link) {
                          return (
                            <a
                              key={`${key}-${index}`}
                              href={link}
                              className="block"
                              onClick={onClose}
                              rel="noreferrer"
                            >
                              {content}
                            </a>
                          );
                        }

                        return (
                          <div key={`${key}-${index}`} className="block">
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 bg-white/70 px-6 py-4 dark:border-white/5 dark:bg-[rgba(15,23,42,0.85)]">
          <p className="text-xs text-muted">Appuyez sur Échap pour fermer</p>
          <Button variant="secondary" onClick={handleViewAll} disabled={!query.trim()}>
            Voir tous les résultats
          </Button>
        </footer>
      </div>
    </div>
  );
}
