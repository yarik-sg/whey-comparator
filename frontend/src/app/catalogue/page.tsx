import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import CataloguePageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Catalogue produits",
  description:
    "Découvrez le catalogue FitIdion : compléments, accessoires et équipements triés par pertinence et mis à jour quotidiennement.",
  path: "/catalogue",
});

export default function CataloguePage() {
  return <CataloguePageClient />;
}
