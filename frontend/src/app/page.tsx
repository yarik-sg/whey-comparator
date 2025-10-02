"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { HeroSection } from "@/components/HeroSection";
import { DealsShowcase } from "@/components/DealsShowcase";
import { ComparatorSummary, Category } from "@/components/ComparatorSummary";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { PriceAlertForm } from "@/components/PriceAlertForm";

const categories: Category[] = [
  { titre: "Whey Protein", query: "whey protein", icon: "💪", bg: "bg-orange-500" },
  { titre: "Créatine", query: "creatine", icon: "⚡", bg: "bg-blue-600" },
  { titre: "BCAA", query: "bcaa", icon: "🍃", bg: "bg-green-500" },
  { titre: "Pré-Workout", query: "pre workout", icon: "🔥", bg: "bg-red-500" },
  { titre: "Accessoires Gym", query: "accessoires musculation fitness", icon: "🏋️‍♂️", bg: "bg-purple-500" },
  { titre: "Vêtements Sportifs", query: "vêtements sport running fitness homme femme", icon: "👕", bg: "bg-teal-500" },
  { titre: "Catalogue", query: "__catalogue__", icon: "📘", bg: "bg-gray-700" },
];

export default function Home() {
  const router = useRouter();

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
      if (query === "__catalogue__") {
        router.push("/catalogue");
      } else {
        router.push(`/comparateur?q=${encodeURIComponent(query)}`);
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[#0b1320] text-white">
      <header className="border-b border-white/10 bg-[#0d1b2a]/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-6">
          <h1 className="text-2xl font-extrabold text-orange-500">💪 Sport Comparator</h1>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-300">
            <button onClick={handleStartComparison} className="transition hover:text-white">
              Comparateur
            </button>
            <button onClick={handleViewDeals} className="transition hover:text-white">
              Promotions
            </button>
            <button onClick={handleExploreCatalogue} className="transition hover:text-white">
              Catalogue
            </button>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection onStartComparison={handleStartComparison} onViewDeals={handleViewDeals} />
        <DealsShowcase />
        <ComparatorSummary categories={categories} onSelectCategory={handleSelectCategory} />
        <PriceAlertsSection onExploreCatalogue={handleExploreCatalogue} />
        <section id="alertes-prix" className="bg-[#0b1320] py-20">
          <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Alertes prix personnalisées</h2>
              <p className="text-lg text-gray-200">
                Configurez un suivi précis de vos compléments favoris. Nous analysons les marchands via
                SerpAI et vous envoyons un e-mail instantané dès qu'un prix passe sous votre seuil.
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

      <footer className="bg-[#0d1b2a] py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Sport Comparator — Inspiré par Idealo & LeDénicheur
      </footer>
    </div>
  );
}
