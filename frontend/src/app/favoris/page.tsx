import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import FavoritesPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Favoris",
  description:
    "Retrouvez en un clin d'œil vos produits et salles de sport enregistrés en favoris pour y revenir facilement.",
  path: "/favoris",
});

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
