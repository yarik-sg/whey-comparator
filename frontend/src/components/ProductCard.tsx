"use client";

import { useState } from "react";
import Link from "next/link";
import { Award } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductSummary } from "@/types/api";

function pickImageUrl(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

function getProductImage(product: ProductSummary): { src: string; alt: string } | null {
  const imageUrl = pickImageUrl(
    product.image_url,
    product.image,
    product.bestDeal?.image,
  );
  const resolvedUrl = imageUrl;

  if (!resolvedUrl) {
    return null;
  }

  const altText = `${product.brand ? `${product.brand} ` : ""}${product.name}`.trim();

  return {
    src: resolvedUrl,
    alt: altText.length > 0 ? altText : "Photo du produit",
  };
}

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
  const footerNode =
    footer && (
      <CardFooter className="border-t border-slate-200 pt-4 text-sm text-slate-500">{footer}</CardFooter>
    );

  const canonicalId = product.product_id ?? String(product.id);
  const resolvedHref = href ?? (canonicalId ? `/products/${encodeURIComponent(canonicalId)}` : undefined);

  const productImage = getProductImage(product);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = productImage && !imageFailed;
  const bestPriceAmount =
    typeof product.bestPrice?.amount === "number" ? product.bestPrice.amount : null;
  const formattedBestPrice =
    product.bestPrice?.formatted ??
    (bestPriceAmount !== null && product.bestPrice?.currency
      ? `${bestPriceAmount.toFixed(2)} ${product.bestPrice.currency}`
      : bestPriceAmount !== null
        ? `${bestPriceAmount.toFixed(2)} €`
        : "—");
  const originalPriceFormatted = product.originalPrice?.formatted ?? null;
  const discountValue =
    typeof product.discount === "number" && !Number.isNaN(product.discount)
      ? Math.round(product.discount)
      : null;
  const isBestPrice = Boolean(
    product.isBestPrice ?? product.bestDeal?.isBestPrice ?? false,
  );

  const bodyContent = (
    <>
      <CardHeader className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl bg-slate-50">
          {isBestPrice && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              <Award className="h-3.5 w-3.5" aria-hidden />
              <span>Meilleur prix</span>
            </div>
          )}
          {discountValue !== null && (
            <div className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-1 text-xs font-bold text-white">
              -{discountValue}%
            </div>
          )}
          <div className="flex aspect-[4/3] w-full items-center justify-center p-6">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote catalogue assets
              <img
                src={productImage.src}
                alt={productImage.alt}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-slate-400">
                <span aria-hidden className="text-2xl">
                  📦
                </span>
                <span>Image indisponible</span>
              </span>
            )}
          </div>
          <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-500 shadow">
            {product.brand ?? "Produit"}
          </div>
        </div>
        <div className="space-y-3">
          <CardTitle className="text-lg font-semibold text-slate-900">{product.name}</CardTitle>
          {product.flavour && (
            <p className="text-sm text-slate-500">Saveur : {product.flavour}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        <div className="grid gap-4 rounded-3xl border border-orange-100 bg-orange-50/60 p-4 text-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500/80">Meilleur prix</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{formattedBestPrice}</p>
                {originalPriceFormatted && (
                  <span className="text-sm text-slate-400 line-through">{originalPriceFormatted}</span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>{product.bestVendor ?? "Vendeur"}</p>
              {product.inStock !== undefined && product.inStock !== null && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <span aria-hidden>{product.inStock ? "🟢" : "🔴"}</span>
                  <span className="text-slate-500">{product.inStock ? "En stock" : "Rupture"}</span>
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <span className="block uppercase tracking-wide text-[11px] text-slate-400">Protéines/€</span>
              <span className="text-base font-semibold text-slate-900">
                {typeof product.proteinPerEuro === "number"
                  ? `${product.proteinPerEuro.toFixed(2)} g`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="block uppercase tracking-wide text-[11px] text-slate-400">Note</span>
              <span className="text-base font-semibold text-slate-900">
                {typeof product.rating === "number" ? `${product.rating.toFixed(1)} ★` : "—"}
              </span>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Protéines / dose
            </dt>
            <dd className="font-semibold text-slate-900">
              {formatQuantity(product.protein_per_serving_g, "g")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Taille de portion
            </dt>
            <dd className="font-semibold text-slate-900">
              {formatQuantity(product.serving_size_g, "g")}
            </dd>
          </div>
        </dl>
      </CardContent>
    </>
  );

  const cardBody = resolvedHref ? (
    <Link
      href={resolvedHref}
      className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
    >
      {bodyContent}
    </Link>
  ) : (
    <div className="flex flex-1 flex-col">{bodyContent}</div>
  );

  return (
    <article className="h-full">
      <Card className="flex h-full flex-col justify-between border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        {cardBody}
        {footerNode}
      </Card>
    </article>
  );
}
