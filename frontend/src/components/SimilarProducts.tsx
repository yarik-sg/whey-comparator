import { CompareLinkButton } from "@/components/CompareLinkButton";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { getCanonicalProductId } from "@/lib/productIdentifiers";
import type { ProductIdentifierCandidate } from "@/lib/productIdentifiers";
import type { ProductSummary } from "@/types/api";

interface SimilarProductsProps {
  products: ProductSummary[];
  currentProductId?: ProductIdentifierCandidate;
  buildComparisonHref: (
    ...productIds: ProductIdentifierCandidate[]
  ) => string;
  title?: string;
  description?: string;
  className?: string;
}

export function SimilarProducts({
  products,
  currentProductId,
  buildComparisonHref,
  title = "Produits similaires",
  description = "Basés sur la marque, la catégorie et la performance nutritionnelle.",
  className,
}: SimilarProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
        className,
      )}
      aria-labelledby="similar-products-heading"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="similar-products-heading"
            className="text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
          <span aria-hidden>🧮</span>
          <span>Score affinité</span>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => {
          const canonicalId =
            getCanonicalProductId(product) ?? String(product.id ?? "");
          const href = `/products/${encodeURIComponent(canonicalId)}`;
          const comparisonHref = buildComparisonHref(
            currentProductId,
            canonicalId,
          );

          return (
            <ProductCard
              key={canonicalId}
              product={product}
              href={href}
              footer={
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>ID #{canonicalId}</span>
                  <CompareLinkButton
                    href={comparisonHref}
                    className="inline-flex items-center gap-1 font-semibold text-orange-600 transition hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                    aria-label={`Comparer avec ${product.name}`}
                    title={`Comparer avec ${product.name}`}
                  >
                    Comparer →
                  </CompareLinkButton>
                </div>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
