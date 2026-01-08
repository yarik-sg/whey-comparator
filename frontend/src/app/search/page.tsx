import type { Metadata } from "next";
import { Suspense } from "react";

import { createMetadata } from "@/lib/siteMetadata";
import SearchPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Recherche",
  description:
    "Recherchez un produit, une salle ou un programme via le moteur unifié FitIdion et accédez à des résultats contextualisés.",
  path: "/search",
});

function SearchLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg text-muted">Chargement...</div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageClient />
    </Suspense>
  );
}
