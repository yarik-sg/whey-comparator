import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { DealsShowcase } from './components/DealsShowcase';
import { HeroSection } from './components/HeroSection';
import { KpiSummaryBar } from './components/KpiSummaryBar';
import { PriceAlertsSection } from './components/PriceAlertsSection';
import { ProductComparisonTable } from './components/ProductComparisonTable';
import { ProductFiltersSidebar } from './components/ProductFiltersSidebar';
import { useProducts } from './hooks/useProducts';
import { selectFilters, selectSelectedProductIds, useProductSelectionStore } from './store/productSelectionStore';

export default function App() {
  const { data: products = [], isLoading } = useProducts();
  const filters = useProductSelectionStore(useShallow(selectFilters));
  const selectedProductIds = useProductSelectionStore(selectSelectedProductIds);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesBrand =
        filters.selectedBrands.length === 0 || filters.selectedBrands.includes(product.brand);
      const matchesType = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(product.type);
      const [minPrice, maxPrice] = filters.priceRange;
      const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
      return matchesBrand && matchesType && matchesPrice;
    });
  }, [filters.selectedBrands, filters.selectedTypes, filters.priceRange, products]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-16 pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <main className="flex flex-col gap-12 lg:gap-16">
          <HeroSection />

          <DealsShowcase />

          <PriceAlertsSection />

          <section id="comparateur" className="space-y-8 rounded-3xl bg-white/70 p-6 shadow-lg shadow-slate-900/5 lg:p-8">
            <header className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                Comparateur intelligent
              </span>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Comparez vos compléments favoris</h2>
              <p className="max-w-2xl text-base text-slate-600">
                Filtrez par marque, type et budget pour construire un comparatif entre deux et quatre produits.
                Analysez les KPIs clés comme le prix par 100 g de protéine pour trouver le meilleur rapport
                qualité/prix.
              </p>
            </header>

            <KpiSummaryBar selectedProducts={selectedProducts} isLoading={isLoading} />

            <div className="grid gap-6 lg:grid-cols-[320px,1fr] lg:gap-8">
              <ProductFiltersSidebar
                allProducts={products}
                filteredProducts={filteredProducts}
                isLoading={isLoading}
              />
              <ProductComparisonTable products={selectedProducts} isLoading={isLoading} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
