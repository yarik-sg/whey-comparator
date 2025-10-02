import Link from "next/link";
import { notFound } from "next/navigation";

import { OfferTable } from "@/components/OfferTable";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import apiClient from "@/lib/apiClient";
import type { ProductOffersResponse } from "@/types/api";

interface ProductDetailPageProps {
  params: { productId: string };
}

async function fetchProductOffers(productId: number) {
  try {
    const data = await apiClient.get<ProductOffersResponse>(
      `/products/${productId}/offers`,
      {
        query: { limit: 12 },
        cache: "no-store",
      },
    );

    return data;
  } catch (error) {
    console.error("Erreur chargement offre produit", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const productId = Number(params.productId);

  if (Number.isNaN(productId)) {
    notFound();
  }

  const data = await fetchProductOffers(productId);

  if (!data) {
    notFound();
  }

  const { product, offers, sources } = data;

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
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/products" className="text-sm text-orange-300 transition hover:text-orange-200">
              ← Retour au catalogue
            </Link>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{product.name}</h1>
            {product.brand && <p className="text-gray-300">{product.brand}</p>}
          </div>
          <Link
            href={`/comparison?ids=${product.id}`}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Ajouter à la comparaison
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,2fr]">
          <ProductCard
            product={product}
            footer={
              <div className="space-y-1 text-xs text-gray-400">
                <p>ID #{product.id}</p>
                <p>Offres scraper : {sources.scraper.length}</p>
                <p>Sources agrégées : {offers.length}</p>
              </div>
            }
          />

          <div className="space-y-6">
            <OfferTable offers={offers} caption="Meilleures offres" />
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-200">
              <h2 className="text-lg font-semibold text-white">Flux de données</h2>
              <p className="mt-2 text-gray-300">
                Ces offres combinent les résultats SerpAPI/Google Shopping et les collecteurs dédiés (Amazon, MyProtein…). Les
                données scraper sont rafraîchies plusieurs fois par jour et horodatées dans notre base PostgreSQL.
              </p>
              <p className="mt-4 text-xs text-gray-400">
                Dernières sources collectées :
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-400">
                {sources.scraper.slice(0, 5).map((offer) => (
                  <li key={offer.id}>
                    {offer.source} — {offer.price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {offer.currency}
                    {offer.last_checked && ` · ${new Date(offer.last_checked).toLocaleString("fr-FR")}`}
                  </li>
                ))}
                {sources.scraper.length === 0 && <li>Aucune donnée scraper disponible.</li>}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
