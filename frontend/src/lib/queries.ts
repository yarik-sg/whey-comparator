import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/apiClient";
import type {
  PriceAlertRecord,
  ProductListResponse,
  ProductReviewsResponse,
} from "@/types/api";

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

export function useProductReviews(productId: number | null | undefined) {
  const enabled = typeof productId === "number" && !Number.isNaN(productId);

  return useQuery<ProductReviewsResponse, Error>({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      if (!enabled) {
        throw new Error("Identifiant produit invalide");
      }

      return apiClient.get<ProductReviewsResponse>(`/products/${productId}/reviews`, {
        cache: "no-store",
      });
    },
    enabled,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}

export function usePriceAlerts(userEmail: string | null | undefined) {
  const normalizedEmail = userEmail?.trim();
  const enabled = Boolean(normalizedEmail);

  return useQuery<PriceAlertRecord[], Error>({
    queryKey: ["price-alerts", normalizedEmail],
    queryFn: async () => {
      if (!normalizedEmail) {
        throw new Error("E-mail requis");
      }

      return apiClient.get<PriceAlertRecord[]>("/price-alerts/", {
        query: { user_email: normalizedEmail },
        cache: "no-store",
      });
    },
    enabled,
    refetchOnWindowFocus: false,
  });
}
