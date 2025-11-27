"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { buttonClassName } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import type { ProductListResponse, ProductSummary } from "@/types/api";

function sortByDiscount(products: ProductSummary[]): ProductSummary[] {
  return [...products].sort((a, b) => {
    const discountA = typeof a.discount === "number" ? a.discount : 0;
    const discountB = typeof b.discount === "number" ? b.discount : 0;
    return discountB - discountA;
  });
}

export function FlashSaleSection() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchFlashSales() {
      setIsLoading(true);
      setHasError(false);

      try {
        const data = await apiClient.get<ProductListResponse>("/products", {
          query: {
            per_page: 20,
            sort: "discount_desc",
            on_sale: true,
          },
          cache: "no-store",
        });

        if (!isMounted) return;

        const promos = (data?.products ?? []).filter(
          (product) => typeof product.discount === "number" && product.discount > 0,
        );

        setProducts(sortByDiscount(promos).slice(0, 4));
      } catch (error) {
        console.error("Failed to load flash sales", error);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFlashSales();

    return () => {
      isMounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={`flash-sale-skeleton-${index}`} />
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <p className="text-center text-muted">
          {hasError ? "Impossible de charger les promotions." : "Aucune promotion pour le moment"}
        </p>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={`flash-sale-${product.id}`} product={product} />
        ))}
      </div>
    );
  }, [hasError, isLoading, products]);

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-accent/30 to-transparent"
        aria-hidden
      />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              Vente flash
            </div>
            <div>
              <h2 className="font-heading text-3xl font-semibold text-dark sm:text-4xl dark:text-white">
                Les meilleures promos du moment
              </h2>
              <p className="mt-3 text-lg text-muted dark:text-text-2">
                4 offres triées par réduction décroissante pour ne manquer aucune bonne affaire.
              </p>
            </div>
          </div>
          <Link href="/comparateur" className={buttonClassName({ variant: "outline", className: "gap-2" })}>
            Explorer toutes les offres
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-10">{content}</div>
      </div>
    </section>
  );
}
