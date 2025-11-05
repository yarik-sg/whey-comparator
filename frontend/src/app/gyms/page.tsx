import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import GymsPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Trouver une salle", 
  description: "Localisez les salles partenaires FitIdion et comparez les abonnements Basic-Fit, Fitness Park et plus encore.",
  path: "/gyms",
});

export default function GymsPage() {
  return <GymsPageClient />;
}
