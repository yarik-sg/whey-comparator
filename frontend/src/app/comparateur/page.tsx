import type { Metadata } from "next";
import { Suspense } from "react";

import { createMetadata } from "@/lib/siteMetadata";
import ComparateurPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Comparateur intelligent",
  description:
    "Comparez instantanément les prix, compositions et avis des meilleures références fitness grâce au moteur FitIdion.",
  path: "/comparateur",
});

function ComparateurLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg text-muted">Chargement...</div>
    </div>
  );
}

export default function ComparateurPage() {
  return (
    <Suspense fallback={<ComparateurLoading />}>
      <ComparateurPageClient />
    </Suspense>
  );
}
