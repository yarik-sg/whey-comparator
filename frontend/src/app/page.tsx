import type { Metadata } from "next";

import { HomePageClient } from "./HomePageClient";
import { createMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createMetadata({
  title: "Accueil",
  description:
    "Réunissez comparateur, alertes prix et localisation des salles pour optimiser chaque étape de votre routine fitness.",
  path: "/",
});

export default function HomePage() {
  return <HomePageClient />;
}
