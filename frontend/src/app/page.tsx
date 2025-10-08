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

export default function Home() {
  const bestDeals = [
    {
      name: "MyProtein Impact Whey Isolate",
      brand: "MyProtein",
      size: "1kg",
      price: 24.99,
      originalPrice: 39.99,
      discount: 37,
      rating: 4.6,
      reviews: 2847,
      image:
        "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?auto=format&fit=crop&w=800&q=80",
      bestPrice: "MyProtein",
    },
    {
      name: "Prozis Whey Isolate Zero",
      brand: "Prozis",
      size: "900g",
      price: 29.9,
      originalPrice: 39.9,
      discount: 25,
      rating: 4.7,
      reviews: 1845,
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      bestPrice: "Prozis",
    },
    {
      name: "Nutrimuscle Native Whey",
      brand: "Nutrimuscle",
      size: "1.5kg",
      price: 39.99,
      originalPrice: 49.99,
      discount: 20,
      rating: 4.8,
      reviews: 1245,
      image:
        "https://images.unsplash.com/photo-1556911220-e15b29be8c9f?auto=format&fit=crop&w=800&q=80",
      bestPrice: "Nutrimuscle",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative flex flex-col items-center justify-center bg-gradient-to-b from-orange-100 via-white to-orange-50 px-6 py-24 text-center">
        <motion.h1
          className="mb-6 max-w-3xl text-4xl font-bold text-gray-900 md:text-6xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Trouvez la <span className="text-orange-500">meilleure whey</span>, au meilleur prix.
        </motion.h1>
        <p className="mb-8 max-w-xl text-gray-600">
          Comparez des centaines de compléments et économisez sur vos achats fitness grâce à notre comparateur intelligent.
        </p>
        <div className="flex w-full max-w-lg items-center gap-2">
          <Input
            placeholder="Ex : Whey isolate 1kg, créatine monohydrate..."
            className="flex-1 border-gray-300 bg-gray-100 placeholder-gray-400"
          />
          <Button className="bg-orange-500 text-white hover:bg-orange-600">
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500">+900 produits comparés • 70 marques • mises à jour 24/7</p>
      </section>

      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-semibold text-gray-900">Promos du moment</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {bestDeals.map((deal, idx) => (
              <Card
                key={idx}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:shadow-lg"
              >
                <div className="relative">
                  <img src={deal.image} alt={deal.name} className="h-56 w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    -{deal.discount}%
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                    <Award className="h-3 w-3" /> Meilleur prix
                  </div>
                </div>
                <CardContent className="p-5 text-center">
                  <p className="mb-1 text-xs text-gray-500">{deal.brand}</p>
                  <h3 className="mb-1 h-10 line-clamp-2 font-semibold text-gray-900">{deal.name}</h3>
                  <p className="mb-3 text-xs text-gray-500">{deal.size}</p>
                  <div className="mb-3 flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(deal.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-1 text-xs text-gray-600">
                      {deal.rating} ({deal.reviews})
                    </span>
                  </div>
                  <div className="mb-3 flex items-end justify-center gap-2">
                    <span className="text-2xl font-bold text-green-600">{deal.price.toFixed(2)}€</span>
                    <span className="mb-1 text-sm text-gray-400 line-through">{deal.originalPrice.toFixed(2)}€</span>
                  </div>
                  <p className="mb-3 text-xs text-gray-500">
                    Meilleur prix sur <span className="font-semibold text-orange-600">{deal.bestPrice}</span>
                  </p>
                  <Button className="w-full bg-orange-500 text-white hover:bg-orange-600">Comparer les prix</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-12 text-3xl font-semibold">Pourquoi choisir Sport Comparator ?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 shadow-sm">
              <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-500" />
              <h4 className="mb-2 text-lg font-semibold">Fiabilité des données</h4>
              <p className="text-sm text-gray-600">Sources vérifiées, scrapers et API fiables pour des résultats précis.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 shadow-sm">
              <Zap className="mx-auto mb-4 h-10 w-10 text-orange-500" />
              <h4 className="mb-2 text-lg font-semibold">Mises à jour en temps réel</h4>
              <p className="text-sm text-gray-600">Nos robots actualisent les prix et disponibilités 24/7.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 shadow-sm">
              <Star className="mx-auto mb-4 h-10 w-10 text-orange-500" />
              <h4 className="mb-2 text-lg font-semibold">Classements transparents</h4>
              <p className="text-sm text-gray-600">Trier les produits par rapport qualité/prix sans biais.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 text-center">
        <h2 className="mb-6 text-3xl font-semibold">Ne ratez plus la bonne affaire</h2>
        <p className="mx-auto mb-10 max-w-2xl text-gray-600">
          Configurez des alertes pour vos compléments favoris. Nous vous notifierons dès qu’un prix chute en dessous de votre seuil.
        </p>
        <div className="mx-auto flex max-w-md justify-center gap-2">
          <Input placeholder="Votre adresse email" className="border-gray-300 bg-white" />
          <Button className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600">
            <Zap className="h-4 w-4" /> Créer une alerte
          </Button>
        </div>
      </section>

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
