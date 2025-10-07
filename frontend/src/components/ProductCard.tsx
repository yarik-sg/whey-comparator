"use client";

import { useState } from "react";
import Link from "next/link";

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

function formatBestPrice(price: ProductSummary["bestPrice"]) {
  if (!price) {
    return "—";
  }
  if (price.formatted) {
    return price.formatted;
  }
  if (typeof price.amount === "number") {
    return `${price.amount.toFixed(2)} ${price.currency ?? "€"}`;
  }
  return "—";
}

export function ProductCard({ product, href, footer }: ProductCardProps) {
  const footerNode =
    footer && <div className="mt-6 border-t border-white/10 pt-4 text-sm text-gray-300">{footer}</div>;

  const productImage = getProductImage(product);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = productImage && !imageFailed;

  const body = (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-slate-900/60 p-4">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote catalogue assets
              <img
                src={productImage.src}
                alt={productImage.alt}
                className="h-full w-full object-contain object-center drop-shadow-sm"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-gray-400">
                <span aria-hidden className="text-lg">
                  📦
                </span>
                <span>Image indisponible</span>
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 inline-flex items-center rounded-full bg-black/60 px-3 py-1 text-xs text-orange-200 shadow-md">
            {product.brand ?? "Produit"}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">{product.name}</h3>
          {product.flavour && (
            <p className="text-sm text-gray-300">Saveur : {product.flavour}</p>
          )}
          <div className="rounded-xl bg-white/5 p-3 text-sm text-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Meilleur prix</p>
                <p className="text-lg font-semibold text-white">{formatBestPrice(product.bestPrice)}</p>
              </div>
              <div className="text-right text-xs text-gray-300">
                <p>{product.bestVendor ?? "Vendeur"}</p>
                {product.inStock !== undefined && product.inStock !== null && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-200">
                    <span aria-hidden>{product.inStock ? "✅" : "❌"}</span>
                    <span className="sr-only">{product.inStock ? "Disponible" : "Indisponible"}</span>
                    <span className="text-gray-300">{product.inStock ? "En stock" : "Rupture"}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-gray-300">
              <div>
                <span className="block uppercase tracking-wide text-[11px] text-gray-500">Protéines/€</span>
                <span className="font-semibold text-white">
                  {typeof product.proteinPerEuro === "number"
                    ? `${product.proteinPerEuro.toFixed(2)} g`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="block uppercase tracking-wide text-[11px] text-gray-500">Note</span>
                <span className="font-semibold text-white">
                  {typeof product.rating === "number" ? `${product.rating.toFixed(1)} ★` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );

  if (href) {
    return (
      <article className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:border-orange-400/40 hover:shadow-xl">
        <Link
          href={href}
          className="flex h-full flex-1 flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          {body}
        </Link>
        {footerNode}
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:border-orange-400/40 hover:shadow-xl">
      {body}
      {footerNode}
    </article>
  );
}
