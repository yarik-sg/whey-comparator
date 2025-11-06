import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import AlertsPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Alertes prix",
  description:
    "Configurez, gérez et suivez vos alertes de baisse de prix sur les produits fitness proposés par FitIdion.",
  path: "/alerts",
});

export default function AlertsPage() {
  return <AlertsPageClient />;
}
