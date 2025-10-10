import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/Breadcrumb";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import { CreatePriceAlert } from "@/components/CreatePriceAlert";
import { OfferTable } from "@/components/OfferTable";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { ProductCard } from "@/components/ProductCard";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { ReviewsSection } from "@/components/ReviewsSection";
import { SiteFooter } from "@/components/SiteFooter";
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

  return (
    <div className="min-h-screen bg-[#0b1320] text-white">
      <header className="border-b border-white/10 bg-[#0d1b2a]">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-extrabold text-orange-500">
            💪 Sport Comparator
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-300">
            <Link href="/products" className="transition hover:text-white">
              Catalogue
            </Link>
            <Link href="/comparison" className="transition hover:text-white">
              Comparaison
            </Link>
            <Link href="/#promotions" className="transition hover:text-white">
              Promotions
            </Link>
            <Link href="/alerts" className="transition hover:text-white">
              Mes alertes
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <Breadcrumb
          items={[
            { label: "Accueil", href: "/" },
            { label: "Catalogue", href: "/products" },
            { label: product.name, href: `#product-${sectionAnchorId}` },
          ]}
          className="mb-6 text-gray-300"
        />

        <div id={`product-${sectionAnchorId}`} className="grid gap-10 lg:grid-cols-[360px,1fr]">
          <div className="space-y-6">
            <ProductMediaCarousel images={galleryImages} alt={product.name} />

            <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-4">
                <Link
                  href="/products"
                  className="text-xs font-semibold uppercase tracking-wide text-orange-300 transition hover:text-orange-200"
                >
                  ← Retour au catalogue
                </Link>
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold sm:text-4xl">{product.name}</h1>
                  {product.brand && <p className="text-sm text-gray-300">{product.brand}</p>}
                  {hasAverageRating && (
                    <p className="text-sm text-emerald-300">
                      {averageRating.toFixed(1)} ★
                      {hasReviewsCount
                        ? ` · ${reviewsCount.toLocaleString("fr-FR")} avis`
                        : ""}
                    </p>
                  )}
                </div>
                <CompareLinkButton
                  href={buildComparisonHref(canonicalProductId)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  aria-label={`Ajouter ${product.brand ? `${product.brand} ` : ""}${product.name} à la comparaison`}
                  title={`Ajouter ${product.brand ? `${product.brand} ` : ""}${product.name} à la comparaison`}
                >
                  Ajouter à la comparaison
                </CompareLinkButton>
              </div>

              <dl className="grid gap-4 rounded-2xl bg-white/5 p-4 text-sm text-gray-200">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Prix constaté</dt>
                  <dd className="text-lg font-semibold text-white">{product.bestPrice.formatted ?? "—"}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                  <div>
                    <p className="uppercase tracking-wide text-gray-400">€/kg</p>
                    <p className="text-base font-semibold text-white">
                      {typeof product.pricePerKg === "number"
                        ? `${product.pricePerKg.toFixed(2)} €`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-gray-400">Protéines / €</p>
                    <p className="text-base font-semibold text-white">
                      {typeof product.proteinPerEuro === "number"
                        ? product.proteinPerEuro.toFixed(2)
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                  <div>
                    <p className="uppercase tracking-wide text-gray-400">Offres actives</p>
                    <p className="text-base font-semibold text-white">{offers.length}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-gray-400">Disponibilité</p>
                    <p className="text-base font-semibold text-white">
                      {product.inStock === true
                        ? "En stock"
                        : product.stockStatus ?? "À vérifier"}
                    </p>
                  </div>
                </div>
              </dl>

              <div className="space-y-1 text-xs text-gray-400">
                <p>ID #{canonicalProductId}</p>
                <p>Sources agrégées : {offers.length}</p>
                <p>Entrées scraper : {sources.scraper.length}</p>
              </div>
            </section>

            {bestOffer && (
              <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-gray-200">
                <h2 className="text-lg font-semibold text-white">Offre mise en avant</h2>
                <div className="space-y-2 rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-gray-300">
                    {bestOffer.vendor} · {bestOffer.price.formatted}
                    {bestOffer.shippingText ? ` (${bestOffer.shippingText})` : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    Total TTC : {bestOffer.totalPrice?.formatted ?? bestOffer.price.formatted}
                  </p>
                  <p className="text-xs text-gray-400">
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
                  className="inline-flex w-full items-center justify-center rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-300 transition hover:border-orange-300 hover:text-orange-200"
                >
                  Consulter l&apos;offre chez {bestOffer.vendor} →
                </a>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <OfferTable offers={offers} caption="Meilleures offres" />
            {analyticsProductId !== null && (
              <PriceHistoryChart productId={analyticsProductId} />
            )}
            {analyticsProductId !== null && (
              <ReviewsSection productId={analyticsProductId} />
            )}
            <CreatePriceAlert product={product} />

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-gray-200">
              <h2 className="text-lg font-semibold text-white">Flux de données</h2>
              <p className="mt-2 text-gray-300">
                Ces offres combinent les résultats SerpAPI/Google Shopping et nos collecteurs internes (Amazon, MyProtein…). Les
                données sont rafraîchies quotidiennement et stockées dans PostgreSQL.
              </p>
              <p className="mt-4 text-xs text-gray-400">Dernières sources collectées :</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-400">
                {sources.scraper.slice(0, 5).map((offer) => (
                  <li key={offer.id}>
                    {offer.source} — {offer.price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {offer.currency}
                    {offer.last_checked && ` · ${datetimeFormatter.format(new Date(offer.last_checked))}`}
                  </li>
                ))}
                {sources.scraper.length === 0 && <li>Aucune donnée scraper disponible.</li>}
              </ul>
            </section>

            {similarProducts.length > 0 && (
              <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-white">Produits similaires</h2>
                  <p className="text-xs text-gray-400">
                    Basés sur la marque, la catégorie et la performance nutritionnelle.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {similarProducts.map((similarProduct) => {
                    const similarCanonicalId =
                      getCanonicalProductId(similarProduct) ?? String(similarProduct.id);
                    const similarHref = `/products/${encodeURIComponent(similarCanonicalId)}`;

                    return (
                      <ProductCard
                        key={similarCanonicalId}
                        product={similarProduct}
                        href={similarHref}
                        footer={
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>ID #{similarCanonicalId}</span>
                            <CompareLinkButton
                              href={buildComparisonHref(canonicalProductId, similarCanonicalId)}
                              className="inline-flex items-center gap-1 font-semibold text-orange-300 transition hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                              aria-label={`Comparer ${product.name} avec ${similarProduct.name}`}
                              title={`Comparer ${product.name} avec ${similarProduct.name}`}
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
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

