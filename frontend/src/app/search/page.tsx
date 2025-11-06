import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import SearchPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Recherche",
  description:
    "Recherchez un produit, une salle ou un programme via le moteur unifié FitIdion et accédez à des résultats contextualisés.",
  path: "/search",
});

export default function SearchPage() {
  return <SearchPageClient />;
}
