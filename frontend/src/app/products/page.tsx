import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import ProductsPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Produits",
  description:
    "Accédez à un catalogue de compléments analysés par FitIdion avec filtres avancés, tri intelligent et offres vérifiées.",
  path: "/products",
});

export default function ProductsPage() {
  return <ProductsPageClient />;
}
