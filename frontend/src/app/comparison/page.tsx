import Link from "next/link";

import { OfferTable } from "@/components/OfferTable";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import apiClient from "@/lib/apiClient";
import type { ComparisonResponse } from "@/types/api";

interface ComparisonPageProps {
  searchParams: Record<string, string | string[] | undefined>;
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

export default async function ComparisonPage({ searchParams }: ComparisonPageProps) {
  const ids = Array.isArray(searchParams.ids)
    ? searchParams.ids.join(",")
    : searchParams.ids ?? "";

  const trimmedIds = ids.trim();
  const data = trimmedIds ? await fetchComparison(trimmedIds) : null;

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
            <Link href="/#promotions" className="transition hover:text-white">
              Promotions
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Comparateur multi-produits</h1>
            <p className="mt-2 text-gray-300">
              Analysez les meilleures offres en croisant SerpAPI et notre base scraper.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Ajouter des produits
          </Link>
        </div>

        {!trimmedIds && (
          <p className="mt-12 text-center text-gray-300">
            Sélectionnez des produits via le catalogue pour lancer une comparaison.
          </p>
        )}

        {trimmedIds && !data && (
          <p className="mt-12 text-center text-red-300">
            Impossible de charger la comparaison. Vérifiez les identifiants : {trimmedIds}.
          </p>
        )}

        {data && (
          <div className="mt-12 space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Synthèse prix</h2>
              <OfferTable offers={data.summary} caption="Offres les plus compétitives" />
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold">Détail par produit</h2>
              <div className="grid gap-8 lg:grid-cols-2">
                {data.products.map(({ product, offers }) => (
                  <div key={product.id} className="space-y-4">
                    <ProductCard
                      product={product}
                      href={`/products/${product.id}`}
                      footer={
                        <CompareLinkButton
                          href={`/comparison?ids=${product.id}`}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-orange-300 transition hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                          Comparer individuellement →
                        </CompareLinkButton>
                      }
                    />
                    <OfferTable offers={offers} caption="Offres sélectionnées" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
