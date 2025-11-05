import type { Metadata } from "next";

import { HomePageClient } from "./HomePageClient";
import { createMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createMetadata({
  title: "Accueil",
  description:
    "FitIdion réunit comparateur, alertes prix et localisation des salles pour vous aider à optimiser votre routine fitness.",
  path: "/",
});

export default function HomePage() {
  return <HomePageClient />;
}
