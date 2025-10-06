"use client";

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar, type ProductFilters } from "@/components/FilterSidebar";
import { SortDropdown } from "@/components/SortDropdown";
import { SiteFooter } from "@/components/SiteFooter";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import { useProductList } from "@/lib/queries";
import type { ProductSummary } from "@/types/api";

const DEFAULT_PER_PAGE = 12;

function parseNumberParam(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildFiltersFromParams(searchParams: URLSearchParams): ProductFilters {
  const minPrice = parseNumberParam(searchParams.get("min_price"));
  const maxPrice = parseNumberParam(searchParams.get("max_price"));
  const minRating = parseNumberParam(searchParams.get("min_rating"));
  const category = searchParams.get("category");
  const inStockParam = searchParams.get("in_stock");
  const brands = searchParams.getAll("brands");

  return {
    minPrice,
    maxPrice,
    minRating,
    category: category && category.length > 0 ? category : null,
    inStock: inStockParam === "true" ? true : null,
    brands,
  };
}

function buildQueryObject(
  searchParams: URLSearchParams,
  filters: ProductFilters,
  perPage: number,
): Record<string, unknown> {
  const search = searchParams.get("search") ?? undefined;
  const page = parseNumberParam(searchParams.get("page")) ?? 1;
  const sort = searchParams.get("sort") ?? "price_asc";

  const query: Record<string, unknown> = {
    page,
    per_page: perPage,
    sort,
  };

  if (search) {
    query.search = search;
  }
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    query.min_price = filters.minPrice;
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    query.max_price = filters.maxPrice;
  }
  if (filters.minRating !== null && filters.minRating !== undefined) {
    query.min_rating = filters.minRating;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.inStock) {
    query.in_stock = true;
  }
  if (filters.brands.length > 0) {
    query.brands = filters.brands;
  }

  return query;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const filters = useMemo(
    () => buildFiltersFromParams(new URLSearchParams(searchParamsString)),
    [searchParamsString],
  );

  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    setSearchInput(params.get("search") ?? "");
  }, [searchParamsString]);

  const perPage = DEFAULT_PER_PAGE;
  const queryObject = useMemo(
    () => buildQueryObject(new URLSearchParams(searchParamsString), filters, perPage),
    [filters, perPage, searchParamsString],
  );

  const { data, isLoading, isFetching } = useProductList(queryObject);

  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const sort = searchParams.get("sort") ?? "price_asc";

  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((product) => {
      if (product.brand) {
        brandSet.add(product.brand);
      }
    });
    filters.brands.forEach((brand) => brandSet.add(brand));
    return Array.from(brandSet).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" }),
    );
  }, [filters.brands, products]);

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(searchParamsString);
    updater(nextParams);
    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  const handleFiltersChange = (nextFilters: ProductFilters) => {
    updateSearchParams((params) => {
      params.delete("min_price");
      params.delete("max_price");
      params.delete("min_rating");
      params.delete("category");
      params.delete("in_stock");
      params.delete("brands");

      if (nextFilters.minPrice !== null && nextFilters.minPrice !== undefined) {
        params.set("min_price", String(nextFilters.minPrice));
      }
      if (nextFilters.maxPrice !== null && nextFilters.maxPrice !== undefined) {
        params.set("max_price", String(nextFilters.maxPrice));
      }
      if (nextFilters.minRating !== null && nextFilters.minRating !== undefined) {
        params.set("min_rating", String(nextFilters.minRating));
      }
      if (nextFilters.category) {
        params.set("category", nextFilters.category);
      }
      if (nextFilters.inStock) {
        params.set("in_stock", "true");
      }
      nextFilters.brands.forEach((brand) => {
        params.append("brands", brand);
      });
      params.set("page", "1");
    });
  };

  const handleResetFilters = () => {
    updateSearchParams((params) => {
      params.delete("min_price");
      params.delete("max_price");
      params.delete("min_rating");
      params.delete("category");
      params.delete("in_stock");
      params.delete("brands");
      params.set("page", "1");
    });
  };

  const handleSortChange = (value: string) => {
    updateSearchParams((params) => {
      params.set("sort", value);
      params.set("page", "1");
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearchParams((params) => {
      params.set("page", String(nextPage));
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearchParams((params) => {
      if (searchInput.trim().length > 0) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
    });
  };

  const isBusy = isLoading || isFetching;
  const totalCount = pagination?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#0b1320] text-white">
      <header className="border-b border-white/10 bg-[#0d1b2a]">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-extrabold text-orange-500">
            💪 Sport Comparator
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-300">
            <Link href="/" className="transition hover:text-white">
              Accueil
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
        <nav aria-label="Fil d'Ariane" className="text-sm text-gray-400">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
            </li>
            <li aria-hidden>•</li>
            <li className="text-white">Catalogue</li>
          </ol>
        </nav>

        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Catalogue des produits</h1>
            <p className="mt-2 text-gray-300">
              Données consolidées depuis notre scraper interne (Amazon, MyProtein…) et SerpAPI.
            </p>
          </div>
          <form className="flex max-w-md gap-2" onSubmit={handleSearchSubmit}>
            <label htmlFor="search" className="sr-only">
              Rechercher un produit
            </label>
            <input
              id="search"
              name="search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nom, marque, catégorie"
              className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              Rechercher
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[260px,1fr]">
          <FilterSidebar
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            availableBrands={availableBrands}
            isLoading={isBusy}
          />

          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-300">
                {isBusy ? "Chargement…" : `${totalCount.toLocaleString("fr-FR")} produits`}
              </p>
              <SortDropdown value={sort} onChange={handleSortChange} disabled={isBusy} />
            </div>

            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-live="polite"
              aria-busy={isBusy}
            >
              {isBusy &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                    aria-hidden
                  />
                ))}

              {!isBusy && products.length === 0 && (
                <p className="col-span-full text-center text-gray-300">
                  Aucun produit n&apos;a été trouvé. Essayez un autre filtre.
                </p>
              )}

              {!isBusy &&
                products.map((product: ProductSummary) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    href={`/products/${product.id}`}
                    footer={
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>ID #{product.id}</span>
                        <CompareLinkButton
                          href={`/comparison?ids=${product.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-orange-300 transition hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                          aria-label={`Comparer ${product.name}`}
                        >
                          Comparer →
                        </CompareLinkButton>
                      </div>
                    }
                  />
                ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                disabled={isBusy}
              />
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
