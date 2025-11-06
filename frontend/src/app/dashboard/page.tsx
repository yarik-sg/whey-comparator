import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import DashboardPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Tableau de bord",
  description:
    "Accédez à vos favoris, suivez l'évolution des prix et retrouvez vos programmes FitIdion en un clin d'œil.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return <DashboardPageClient />;
}
