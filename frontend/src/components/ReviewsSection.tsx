"use client";

import { useMemo } from "react";

import { useProductReviews } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ReviewsSectionProps {
  productId: number;
  className?: string;
}

function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

export function ReviewsSection({ productId, className }: ReviewsSectionProps) {
  const { data, isLoading, isError } = useProductReviews(productId);

  const distribution = useMemo(() => data?.distribution ?? [], [data]);
  const highlights = data?.highlights ?? [];

  return (
    <section
      className={cn(
        "space-y-6 rounded-3xl border border-accent/70 bg-background p-6 text-sm text-dark shadow-neo dark:border-[var(--text)]/20 dark:bg-dark/80 dark:text-[var(--text)]",
        className,
      )}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-[var(--text)]">Avis utilisateurs</h2>
          <p className="text-xs text-muted">
            Notes agrégées depuis SerpAPI (Google Shopping) et nos marchands partenaires.
          </p>
        </div>
        {data && (
          <div className="rounded-2xl bg-accent px-4 py-3 text-right text-dark dark:bg-[var(--secondary)]/80 dark:text-[var(--text)]">
            <p className="text-3xl font-semibold text-dark dark:text-[var(--text)]">
              {data.averageRating ? data.averageRating.toFixed(1) : "—"}
              <span className="ml-1 text-base text-primary/70">★</span>
            </p>
            <p className="text-xs text-muted">
              {data.reviewsCount.toLocaleString("fr-FR")} avis • {data.sources} source{data.sources > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </header>

      {isLoading && <div className="h-32 animate-pulse rounded-2xl bg-accent" aria-hidden />}

      {isError && (
        <p className="rounded-xl border border-primary/40 bg-accent px-4 py-3 text-sm text-primary">
          Impossible de charger les avis pour ce produit pour le moment.
        </p>
      )}

      {!isLoading && !isError && data && (
        <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          <dl className="space-y-3">
            {distribution.map((bucket) => (
              <div key={bucket.stars} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-dark dark:text-[var(--text)]">{bucket.stars}★</span>
                  </span>
                  <span>{bucket.count.toLocaleString("fr-FR")}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: formatPercentage(bucket.percentage) }}
                  />
                </div>
              </div>
            ))}
          </dl>

          {highlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <article
                  key={highlight.id}
                  className="flex h-full flex-col rounded-2xl bg-accent p-4 text-sm text-dark shadow-sm dark:bg-[var(--secondary)]/80 dark:text-[var(--text)]"
                >
                  <header className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-primary/70">{highlight.source}</p>
                    <h3 className="text-base font-semibold text-dark dark:text-[var(--text)]">{highlight.title}</h3>
                    <p className="text-sm font-semibold text-primary/70">{highlight.rating.toFixed(1)} ★</p>
                  </header>
                  <p className="mt-3 flex-1 text-sm text-muted dark:text-[var(--text-2)]">{highlight.summary}</p>
                  {highlight.url && (
                    <a
                      href={highlight.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-primary/80"
                    >
                      Lire la source →
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-accent p-4 text-sm text-muted">
              Pas encore d'avis consolidés pour ce produit.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

