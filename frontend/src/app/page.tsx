"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { DealsShowcase } from "@/components/DealsShowcase";
import { HeroSection } from "@/components/HeroSection";
import { PartnerLogos } from "@/components/PartnerLogos";
import { PopularCategories } from "@/components/PopularCategories";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsSection } from "@/components/StatsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";

const PriceAlertForm = dynamic(
  () => import("@/components/PriceAlertForm").then((mod) => mod.PriceAlertForm),
  { ssr: false },
);

export default function Home() {
  const router = useRouter();

  const handleStartComparison = useCallback(() => {
    router.push("/comparison");
  }, [router]);

  const handleViewDeals = useCallback(() => {
    document.getElementById("promotions")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleExploreCatalogue = useCallback(() => {
    router.push("/products");
  }, [router]);

  const handleSelectCategory = useCallback(
    (query: string) => {
      router.push(`/comparateur?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="bg-white">
        <HeroSection onStartComparison={handleStartComparison} onViewDeals={handleViewDeals} />
        <PopularCategories onSelectCategory={handleSelectCategory} />
        <DealsShowcase />
        <StatsSection />
        <PartnerLogos />
        <WhyChooseUsSection />
        <PriceAlertsSection onExploreCatalogue={handleExploreCatalogue} />
        <section id="alertes-prix" className="bg-[#f9fafb] py-20">
          <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Alertes prix personnalisées</h2>
              <p className="text-lg text-slate-600">
                Configurez un suivi précis de vos compléments favoris. Nous analysons les marchands via SerpAI et vous
                envoyons un e-mail instantané dès qu’un prix passe sous votre seuil.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500">•</span>
                  Surveillance quotidienne des variations de prix multi-boutiques.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500">•</span>
                  Alertes déclenchées automatiquement via les flux SerpAI et historisation interne.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500">•</span>
                  Option de désinscription en un clic dans chaque notification.
                </li>
              </ul>
            </div>
            <PriceAlertForm className="lg:ml-auto" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
