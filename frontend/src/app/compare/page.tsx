import type { Metadata } from "next";
import { Suspense } from "react";

import { createMetadata } from "@/lib/siteMetadata";
import ComparePageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Comparaison de produits",
  description:
    "Comparez en détail les prix, caractéristiques et avis des produits fitness sélectionnés.",
  path: "/compare",
});

function CompareLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg text-muted">Chargement de la comparaison...</div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareLoading />}>
      <ComparePageClient />
    </Suspense>
  );
}
