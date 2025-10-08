"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { DealsShowcase } from "@/components/DealsShowcase";
import { HeroSection } from "@/components/HeroSection";
import { PartnerLogos } from "@/components/PartnerLogos";
import { PopularCategories } from "@/components/PopularCategories";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsSection } from "@/components/StatsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";

export default function Home() {
  const router = useRouter();

  const handleStartComparison = useCallback(() => {
    router.push("/comparateur");
  }, [router]);

  const handleViewDeals = useCallback(() => {
    const section = document.getElementById("promotions");

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    router.push("/comparateur");
  }, [router]);

  const handleSelectCategory = useCallback(
    (query: string) => {
      router.push(`/comparateur?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const handleExploreCatalogue = useCallback(() => {
    router.push("/catalogue");
  }, [router]);

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
      </main>

      <SiteFooter />
    </div>
  );
}
