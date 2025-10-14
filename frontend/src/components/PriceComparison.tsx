import { cn } from "@/lib/utils";
import type { DealItem } from "@/types/api";
import { OfferTable } from "./OfferTable";

interface PriceComparisonProps {
  offers: DealItem[];
  className?: string;
  title?: string;
  caption?: string;
  description?: string;
}

export function PriceComparison({
  offers,
  className,
  title = "Comparateur de prix",
  caption = "Meilleures offres",
  description = "Analyse temps réel des vendeurs avec frais de livraison inclus.",
}: PriceComparisonProps) {
  const containerClass = cn(
    "space-y-4 rounded-3xl border border-accent/70 bg-background p-6 shadow-neo",
    className,
  );

  return (
    <section className={containerClass} aria-labelledby="price-comparison-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="price-comparison-heading"
            className="text-lg font-semibold text-dark"
          >
            {title}
          </h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <span aria-hidden>🏷️</span>
          <span>Livraison incluse</span>
        </div>
      </div>

      <OfferTable offers={offers} caption={caption} />
    </section>
  );
}
