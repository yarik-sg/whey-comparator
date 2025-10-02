"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { HeroSection } from "@/components/HeroSection";
import { DealsShowcase } from "@/components/DealsShowcase";
import { StatsSection } from "@/components/StatsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { PriceAlertForm } from "@/components/PriceAlertForm";
import { PopularCategories } from "@/components/PopularCategories";
import { PartnerLogos } from "@/components/PartnerLogos";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleStartComparison = useCallback(() => {
    router.push("/comparateur");
  }, [router]);

  const handleViewDeals = useCallback(() => {
    document.getElementById("promotions")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleExploreCatalogue = useCallback(() => {
    router.push("/catalogue");
  }, [router]);

  const handleSelectCategory = useCallback(
    (query: string) => {
      router.push(`/comparateur?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const handleNavigation = useCallback(
    (action: () => void) => {
      action();
      setIsMobileMenuOpen(false);
    },
    [setIsMobileMenuOpen],
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, [setIsMobileMenuOpen]);

  const navigationLinks: Array<{ label: string; action: () => void }> = [
    { label: "Comparateur", action: handleStartComparison },
    { label: "Promotions", action: handleViewDeals },
    { label: "Catalogue", action: handleExploreCatalogue },
  ];

  return (
    <div className="min-h-screen bg-[#0b1320] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d1b2a]/80 backdrop-blur shadow-lg shadow-black/10 supports-[backdrop-filter]:bg-[#0d1b2a]/70">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
          <h1 className="text-2xl font-extrabold text-orange-500">💪 Sport Comparator</h1>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-sm text-gray-300 sm:flex">
              {navigationLinks.map(({ label, action }) => (
                <button
                  key={label}
                  onClick={() => handleNavigation(action)}
                  className="transition hover:text-white focus:outline-none focus-visible:text-white"
                >
                  {label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1b2a] sm:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span className="sr-only">Menu</span>
              <span aria-hidden className="flex h-5 w-6 flex-col justify-between">
                <span className="h-0.5 w-full rounded bg-current"></span>
                <span className="h-0.5 w-full rounded bg-current"></span>
                <span className="h-0.5 w-full rounded bg-current"></span>
              </span>
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="sm:hidden border-t border-white/10 bg-[#0d1b2a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1b2a]/85"
          >
            <div className="container mx-auto space-y-2 px-4 py-4 sm:px-6">
              {navigationLinks.map(({ label, action }) => (
                <button
                  key={label}
                  onClick={() => handleNavigation(action)}
                  className="block w-full rounded-md px-4 py-3 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1b2a]"
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="pt-20 sm:pt-24">
        <HeroSection onStartComparison={handleStartComparison} onViewDeals={handleViewDeals} />
        <PopularCategories onSelectCategory={handleSelectCategory} />
        <DealsShowcase />
        <StatsSection />
        <PartnerLogos />
        <WhyChooseUsSection />

        <PriceAlertsSection onExploreCatalogue={handleExploreCatalogue} />
        <section id="alertes-prix" className="bg-[#0b1320] py-20">
          <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Alertes prix personnalisées</h2>
              <p className="text-lg text-gray-200">
                Configurez un suivi précis de vos compléments favoris. Nous analysons les marchands via SerpAI et vous envoyons un e-mail instantané dès qu’un prix passe sous votre seuil.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">•</span>
                  Surveillance quotidienne des variations de prix multi-boutiques.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">•</span>
                  Alertes déclenchées automatiquement via les flux SerpAI et historisation interne.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">•</span>
                  Option de désinscription en un clic dans chaque notification.
                </li>
              </ul>
            </div>
            <PriceAlertForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
