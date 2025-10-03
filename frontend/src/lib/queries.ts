import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/apiClient";
import type { PriceHistoryResponse, ProductListResponse } from "@/types/api";

function createProductListQueryKey(params: Record<string, unknown>) {
  return ["products", params];
}

export function useProductList(params: Record<string, unknown>) {
  return useQuery<ProductListResponse, Error>({
    queryKey: createProductListQueryKey(params),
    queryFn: async () => {
      const data = await apiClient.get<ProductListResponse>("/products", {
        query: params,
        cache: "no-store",
      });

      return data;
    },
  });
}

export function usePriceHistory(
  productId: number | null | undefined,
  period: string,
) {
  const enabled = typeof productId === "number" && !Number.isNaN(productId);

  return useQuery<PriceHistoryResponse, Error>({
    queryKey: ["price-history", productId, period],
    queryFn: async () => {
      if (!enabled) {
        throw new Error("Identifiant produit invalide");
      }

      return apiClient.get<PriceHistoryResponse>(`/products/${productId}/price-history`, {
        query: { period },
        cache: "no-store",
      });
    },
    enabled,
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}
