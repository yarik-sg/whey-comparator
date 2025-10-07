"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { HeroSection } from "@/components/HeroSection";
import { DealsShowcase } from "@/components/DealsShowcase";
import { StatsSection } from "@/components/StatsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { PopularCategories } from "@/components/PopularCategories";
import { PartnerLogos } from "@/components/PartnerLogos";

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
    <div className="space-y-20 pb-20">
      <HeroSection onStartComparison={handleStartComparison} onViewDeals={handleViewDeals} />
      <PopularCategories onSelectCategory={handleSelectCategory} />
      <DealsShowcase />
      <StatsSection />
      <PartnerLogos />
      <WhyChooseUsSection />
      <PriceAlertsSection onExploreCatalogue={handleExploreCatalogue} />
    </div>
  );
}
