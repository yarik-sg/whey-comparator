import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import ComparateurPageClient from "./page.client";

export const metadata: Metadata = createMetadata({
  title: "Comparateur intelligent", 
  description: "Comparez instantanément les prix, compositions et avis des meilleures références fitness grâce au moteur FitIdion.",
  path: "/comparateur",
});

export default function ComparateurPage() {
  return <ComparateurPageClient />;
}
