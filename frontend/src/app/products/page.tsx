import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import apiClient from "@/lib/apiClient";
import type { ProductSummary } from "@/types/api";

interface ProductsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

async function fetchProducts(search?: string | null) {
  try {
    const data = await apiClient.get<ProductSummary[]>("/products", {
      query: {
        search: search ?? undefined,
        limit: 60,
      },
      cache: "no-store",
    });

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erreur chargement produits", error);
    return [];
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const searchQuery = Array.isArray(searchParams.search)
    ? searchParams.search[0]
    : searchParams.search;

  const products = await fetchProducts(searchQuery ?? null);

  return (
    <div className="min-h-screen bg-[#0b1320] text-white">
      <header className="border-b border-white/10 bg-[#0d1b2a]">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-extrabold text-orange-500">
            💪 Sport Comparator
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-300">
            <Link href="/comparison" className="transition hover:text-white">
              Comparaison
            </Link>
            <Link href="/#promotions" className="transition hover:text-white">
              Promotions
            </Link>
            <Link href="/products" className="transition hover:text-white">
              Catalogue
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Catalogue des produits</h1>
            <p className="mt-2 text-gray-300">
              Données consolidées depuis notre scraper interne (Amazon, MyProtein…) et SerpAPI.
            </p>
          </div>
          <form className="flex max-w-md gap-2" method="get" action="/products">
            <label htmlFor="search" className="sr-only">
              Rechercher un produit
            </label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={searchQuery ?? ""}
              placeholder="Nom, marque, catégorie"
              className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Rechercher
            </button>
          </form>
        </div>

        {products.length === 0 ? (
          <p className="mt-12 text-center text-gray-300">
            Aucun produit n&apos;a été trouvé. Essayez un autre mot-clé.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/products/${product.id}`}
                footer={
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">ID #{product.id}</span>
                    <Link
                      href={`/comparison?ids=${product.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-300 transition hover:text-orange-200"
                    >
                      Comparer →
                    </Link>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
