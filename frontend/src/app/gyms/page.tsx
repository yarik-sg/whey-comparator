import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import GymsPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Trouver une salle",
  description:
    "Localisez les salles partenaires FitIdion, comparez les abonnements Basic-Fit, Fitness Park et planifiez vos séances.",
  path: "/gyms",
});

export default function GymsPage() {
  return <GymsPageClient />;
}
