import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import ProductsPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Produits", 
  description: "Parcourez les produits FitIdion avec filtres avancés, tri intelligent et accès direct aux meilleures offres.",
  path: "/products",
});

export default function ProductsPage() {
  return <ProductsPageClient />;
}
