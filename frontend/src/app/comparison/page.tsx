import Link from "next/link";

import { OfferTable } from "@/components/OfferTable";
import { ProductCard } from "@/components/ProductCard";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import apiClient from "@/lib/apiClient";
import { getFallbackComparison, getFallbackProductSummaries } from "@/lib/fallbackCatalogue";
import {
  getCanonicalProductId,
  normalizeProductIdentifier,
  type ProductIdentifierCandidate,
} from "@/lib/productIdentifiers";
import type { ComparisonEntry, ComparisonResponse, DealItem, ProductListResponse, ProductSummary } from "@/types/api";

interface ComparisonPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseIds(ids: string): string[] {
  return ids
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function toNumericIds(ids: readonly string[]): number[] {
  return ids
    .map((value) => Number.parseInt(value, 10))
    .filter((value): value is number => Number.isFinite(value));
}

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

function sanitizeComparisonEntry(entry: ComparisonEntry | null | undefined): ComparisonEntry | null {
  if (!entry || !entry.product) {
    return null;
  }

  const offers = Array.isArray(entry.offers)
    ? entry.offers.filter((offer): offer is DealItem => Boolean(offer && offer.id))
    : [];

  return {
    product: entry.product,
    offers,
  };
}

function sanitizeComparisonResponse(data: ComparisonResponse | null | undefined): ComparisonResponse | null {
  if (!data) {
    return null;
  }

  const products = Array.isArray(data.products)
    ? data.products
        .map((entry) => sanitizeComparisonEntry(entry))
        .filter((entry): entry is ComparisonEntry => Boolean(entry))
    : [];

  if (products.length === 0) {
    return null;
  }

  const summary = Array.isArray(data.summary)
    ? data.summary.filter((offer): offer is DealItem => Boolean(offer && offer.id))
    : [];

  return {
    products,
    summary,
  };
}

function mergeWithFallback(
  primary: ComparisonResponse,
  fallback: ComparisonResponse | null,
  requestedIds: number[],
): ComparisonResponse {
  if (!fallback) {
    return primary;
  }

  const presentIds = new Set<number>();
  primary.products.forEach((entry) => {
    const rawId = entry.product?.id ?? entry.product?.product_id;
    const parsed = rawId === undefined ? NaN : Number.parseInt(String(rawId), 10);
    if (Number.isFinite(parsed)) {
      presentIds.add(parsed);
    }
  });

  const missingIds = requestedIds.filter((id) => !presentIds.has(id));
  if (missingIds.length === 0) {
    return primary;
  }

  const missingSet = new Set(missingIds);
  const supplementalProducts = fallback.products.filter((entry) => {
    const rawId = entry.product?.id ?? entry.product?.product_id;
    const parsed = rawId === undefined ? NaN : Number.parseInt(String(rawId), 10);
    return Number.isFinite(parsed) && missingSet.has(parsed);
  });

  if (supplementalProducts.length === 0) {
    return primary;
  }

  const combinedProducts = [...primary.products, ...supplementalProducts];
  const order = new Map<number, number>();
  requestedIds.forEach((id, index) => {
    order.set(id, index);
  });

  combinedProducts.sort((a, b) => {
    const rawA = a.product?.id ?? a.product?.product_id;
    const rawB = b.product?.id ?? b.product?.product_id;
    const aId = rawA === undefined ? NaN : Number.parseInt(String(rawA), 10);
    const bId = rawB === undefined ? NaN : Number.parseInt(String(rawB), 10);
    const aOrder = Number.isFinite(aId) ? order.get(aId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(bId) ? order.get(bId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  const seenSummary = new Map<string, DealItem>();
  const pushOffer = (offer: DealItem) => {
    if (offer && offer.id && !seenSummary.has(offer.id)) {
      seenSummary.set(offer.id, offer);
    }
  };

  (primary.summary ?? []).forEach(pushOffer);

  fallback.summary
    .filter((offer) => {
      if (offer.productId === null || offer.productId === undefined) {
        return false;
      }
      const parsed = Number.parseInt(String(offer.productId), 10);
      return Number.isFinite(parsed) && missingSet.has(parsed);
    })
    .forEach(pushOffer);

  return {
    products: combinedProducts,
    summary: Array.from(seenSummary.values()),
  };
}

async function fetchComparison(ids: string) {
  const parsedIds = parseIds(ids);
  const requestedIds = toNumericIds(parsedIds);
  const fallback = parsedIds.length > 0 ? getFallbackComparison(parsedIds) : null;

  try {
    const raw = await apiClient.get<ComparisonResponse>("/comparison", {
      query: {
        ids,
        limit: 12,
      },
      cache: "no-store",
    });

    const sanitized = sanitizeComparisonResponse(raw);
    if (!sanitized) {
      return fallback;
    }

    if (requestedIds.length === 0) {
      return sanitized;
    }

    return mergeWithFallback(sanitized, fallback, requestedIds);
  } catch (error) {
    console.error("Erreur chargement comparaison", error);
    return fallback;
  }
}

const DEFAULT_PRESELECT_COUNT = 2;

async function fetchDefaultComparisonProducts(
  limit = DEFAULT_PRESELECT_COUNT,
): Promise<ProductSummary[]> {
  const fallbackProducts = getFallbackProductSummaries(limit);

  try {
    const data = await apiClient.get<ProductListResponse>("/products", {
      query: {
        per_page: limit,
        sort: "price_asc",
      },
      cache: "no-store",
    });

    const products = Array.isArray(data?.products) ? data.products.slice(0, limit) : [];

    if (products.length >= limit || fallbackProducts.length === 0) {
      return products.length > 0 ? products : fallbackProducts;
    }

    const existingIds = new Set(products.map((product) => product.id));
    const supplemented = [...products];

    for (const fallbackProduct of fallbackProducts) {
      if (supplemented.length >= limit) {
        break;
      }

      if (!existingIds.has(fallbackProduct.id)) {
        supplemented.push(fallbackProduct);
      }
    }

    return supplemented;
  } catch (error) {
    console.error("Erreur chargement sélection par défaut", error);
    return fallbackProducts;
  }
}

function buildComparisonTitle(entries: ComparisonResponse["products"] | undefined) {
  if (!entries || entries.length === 0) {
    return "Comparateur multi-produits";
  }

  const names = entries
    .map(({ product }) => product.name)
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    return "Comparateur multi-produits";
  }

  return names.slice(0, 2).join(" vs ");
}

export default async function ComparisonPage({ searchParams }: ComparisonPageProps) {
  const resolvedSearchParams = await searchParams;
  const ids = Array.isArray(resolvedSearchParams.ids)
    ? resolvedSearchParams.ids.join(",")
    : resolvedSearchParams.ids ?? "";

  const trimmedIds = ids.trim();
  const defaultProducts = trimmedIds
    ? []
    : await fetchDefaultComparisonProducts(DEFAULT_PRESELECT_COUNT);
  const fallbackIds = defaultProducts.map((product) => String(product.id));
  const comparisonIds = trimmedIds || (fallbackIds.length > 0 ? fallbackIds.join(",") : "");
  const data = comparisonIds ? await fetchComparison(comparisonIds) : null;
  const usedFallback = !trimmedIds && fallbackIds.length > 0;
  const comparisonTitle = buildComparisonTitle(data?.products);

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-accent py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Comparaison détaillée
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark sm:text-4xl">{comparisonTitle}</h1>
              <p className="mt-3 max-w-2xl text-base text-muted">
                Analysez les meilleures offres en croisant SerpAPI et notre base interne. Comparez les prix affichés, les notes
                et le rapport protéines/prix pour prendre la meilleure décision.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-primary/40 hover:text-primary"
            >
              Ajouter des produits
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {!trimmedIds && fallbackIds.length === 0 && (
          <p className="rounded-3xl border border-secondary/60 bg-accent p-8 text-center text-muted">
            Sélectionnez des produits via le catalogue pour lancer une comparaison.
          </p>
        )}

        {trimmedIds && !data && (
          <p className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
            Impossible de charger la comparaison. Vérifiez les identifiants : {trimmedIds}.
          </p>
        )}

        {data && (
          <div className="space-y-12">
            {usedFallback && (
              <div className="rounded-3xl border border-secondary/60 bg-accent p-6 text-sm text-muted">
                <p className="font-semibold text-primary">Sélection automatique</p>
                <p className="mt-2 text-muted">
                  Nous avons préchargé la comparaison avec&nbsp;
                  {defaultProducts
                    .map((product) => product.name)
                    .filter(Boolean)
                    .join(" et ")}
                  . Choisissez d’autres références dans le catalogue pour affiner votre analyse.
                </p>
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-dark">Synthèse prix</h2>
              <OfferTable offers={data.summary} caption="Offres les plus compétitives" />
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-dark">Détail par produit</h2>
              <div className="grid gap-8 lg:grid-cols-2">
                {data.products.map(({ product, offers }, index) => {
                  const canonicalId =
                    getCanonicalProductId(product, { offers }) ?? String(product.id ?? index);
                  const productHref = `/products/${encodeURIComponent(canonicalId)}`;

                  return (
                    <div key={canonicalId} className="space-y-4">
                      <ProductCard
                        product={product}
                        href={productHref}
                        footer={
                          <div className="flex items-center justify-between text-xs text-muted/80">
                            <span>ID #{canonicalId}</span>
                            <CompareLinkButton
                              href={buildComparisonHref(canonicalId)}
                              className="inline-flex items-center gap-1 font-semibold text-primary transition hover:text-primary/80"
                            >
                              Comparer individuellement →
                            </CompareLinkButton>
                          </div>
                        }
                      />
                      <OfferTable offers={offers} caption="Offres sélectionnées" />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      <WhyChooseUsSection />
      <PriceAlertsSection catalogueHref="/products" />
    </div>
  );
}
