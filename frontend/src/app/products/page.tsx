"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { FilterSidebar, type ProductFilters } from "@/components/FilterSidebar";
import { SortDropdown } from "@/components/SortDropdown";
import { CompareLinkButton } from "@/components/CompareLinkButton";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useProductList } from "@/lib/queries";
import {
  getCanonicalProductId,
  normalizeProductIdentifier,
  type ProductIdentifierCandidate,
} from "@/lib/productIdentifiers";
import type { ProductSummary } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_PER_PAGE = 12;

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

  return uniqueIds.length > 0
    ? `/comparison?ids=${encodeURIComponent(uniqueIds.join(","))}`
    : "/comparison";
}

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
    <div className="space-y-16 pb-20">
      <section className="bg-orange-50/80 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Catalogue", href: "/products" },
            ]}
            className="text-sm"
          />
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Catalogue des produits</h1>
              <p className="max-w-2xl text-base text-slate-600">
                Données consolidées depuis notre scraper interne (Amazon, MyProtein…) et SerpAPI. Filtrez par marque,
                disponibilité ou budget pour trouver la référence parfaite.
              </p>
            </div>
            <form className="flex max-w-md gap-2" onSubmit={handleSearchSubmit}>
              <Input
                id="search"
                name="search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nom, marque, catégorie"
              />
              <Button type="submit" variant="primary" size="sm" className="rounded-full">
                Rechercher
              </Button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
          <FilterSidebar
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            availableBrands={availableBrands}
            isLoading={isBusy}
          />

          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
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
                  <ProductCardSkeleton key={index} />
                ))}

              {!isBusy && products.length === 0 && (
                <p className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  Aucun produit n&apos;a été trouvé. Essayez un autre filtre.
                </p>
              )}

              {!isBusy &&
                products.map((product: ProductSummary, index) => {
                  const canonicalId =
                    getCanonicalProductId(product) ?? String(product.id ?? index);
                  const productHref = `/products/${encodeURIComponent(canonicalId)}`;

                  return (
                    <ProductCard
                      key={canonicalId}
                      product={product}
                      href={productHref}
                      footer={
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>ID #{canonicalId}</span>
                          <CompareLinkButton
                            href={buildComparisonHref(canonicalId)}
                            className="inline-flex items-center gap-1 font-semibold text-orange-500 transition hover:text-orange-400"
                            aria-label={`Comparer ${product.brand ? `${product.brand} ` : ""}${product.name}`}
                            title={`Comparer ${product.brand ? `${product.brand} ` : ""}${product.name}`}
                          >
                            Comparer →
                          </CompareLinkButton>
                        </div>
                      }
                    />
                  );
                })}
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
      </div>

      <WhyChooseUsSection />
      <PriceAlertsSection catalogueHref="/products" />
    </div>
  );
}
