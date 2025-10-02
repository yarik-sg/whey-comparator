import Link from "next/link";

import type { ProductSummary } from "@/types/api";

interface ProductCardProps {
  product: ProductSummary;
  href?: string;
  footer?: React.ReactNode;
}

function formatQuantity(value?: number | null, unit?: string) {
  if (value === null || value === undefined) {
    return "–";
  }

  return `${Number(value).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  })}${unit ? ` ${unit}` : ""}`;
}

export function ProductCard({ product, href, footer }: ProductCardProps) {
  const content = (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:border-orange-400/40 hover:shadow-xl">
      <div className="space-y-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-orange-200/90">
          {product.brand ?? "Produit"}
        </div>
        <h3 className="text-xl font-semibold text-white">{product.name}</h3>
        {product.flavour && (
          <p className="text-sm text-gray-300">Saveur : {product.flavour}</p>
        )}
        <dl className="grid grid-cols-2 gap-3 text-sm text-gray-200">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">
              Protéines / dose
            </dt>
            <dd className="font-semibold">
              {formatQuantity(product.protein_per_serving_g, "g")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">
              Taille de portion
            </dt>
            <dd className="font-semibold">
              {formatQuantity(product.serving_size_g, "g")}
            </dd>
          </div>
        </dl>
      </div>
      {footer && <div className="mt-6 border-t border-white/10 pt-4 text-sm text-gray-300">{footer}</div>}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
        {content}
      </Link>
    );
  }

  return content;
}
