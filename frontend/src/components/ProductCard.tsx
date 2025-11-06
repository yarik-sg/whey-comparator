"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, Heart } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getCanonicalProductId } from "@/lib/productIdentifiers";
import type { ProductSummary } from "@/types/api";
import {
  isProductFavorite,
  useFavoritesStore,
} from "@/store/favoritesStore";
import { useAnalytics } from "@/hooks/useAnalytics";

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
  footer?: ReactNode;
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
      <CardFooter className="border-t border-accent/60 pt-4 text-sm text-muted dark:border-accent-d/40 dark:text-[var(--text-2)]">
        {footer}
      </CardFooter>
    );

  const canonicalId = getCanonicalProductId(product);
  const resolvedHref = href ?? (canonicalId ? `/products/${encodeURIComponent(canonicalId)}` : undefined);

  const favoriteId = canonicalId ?? String(product.id);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = isProductFavorite(favorites, favoriteId);
  const { trackButtonClick } = useAnalytics();

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite({
      type: "product",
      id: favoriteId,
      product,
    });

    trackButtonClick({
      action: "favorite",
      label: `${product.brand ? `${product.brand} ` : ""}${product.name}`.trim() || null,
      context: favoriteId,
      metadata: {
        isFavorite: !isFavorite,
      },
    });
  };

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
        <div className="relative overflow-hidden rounded-3xl bg-accent dark:bg-[var(--accent)]">
          {isBestPrice && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-lg">
              <Award className="h-3.5 w-3.5" aria-hidden />
              <span aria-label="Meilleur prix">Meilleur prix</span>
            </span>
          )}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={isFavorite}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/60 bg-background/95 text-muted shadow-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-accent-d/40 dark:bg-[var(--background)]/80 ${isFavorite ? "text-primary" : ""}`}
            >
              <Heart
                className="h-5 w-5"
                aria-hidden
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>
            {discountValue !== null && (
              <div className="inline-flex items-center gap-1 rounded-full bg-dark/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg dark:bg-[var(--accent)]/80">
                <span aria-hidden>🔥</span>
                -{discountValue}%
              </div>
            )}
          </div>
          <div className="relative flex aspect-[4/3] w-full items-center justify-center p-6">
            {showImage ? (
              <Image
                src={productImage.src}
                alt={productImage.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-contain"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-muted/80">
                <span aria-hidden className="text-2xl">
                  📦
                </span>
                <span>Image indisponible</span>
              </span>
            )}
          </div>
          <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-md dark:bg-[var(--background)]/80">
            {product.brand ?? "Produit"}
          </div>
        </div>
        <div className="space-y-3">
          <CardTitle className="text-lg font-semibold text-text dark:text-[var(--text)]">{product.name}</CardTitle>
          {product.flavour && (
            <p className="text-sm text-muted">Saveur : {product.flavour}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted">
        <div className="grid gap-4 rounded-3xl border border-accent/70 bg-accent p-4 text-muted dark:border-accent-d/40 dark:bg-[var(--accent)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Meilleur prix</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-dark dark:text-[var(--text)]">{formattedBestPrice}</p>
                {originalPriceFormatted && (
                  <span className="text-sm text-muted/80 line-through">{originalPriceFormatted}</span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-muted">
              <p>{product.bestVendor ?? "Vendeur"}</p>
              {product.inStock !== undefined && product.inStock !== null && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <span aria-hidden>{product.inStock ? "🟢" : "🔴"}</span>
                  <span className="text-muted">{product.inStock ? "En stock" : "Rupture"}</span>
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted">
            <div>
              <span className="block uppercase tracking-wide text-[11px] text-muted/80">Protéines/€</span>
              <span className="text-base font-semibold text-dark dark:text-[var(--text)]">
                {typeof product.proteinPerEuro === "number"
                  ? `${product.proteinPerEuro.toFixed(2)} g`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="block uppercase tracking-wide text-[11px] text-muted/80">Note</span>
              <span className="text-base font-semibold text-dark dark:text-[var(--text)]">
                {typeof product.rating === "number" ? `${product.rating.toFixed(1)} ★` : "—"}
              </span>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted/80">
              Protéines / dose
            </dt>
            <dd className="font-semibold text-dark dark:text-[var(--text)]">
              {formatQuantity(product.protein_per_serving_g, "g")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted/80">
              Taille de portion
            </dt>
            <dd className="font-semibold text-dark dark:text-[var(--text)]">
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
      className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {bodyContent}
    </Link>
  ) : (
    <div className="flex flex-1 flex-col">{bodyContent}</div>
  );

  return (
    <article className="h-full">
      <Card className="flex h-full flex-col justify-between bg-surface dark:bg-[var(--secondary)]">
        {cardBody}
        {footerNode}
      </Card>
    </article>
  );
}
