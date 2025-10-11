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
    "space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
    className,
  );

  return (
    <section className={containerClass} aria-labelledby="price-comparison-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="price-comparison-heading"
            className="text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
          <span aria-hidden>🏷️</span>
          <span>Livraison incluse</span>
        </div>
      </div>

      <OfferTable offers={offers} caption={caption} />
    </section>
  );
}
