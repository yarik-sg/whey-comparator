"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CompareLinkButton } from "@/components/CompareLinkButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildDisplayImageUrl } from "@/lib/images";
import {
  type CombinedSearchResults,
  type SearchSection,
  fetchCombinedSearchResults,
  isSearchResultsEmpty,
  summarizeSearchItem,
} from "@/lib/searchService";
import type { CompareProductPreview } from "@/lib/compareNavigation";

const DEFAULT_IMAGE = "/placeholder.png";
const ORANGE_BUTTON_CLASSES =
  "bg-[#FF6600] text-white shadow hover:bg-[#e65a00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6600]/40";

interface PriceInfo {
  amount?: number;
  text?: string;
}

interface ProductResultInfo {
  id?: string;
  title: string;
  brand?: string;
  origin?: string;
  source?: string;
  image?: string;
  price?: PriceInfo;
  originalPrice?: PriceInfo;
  rating?: number;
  reviewsCount?: number;
  productUrl?: string;
}

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function pickString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
    if (!sanitized) {
      return undefined;
    }
    const parsed = Number(sanitized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function pickFirstString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      const candidate = pickString(value);
      if (candidate) {
        return candidate;
      }
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        const candidate = pickString(entry);
        if (candidate) {
          return candidate;
        }
      }
    }
  }

  return undefined;
}

function pickFirstNumber(...values: Array<unknown>): number | undefined {
  for (const value of values) {
    const candidate = pickNumber(value);
    if (typeof candidate === "number") {
      return candidate;
    }
  }

  return undefined;
}

function resolvePrice(value: unknown): PriceInfo | null {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const formatted = pickString(record.formatted) ?? pickString(record.display);
    const amount = pickNumber(record.amount);
    const currency = pickString(record.currency);

    if (formatted) {
      return {
        amount: typeof amount === "number" ? amount : pickNumber(formatted),
        text: formatted,
      };
    }

    if (typeof amount === "number") {
      const formattedAmount = priceFormatter.format(amount);
      return {
        amount,
        text: currency && currency !== "EUR" ? `${formattedAmount} ${currency}` : formattedAmount,
      };
    }
  }

  const amount = pickNumber(value);
  if (typeof amount === "number") {
    return {
      amount,
      text: priceFormatter.format(amount),
    };
  }

  const text = pickString(value);
  if (text) {
    return {
      amount: pickNumber(text),
      text,
    };
  }

  return null;
}

function resolveProductId(item: Record<string, unknown>): string | undefined {
  const product =
    typeof item.product === "object" && item.product !== null
      ? (item.product as Record<string, unknown>)
      : null;

  const candidates: Array<unknown> = [
    item.productId,
    item.product_id,
    item.id,
    product?.id,
    product?.product_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }

    const asString = pickString(candidate);
    if (asString) {
      return asString;
    }
  }

  return undefined;
}

function buildComparePreviewFromSearchResult(
  info: ProductResultInfo,
  productId: string,
): CompareProductPreview {
  return {
    id: productId,
    title: info.title,
    brand: info.brand ?? null,
    image: info.image ?? null,
    source: info.source ?? info.origin ?? null,
    priceText: info.price?.text ?? null,
    priceValue: typeof info.price?.amount === "number" ? info.price.amount : null,
    rating: typeof info.rating === "number" ? info.rating : null,
    reviewsCount:
      typeof info.reviewsCount === "number" ? info.reviewsCount : null,
  };
}

function extractProductInfo(item: Record<string, unknown>): ProductResultInfo {
  const product =
    typeof item.product === "object" && item.product !== null
      ? (item.product as Record<string, unknown>)
      : null;

  const rawImages = (item as { images?: unknown }).images;
  const productImages = product ? (product as { images?: unknown }).images : undefined;
  const firstImageFromArray = Array.isArray(rawImages)
    ? rawImages.find((value): value is string => typeof value === "string" && value.trim().length > 0)
    : undefined;
  const firstImageFromProduct = Array.isArray(productImages)
    ? productImages.find((value): value is string => typeof value === "string" && value.trim().length > 0)
    : undefined;

  const title = pickFirstString(item.title, item.name, item.nom, product?.name, product?.title) ?? "Produit";
  const brand = pickFirstString(item.brand, (item as Record<string, unknown>).marque, product?.brand, product?.vendorBrand);
  const origin = pickFirstString(
    item.vendor,
    item.source,
    (item as Record<string, unknown>).origin,
    product?.bestVendor,
    product?.vendor,
  );
  const source = pickFirstString(item.source, product?.source);

  const image = pickFirstString(
    item.image,
    item.imageUrl,
    item.image_url,
    firstImageFromArray,
    product?.image,
    product?.image_url,
    firstImageFromProduct,
  );

  const productUrl = pickFirstString(
    (item as Record<string, unknown>).productUrl,
    (item as Record<string, unknown>).product_url,
    (item as Record<string, unknown>).url,
    (item as Record<string, unknown>).link,
    product?.productUrl,
    product?.product_url,
    product?.url,
    product?.link,
  );

  const price =
    resolvePrice((item as Record<string, unknown>).price)
    ?? resolvePrice((item as Record<string, unknown>).bestPrice)
    ?? resolvePrice((item as Record<string, unknown>).best_price)
    ?? resolvePrice((item as Record<string, unknown>).currentPrice)
    ?? (product ? resolvePrice(product.bestPrice) : null);

  const originalPrice =
    resolvePrice((item as Record<string, unknown>).totalPrice)
    ?? resolvePrice((item as Record<string, unknown>).originalPrice)
    ?? resolvePrice((item as Record<string, unknown>).priceBefore)
    ?? resolvePrice((item as Record<string, unknown>).referencePrice)
    ?? resolvePrice((item as Record<string, unknown>).price_reference)
    ?? (product ? resolvePrice(product.originalPrice) : null);

  const rating = pickFirstNumber(
    item.rating,
    (item as Record<string, unknown>).reviewsAverage,
    (item as Record<string, unknown>).averageRating,
    (item as Record<string, unknown>).note,
    product?.rating,
  );
  const reviewsCount = pickFirstNumber(
    item.reviewsCount,
    (item as Record<string, unknown>).reviews,
    (item as Record<string, unknown>).review_count,
    (item as Record<string, unknown>).nb_reviews,
    product?.reviewsCount,
  );

  return {
    id: resolveProductId(item),
    title,
    brand,
    origin,
    source,
    image,
    price: price ?? undefined,
    originalPrice: originalPrice ?? undefined,
    rating: typeof rating === "number" ? Math.min(Math.max(rating, 0), 5) : undefined,
    reviewsCount,
    productUrl: productUrl ?? undefined,
  };
}

function ProductResultCard({ item }: { item: Record<string, unknown> }) {
  const [imageFailed, setImageFailed] = useState(false);
  const info = useMemo(() => extractProductInfo(item), [item]);
  const imageUrl = !imageFailed ? buildDisplayImageUrl(info.image ?? null) ?? DEFAULT_IMAGE : DEFAULT_IMAGE;
  const hasOriginalPrice =
    info.originalPrice?.text
    && info.price?.amount !== undefined
    && info.originalPrice.amount !== undefined
    && info.originalPrice.amount > info.price.amount;
  const discount =
    hasOriginalPrice && info.originalPrice?.amount && info.price?.amount
      ? Math.round(((info.originalPrice.amount - info.price.amount) / info.originalPrice.amount) * 100)
      : null;
  const productId = info.id;
  const comparePayload = {
    q: info.title,
    img: info.image ?? "",
    brand: info.brand ?? "",
    url: info.productUrl ?? "",
  };

  const compareQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("q", comparePayload.q);
    if (comparePayload.img) {
      params.set("img", comparePayload.img);
    }
    if (comparePayload.brand) {
      params.set("brand", comparePayload.brand);
    }
    if (comparePayload.url) {
      params.set("url", comparePayload.url);
    }
    return params.toString();
  }, [comparePayload.brand, comparePayload.img, comparePayload.q, comparePayload.url]);

  const compareHref = `/compare?${compareQuery}`;
  const comparePreview = productId
    ? buildComparePreviewFromSearchResult(info, productId)
    : null;
  const rating = info.rating;
  const reviewsCount = info.reviewsCount;
  const showRating = typeof rating === "number";
  const filledStars = showRating ? Math.round(rating) : 0;
  const starDisplay =
    showRating
      ? `${"★".repeat(Math.max(0, Math.min(5, filledStars)))}${"☆".repeat(Math.max(0, 5 - filledStars))}`
      : null;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[color:var(--border-soft)]/80 bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 w-full overflow-hidden bg-[#FFF5EB] dark:bg-[color:var(--secondary)]/40">
        <Image
          src={imageUrl}
          alt={info.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
        {discount && discount > 0 ? (
          <div className="absolute right-4 top-4 rounded-full bg-[#FF6600] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
            -{discount}%
          </div>
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-6">
        <div className="space-y-2">
          {info.brand ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6600]/80">{info.brand}</p>
          ) : null}
          <h3 className="text-lg font-semibold text-[color:var(--text)]">{info.title}</h3>
          {info.origin || info.source ? (
            <p className="text-sm text-[color:var(--muted)]">{info.origin ?? info.source}</p>
          ) : null}
          {showRating && rating !== undefined ? (
            <p className="flex items-center gap-2 text-sm text-[color:var(--muted)]" aria-label={`Note ${rating.toFixed(1)} sur 5`}>
              {starDisplay ? <span aria-hidden>{starDisplay}</span> : null}
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {typeof reviewsCount === "number" ? (
                <span className="text-xs text-[color:var(--muted)]/80">({reviewsCount.toLocaleString("fr-FR")} avis)</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            {info.price?.text ? (
              <p className="text-2xl font-bold text-[color:var(--text)]">{info.price.text}</p>
            ) : (
              <p className="text-2xl font-bold text-[color:var(--muted)]">Prix indisponible</p>
            )}
            {hasOriginalPrice && info.originalPrice?.text ? (
              <span className="text-sm text-[color:var(--muted)] line-through">{info.originalPrice.text}</span>
            ) : null}
          </div>
          {info.source ? (
            <Badge
              variant="accent"
              size="sm"
              className="bg-[#FFF5EB] text-[#FF6600] dark:bg-[#FF6600]/20 dark:text-[#FF6600]"
            >
              {info.source}
            </Badge>
          ) : null}
        </div>
        <div className="pt-2">
          {compareHref ? (
            <Button asChild className={`w-full ${ORANGE_BUTTON_CLASSES}`}>
              <CompareLinkButton
                href={compareHref}
                product={comparePreview ?? undefined}
                onClick={() => {
                  if (typeof window === "undefined") {
                    return;
                  }
                  try {
                    window.localStorage.setItem(
                      "fitidion:lastCompare",
                      JSON.stringify(comparePayload),
                    );
                  } catch (error) {
                    console.warn("compare:store", error);
                  }
                }}
              >
                Comparer les prix
              </CompareLinkButton>
            </Button>
          ) : (
            <Button className={`w-full ${ORANGE_BUTTON_CLASSES}`} disabled>
              Identifiant produit manquant
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GenericResultCard({
  title,
  subtitle,
  details,
  price,
  link,
}: {
  title: string;
  subtitle?: string;
  details?: string;
  price?: string;
  link?: string;
}) {
  return (
    <Card className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--border-soft)]/80 bg-[color:var(--surface)] p-6 text-[color:var(--text)] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[color:var(--text)]">{title}</h3>
        {subtitle ? <p className="text-sm text-[color:var(--muted)]">{subtitle}</p> : null}
        {details ? <p className="text-xs text-[color:var(--muted)]/80">{details}</p> : null}
      </div>
      <div className="mt-4 space-y-3">
        {price ? <p className="text-base font-semibold text-[color:var(--text)]">{price}</p> : null}
        {link ? (
          <Button asChild className={`w-full ${ORANGE_BUTTON_CLASSES}`}>
            <Link href={link}>
              Découvrir
            </Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export default function SearchPage() {
  const params = useSearchParams();
  const rawQueryParam = params.get("q") ?? "";
  const query = rawQueryParam.trim();
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

  const hasResults = results && !isSearchResultsEmpty(results);
  const headerTitle = query ? `Résultats pour «\u00a0${query}\u00a0»` : "Résultats de recherche";
  const headerSubtitle = query
    ? "Explorez les produits, salles et programmes sélectionnés avec le moteur FitIdion."
    : "Entrez un mot-clé pour comparer instantanément les meilleures offres.";

  return (
    <main className="min-h-screen bg-[color:var(--accent)] pb-20 pt-12 text-[color:var(--text)] transition-colors">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <header className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[#FF6600]">Recherche</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{headerTitle}</h1>
          <p className="text-sm text-[color:var(--muted)]">{headerSubtitle}</p>
        </header>

        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-[420px] animate-pulse rounded-3xl border border-[color:var(--border-soft)]/80 bg-[color:var(--surface)]/70"
                aria-hidden
              />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-3xl border border-red-200/60 bg-red-100/70 p-6 text-center text-red-700 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200">
            {error}
          </p>
        ) : !query ? (
          <p className="rounded-3xl border border-[color:var(--border-soft)]/80 bg-[color:var(--surface)]/70 p-6 text-center text-[color:var(--muted)]">
            Entrez une recherche pour commencer.
          </p>
        ) : !hasResults ? (
          <p className="rounded-3xl border border-[color:var(--border-soft)]/80 bg-[color:var(--surface)]/70 p-6 text-center text-[color:var(--muted)]">
            Aucun résultat pour «\u00a0{query}\u00a0».
          </p>
        ) : (
          sections.map(({ key, label }) => {
            const items = results?.[key] ?? [];
            if (items.length === 0) {
              return null;
            }

            return (
              <section key={key} className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-[color:var(--text)]">{label}</h2>
                  <div className="h-1 w-16 rounded-full bg-[#FF6600]" aria-hidden />
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((item, index) => {
                    if (key === "products") {
                      return <ProductResultCard key={`${key}-${index}`} item={item as Record<string, unknown>} />;
                    }

                    const summary = summarizeSearchItem(key, item as Record<string, unknown>);

                    return (
                      <GenericResultCard
                        key={`${key}-${index}`}
                        title={summary.title}
                        subtitle={summary.subtitle}
                        details={summary.details}
                        price={summary.price}
                        link={summary.link}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
