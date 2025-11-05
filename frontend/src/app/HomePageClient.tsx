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
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";

export function HomePageClient() {
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
    <div className="bg-background text-text">
      <HeroSection onStartComparison={handleStartComparison} onViewDeals={handleViewDeals} />
      <DealsShowcase />
      <PopularCategories onSelectCategory={handleSelectCategory} />
      <WhyChooseUsSection />
      <StatsSection />
      <GymLocatorSection />
      <PartnerLogos />
      <TestimonialsSection />
      <PriceAlertsSection onExploreCatalogue={handleExploreCatalogue} />
    </div>
  );
}
