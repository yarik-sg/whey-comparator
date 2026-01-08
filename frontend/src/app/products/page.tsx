import type { Metadata } from "next";
import { Suspense } from "react";

import { createMetadata } from "@/lib/siteMetadata";
import ProductsPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Produits",
  description:
    "Accédez à un catalogue de compléments analysés par FitIdion avec filtres avancés, tri intelligent et offres vérifiées.",
  path: "/products",
});

function ProductsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg text-muted">Chargement des produits...</div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageClient />
    </Suspense>
  );
}
