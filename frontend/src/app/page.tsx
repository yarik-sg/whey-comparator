"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { DealsShowcase } from "@/components/DealsShowcase";
import { HeroSection } from "@/components/HeroSection";
import { PartnerLogos } from "@/components/PartnerLogos";
import { PopularCategories } from "@/components/PopularCategories";
import { GymLocatorSection } from "@/components/GymLocatorSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { StatsSection } from "@/components/StatsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";

export default function Home() {
  const router = useRouter();

  const handleStartComparison = useCallback(() => {
    router.push("/comparateur");
  }, [router]);

  const handleViewDeals = useCallback(() => {
    router.push("/catalogue");
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
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <HeroSection onStartComparison={handleStartComparison} onViewDeals={handleViewDeals} />
      <PopularCategories onSelectCategory={handleSelectCategory} />
      <DealsShowcase />
      <GymLocatorSection />
      <StatsSection />
      <PartnerLogos />
      <WhyChooseUsSection />
      <PriceAlertsSection onExploreCatalogue={handleExploreCatalogue} />
    </div>
  );
}
