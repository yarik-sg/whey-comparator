import Link from "next/link";

import { OfferTable } from "@/components/OfferTable";
import { ProductCard } from "@/components/ProductCard";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import apiClient from "@/lib/apiClient";
import type { ComparisonResponse, ProductListResponse, ProductSummary } from "@/types/api";

interface ComparisonPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchComparison(ids: string) {
  try {
    const data = await apiClient.get<ComparisonResponse>("/comparison", {
      query: {
        ids,
        limit: 12,
      },
      cache: "no-store",
    });

    return data;
  } catch (error) {
    console.error("Erreur chargement comparaison", error);
    return null;
  }
}

const DEFAULT_PRESELECT_COUNT = 2;

async function fetchDefaultComparisonProducts(
  limit = DEFAULT_PRESELECT_COUNT,
): Promise<ProductSummary[]> {
  try {
    const data = await apiClient.get<ProductListResponse>("/products", {
      query: {
        per_page: limit,
        sort: "price_asc",
      },
      cache: "no-store",
    });

    return data.products.slice(0, limit);
  } catch (error) {
    console.error("Erreur chargement sélection par défaut", error);
    return [];
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
      <section className="bg-orange-50/80 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-500">
            Comparaison détaillée
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{comparisonTitle}</h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                Analysez les meilleures offres en croisant SerpAPI et notre base interne. Comparez les prix affichés, les notes
                et le rapport protéines/prix pour prendre la meilleure décision.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-500"
            >
              Ajouter des produits
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {!trimmedIds && fallbackIds.length === 0 && (
          <p className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
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
              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6 text-sm text-slate-600">
                <p className="font-semibold text-orange-600">Sélection automatique</p>
                <p className="mt-2 text-slate-600">
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
              <h2 className="text-2xl font-semibold text-slate-900">Synthèse prix</h2>
              <OfferTable offers={data.summary} caption="Offres les plus compétitives" />
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-slate-900">Détail par produit</h2>
              <div className="grid gap-8 lg:grid-cols-2">
                {data.products.map(({ product, offers }) => (
                  <div key={product.id} className="space-y-4">
                    <ProductCard
                      product={product}
                      href={`/products/${product.id}`}
                      footer={
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>ID #{product.id}</span>
                          <CompareLinkButton
                            href={`/comparison?ids=${product.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-orange-500 transition hover:text-orange-400"
                          >
                            Comparer individuellement →
                          </CompareLinkButton>
                        </div>
                      }
                    />
                    <OfferTable offers={offers} caption="Offres sélectionnées" />
                  </div>
                ))}
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
