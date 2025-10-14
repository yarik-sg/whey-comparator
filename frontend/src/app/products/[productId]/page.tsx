import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/Breadcrumb";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import { CreatePriceAlert } from "@/components/CreatePriceAlert";
import PriceHistoryChart, { type PriceHistoryChartDatum } from "@/components/PriceHistoryChart";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { ReviewsSection } from "@/components/ReviewsSection";
import { PriceComparison } from "@/components/PriceComparison";
import { SimilarProducts } from "@/components/SimilarProducts";
import apiClient, { ApiError } from "@/lib/apiClient";
import {
  getFallbackProductOffers,
  getFallbackSimilarProducts,
} from "@/lib/fallbackCatalogue";
import {
  getCanonicalProductId,
  normalizeProductIdentifier,
  parseNumericIdentifier,
  type ProductIdentifierCandidate,
} from "@/lib/productIdentifiers";
import type {
  DealItem,
  PriceHistoryResponse,
  ProductOffersResponse,
  SimilarProductsResponse,
} from "@/types/api";


const datetimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function buildComparisonHref(
  ...productIds: ProductIdentifierCandidate[]
): string {
  const queue: ProductIdentifierCandidate[] = [...productIds];
  const uniqueIds: string[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const candidate = queue.shift();

    if (Array.isArray(candidate)) {
      queue.unshift(...candidate);
      continue;
    }

    const normalized = normalizeProductIdentifier(candidate ?? null);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      uniqueIds.push(normalized);
    }
  }

  if (uniqueIds.length === 0) {
    return "/comparison";
  }

  const encodedIds = uniqueIds.map((id) => encodeURIComponent(id));
  return `/comparison?ids=${encodedIds.join(",")}`;
}

function buildGalleryImages(product: ProductOffersResponse["product"], offers: DealItem[]) {
  const candidates: Array<string | null | undefined> = [
    ...(product.gallery ?? []),
    product.image,
    product.image_url,
    ...offers.map((offer) => offer.image ?? null),
  ];

  const unique = new Map<string, string>();
  candidates
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .forEach((value) => {
      if (!unique.has(value)) {
        unique.set(value, value);
      }
    });

  if (unique.size === 0) {
    unique.set("/placeholder.png", "/placeholder.png");
  }

  return Array.from(unique.values());
}

async function fetchProductOffers(productId: string, fallbackId: number | null) {
  const encodedId = encodeURIComponent(productId);
  try {
    const data = await apiClient.get<ProductOffersResponse>(`/products/${encodedId}/offers`, {
      query: { limit: 12 },
      cache: "no-store",
    });

    return data;
  } catch (error) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    const logger = isNotFound ? console.warn : console.error;
    logger("Erreur chargement offre produit", error);

    if (fallbackId !== null) {
      const fallback = getFallbackProductOffers(fallbackId);
      if (fallback) {
        return fallback;
      }
    }
    return null;
  }
}

async function fetchSimilarProducts(
  productId: string,
  fallbackId: number | null,
  limit = 4,
) {
  const encodedId = encodeURIComponent(productId);
  try {
    const related = await apiClient.get<SimilarProductsResponse>(
      `/products/${encodedId}/similar`,
      {
        query: { limit },
        cache: "no-store",
      },
    );

    return related;
  } catch (error) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    const logger = isNotFound ? console.warn : console.error;
    logger("Erreur chargement produits similaires", error);

    if (fallbackId !== null) {
      const fallback = getFallbackSimilarProducts(fallbackId, limit);
      if (fallback) {
        return fallback;
      }
    }
    return null;
  }
}

async function fetchPriceHistoryData(
  productId: number | string,
  fallbackCurrency?: string | null,
): Promise<PriceHistoryChartDatum[]> {
  const encodedId = encodeURIComponent(String(productId));

  try {
    const response = await apiClient.get<PriceHistoryResponse>(
      `/products/${encodedId}/price-history`,
      {
        cache: "no-store",
      },
    );

    const history = response?.history ?? [];

    return history
      .filter((entry) => typeof entry.price === "number" && Number.isFinite(entry.price))
      .map((entry) => ({
        recorded_at: entry.date,
        price: entry.price,
        platform: entry.platform ?? null,
        currency: entry.currency ?? fallbackCurrency ?? "EUR",
      }));
  } catch (error) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    const logger = isNotFound ? console.warn : console.error;
    logger("Erreur chargement historique prix", error);
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId: routeProductId } = await params;
  const rawProductId = routeProductId?.trim();

  if (!rawProductId) {
    notFound();
  }

  const numericProductId = parseNumericIdentifier(rawProductId);

  const data = await fetchProductOffers(rawProductId, numericProductId);

  if (!data) {
    notFound();
  }

  const { product, offers, sources } = data;
  const canonicalProductId =
    getCanonicalProductId(product, { offers, fallback: rawProductId }) ?? rawProductId;
  const sectionAnchorId = canonicalProductId ?? String(product.id ?? rawProductId ?? "product");
  const bestOffer = offers.find((offer) => offer.isBestPrice || offer.bestPrice) ?? offers[0];

  const similarProductId = canonicalProductId ?? String(rawProductId);
  const similarFallbackId = parseNumericIdentifier(
    product.product_id ?? product.bestDeal?.productId ?? product.id ?? numericProductId,
  );
  const similarResponse = await fetchSimilarProducts(similarProductId, similarFallbackId, 4);
  const similarProducts = similarResponse?.similar ?? [];
  const galleryImages = buildGalleryImages(product, offers);
  const averageRating = product.rating ?? bestOffer?.rating ?? null;
  const reviewsCount = product.reviewsCount ?? bestOffer?.reviewsCount ?? null;
  const hasAverageRating = typeof averageRating === "number" && !Number.isNaN(averageRating);
  const hasReviewsCount = typeof reviewsCount === "number" && !Number.isNaN(reviewsCount);
  const analyticsProductId = parseNumericIdentifier(product.id ?? canonicalProductId ?? rawProductId);
  const priceHistoryData =
    analyticsProductId !== null
      ? await fetchPriceHistoryData(
          analyticsProductId,
          product.bestPrice?.currency ?? bestOffer?.price.currency ?? null,
        )
      : [];

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50 pb-16 pt-10">
      <div className="container mx-auto flex flex-col gap-10 px-6">
        <Breadcrumb
          items={[
            { label: "Accueil", href: "/" },
            { label: "Catalogue", href: "/products" },
            { label: product.name, href: `#product-${sectionAnchorId}` },
          ]}
          className="text-sm text-muted"
        />

        <div id={`product-${sectionAnchorId}`} className="grid gap-10 lg:grid-cols-[360px,1fr]">
          <div className="space-y-6">
            <ProductMediaCarousel
              images={galleryImages}
              alt={product.name}
              className="lg:sticky lg:top-28"
            />

            <section className="space-y-6 rounded-3xl border border-accent/70 bg-background p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <Link
                  href="/products"
                  className="text-xs font-semibold uppercase tracking-wide text-primary transition hover:text-primary"
                >
                  ← Retour au catalogue
                </Link>
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold text-dark sm:text-4xl">{product.name}</h1>
                  {product.brand && <p className="text-sm text-muted">{product.brand}</p>}
                  {hasAverageRating && (
                    <p className="text-sm font-semibold text-emerald-600">
                      {averageRating.toFixed(1)} ★
                      {hasReviewsCount
                        ? ` · ${reviewsCount.toLocaleString("fr-FR")} avis`
                        : ""}
                    </p>
                  )}
                </div>
                <CompareLinkButton
                  href={buildComparisonHref(canonicalProductId)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={`Ajouter ${product.brand ? `${product.brand} ` : ""}${product.name} à la comparaison`}
                  title={`Ajouter ${product.brand ? `${product.brand} ` : ""}${product.name} à la comparaison`}
                >
                  Ajouter à la comparaison
                </CompareLinkButton>
              </div>

              <dl className="grid gap-4 rounded-2xl border border-accent/70 bg-accent p-4 text-sm text-muted">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-primary/80">Prix constaté</dt>
                  <dd className="text-lg font-semibold text-dark">{product.bestPrice?.formatted ?? "—"}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted">
                  <div>
                    <p className="uppercase tracking-wide text-[11px] text-muted/80">€/kg</p>
                    <p className="text-base font-semibold text-dark">
                      {typeof product.pricePerKg === "number"
                        ? `${product.pricePerKg.toFixed(2)} €`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[11px] text-muted/80">Protéines / €</p>
                    <p className="text-base font-semibold text-dark">
                      {typeof product.proteinPerEuro === "number"
                        ? product.proteinPerEuro.toFixed(2)
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted">
                  <div>
                    <p className="uppercase tracking-wide text-[11px] text-muted/80">Offres actives</p>
                    <p className="text-base font-semibold text-dark">{offers.length}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[11px] text-muted/80">Disponibilité</p>
                    <p className="text-base font-semibold text-dark">
                      {product.inStock === true
                        ? "En stock"
                        : product.stockStatus ?? "À vérifier"}
                    </p>
                  </div>
                </div>
              </dl>

              <div className="space-y-1 text-xs text-muted/80">
                <p>ID #{canonicalProductId}</p>
                <p>Sources agrégées : {offers.length}</p>
                <p>Entrées scraper : {sources.scraper.length}</p>
              </div>
            </section>

            {bestOffer && (
              <section className="space-y-4 rounded-3xl border border-accent/70 bg-background p-6 text-sm text-muted shadow-sm">
                <h2 className="text-lg font-semibold text-dark">Offre mise en avant</h2>
                <div className="space-y-2 rounded-2xl border border-accent/70 bg-accent p-4">
                  <p className="text-sm font-semibold text-dark">
                    {bestOffer.vendor} · {bestOffer.price.formatted}
                    {bestOffer.shippingText ? ` (${bestOffer.shippingText})` : ""}
                  </p>
                  <p className="text-xs text-muted">
                    Total TTC : {bestOffer.totalPrice?.formatted ?? bestOffer.price.formatted}
                  </p>
                  <p className="text-xs text-muted">
                    {bestOffer.stockStatus
                      ? `Disponibilité : ${bestOffer.stockStatus}`
                      : bestOffer.inStock
                        ? "Produit disponible"
                        : "Stock à confirmer"}
                  </p>
                </div>
                <a
                  href={bestOffer.link ?? undefined}
                  target={bestOffer.link ? "_blank" : undefined}
                  rel={bestOffer.link ? "noopener noreferrer" : undefined}
                  className="inline-flex w-full items-center justify-center rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-accent hover:text-primary"
                >
                  Consulter l&apos;offre chez {bestOffer.vendor} →
                </a>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <PriceComparison offers={offers} />
            {analyticsProductId !== null && (
              <PriceHistoryChart data={priceHistoryData} />
            )}
            {analyticsProductId !== null && (
              <ReviewsSection productId={analyticsProductId} />
            )}
            <CreatePriceAlert product={product} />

            <section className="rounded-3xl border border-accent/70 bg-background p-6 text-sm text-muted shadow-sm">
              <h2 className="text-lg font-semibold text-dark">Flux de données</h2>
              <p className="mt-2 text-muted">
                Ces offres combinent les résultats SerpAPI/Google Shopping et nos collecteurs internes (Amazon, MyProtein…). Les
                données sont rafraîchies quotidiennement et stockées dans PostgreSQL.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted/80">
                Dernières sources collectées :
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {sources.scraper.slice(0, 5).map((offer) => (
                  <li key={offer.id}>
                    {offer.source} — {offer.price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {offer.currency}
                    {offer.last_checked && ` · ${datetimeFormatter.format(new Date(offer.last_checked))}`}
                  </li>
                ))}
                {sources.scraper.length === 0 && <li>Aucune donnée scraper disponible.</li>}
              </ul>
            </section>

            <SimilarProducts
              products={similarProducts}
              currentProductId={canonicalProductId}
              buildComparisonHref={buildComparisonHref}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

