import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import FavoritesPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Favoris",
  description:
    "Retrouvez en un clin d'œil vos produits, salles et programmes enregistrés pour relancer vos entraînements instantanément.",
  path: "/favoris",
});

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
