diff --git a/frontend/src/app/products/[productId]/page.tsx b/frontend/src/app/products/[productId]/page.tsx
index 3445e82d326d2f515c0fe83aee6e8bf69271ea54..3db110961a772ed3beb40cc5672916eea559a451 100644
--- a/frontend/src/app/products/[productId]/page.tsx
+++ b/frontend/src/app/products/[productId]/page.tsx
@@ -1,154 +1,203 @@
 import Link from "next/link";
 import { notFound } from "next/navigation";
 
 import { Breadcrumb } from "@/components/Breadcrumb";
 import { CompareLinkButton } from "@/components/CompareLinkButton";
 import { CreatePriceAlert } from "@/components/CreatePriceAlert";
 import { OfferTable } from "@/components/OfferTable";
 import { PriceHistoryChart } from "@/components/PriceHistoryChart";
 import { ProductCard } from "@/components/ProductCard";
 import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
 import { ReviewsSection } from "@/components/ReviewsSection";
 import { SiteFooter } from "@/components/SiteFooter";
 import apiClient, { ApiError } from "@/lib/apiClient";
 import {
   getFallbackProductOffers,
   getFallbackSimilarProducts,
 } from "@/lib/fallbackCatalogue";
 import type {
   DealItem,
   ProductOffersResponse,
   SimilarProductsResponse,
 } from "@/types/api";
 
-interface ProductDetailPageProps {
-  params: Promise<{ productId: string }>;
-}
-
 const datetimeFormatter = new Intl.DateTimeFormat("fr-FR", {
   day: "2-digit",
   month: "short",
   hour: "2-digit",
   minute: "2-digit",
 });
 
-function buildComparisonHref(...productIds: number[]): string {
+function parseNumericId(value: unknown): number | null {
+  if (typeof value === "number" && Number.isFinite(value)) {
+    return value;
+  }
+
+  if (typeof value === "string") {
+    const trimmed = value.trim();
+    if (trimmed.length === 0) {
+      return null;
+    }
+
+    const parsed = Number.parseInt(trimmed, 10);
+    if (Number.isFinite(parsed)) {
+      return parsed;
+    }
+  }
+
+  return null;
+}
+
+function buildComparisonHref(...productIds: Array<string | number | null | undefined>): string {
   const uniqueIds = Array.from(
-    new Set(productIds.filter((id) => Number.isFinite(id)).map((id) => String(id).trim())),
+    new Set(
+      productIds
+        .map((id) => {
+          if (typeof id === "number") {
+            return String(id);
+          }
+          if (typeof id === "string") {
+            return id;
+          }
+          return "";
+        })
+        .map((id) => id.trim())
+        .filter((id) => id.length > 0),
+    ),
   );
 
-  return uniqueIds.length > 0
-    ? `/comparison?ids=${encodeURIComponent(uniqueIds.join(","))}`
-    : "/comparison";
+  if (uniqueIds.length === 0) {
+    return "/comparison";
+  }
+
+  const encodedIds = uniqueIds.map((id) => encodeURIComponent(id));
+  return `/comparison?ids=${encodedIds.join(",")}`;
 }
 
 function buildGalleryImages(product: ProductOffersResponse["product"], offers: DealItem[]) {
   const candidates: Array<string | null | undefined> = [
     ...(product.gallery ?? []),
     product.image,
     product.image_url,
     ...offers.map((offer) => offer.image ?? null),
   ];
 
   const unique = new Map<string, string>();
   candidates
     .map((value) => value?.trim())
     .filter((value): value is string => Boolean(value))
     .forEach((value) => {
       if (!unique.has(value)) {
         unique.set(value, value);
       }
     });
 
   if (unique.size === 0) {
     unique.set("/placeholder.png", "/placeholder.png");
   }
 
   return Array.from(unique.values());
 }
 
-async function fetchProductOffers(productId: number) {
+async function fetchProductOffers(productId: string, fallbackId: number | null) {
+  const encodedId = encodeURIComponent(productId);
   try {
-    const data = await apiClient.get<ProductOffersResponse>(`/products/${productId}/offers`, {
+    const data = await apiClient.get<ProductOffersResponse>(`/products/${encodedId}/offers`, {
       query: { limit: 12 },
       cache: "no-store",
     });
 
     return data;
   } catch (error) {
     const isNotFound = error instanceof ApiError && error.status === 404;
     const logger = isNotFound ? console.warn : console.error;
     logger("Erreur chargement offre produit", error);
-    const fallback = getFallbackProductOffers(productId);
-    if (fallback) {
-      return fallback;
+    if (fallbackId !== null) {
+      const fallback = getFallbackProductOffers(fallbackId);
+      if (fallback) {
+        return fallback;
+      }
     }
     return null;
   }
 }
 
-async function fetchSimilarProducts(productId: number, limit = 4) {
+async function fetchSimilarProducts(
+  productId: string,
+  fallbackId: number | null,
+  limit = 4,
+) {
+  const encodedId = encodeURIComponent(productId);
   try {
     const related = await apiClient.get<SimilarProductsResponse>(
-      `/products/${productId}/similar`,
+      `/products/${encodedId}/similar`,
       {
         query: { limit },
         cache: "no-store",
       },
     );
 
     return related;
   } catch (error) {
     const isNotFound = error instanceof ApiError && error.status === 404;
     const logger = isNotFound ? console.warn : console.error;
     logger("Erreur chargement produits similaires", error);
-    const fallback = getFallbackSimilarProducts(productId, limit);
-    if (fallback) {
-      return fallback;
+    if (fallbackId !== null) {
+      const fallback = getFallbackSimilarProducts(fallbackId, limit);
+      if (fallback) {
+        return fallback;
+      }
     }
     return null;
   }
 }
 
-export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
-  const resolvedParams = await params;
-  const productId = Number(resolvedParams.productId);
+export default async function ProductDetailPage({
+  params,
+}: {
+  params: { productId: string };
+}) {
+  const rawProductId = params.productId?.trim();
 
-  if (Number.isNaN(productId)) {
+  if (!rawProductId) {
     notFound();
   }
 
-  const data = await fetchProductOffers(productId);
+  const numericProductId = parseNumericId(rawProductId);
+
+  const data = await fetchProductOffers(rawProductId, numericProductId);
 
   if (!data) {
     notFound();
   }
 
   const { product, offers, sources } = data;
   const bestOffer = offers.find((offer) => offer.isBestPrice || offer.bestPrice) ?? offers[0];
-  const similarResponse = await fetchSimilarProducts(product.id, 4);
+  const similarProductId = typeof product.id === "number" ? String(product.id) : String(rawProductId);
+  const similarFallbackId = parseNumericId(product.id ?? numericProductId);
+  const similarResponse = await fetchSimilarProducts(similarProductId, similarFallbackId, 4);
   const similarProducts = similarResponse?.similar ?? [];
   const galleryImages = buildGalleryImages(product, offers);
   const averageRating = product.rating ?? bestOffer?.rating ?? null;
   const reviewsCount = product.reviewsCount ?? bestOffer?.reviewsCount ?? null;
   const hasAverageRating = typeof averageRating === "number" && !Number.isNaN(averageRating);
   const hasReviewsCount = typeof reviewsCount === "number" && !Number.isNaN(reviewsCount);
 
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
             <Link href="/alerts" className="transition hover:text-white">
