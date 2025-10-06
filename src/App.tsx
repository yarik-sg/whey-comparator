import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';


import { KpiSummaryBar } from './components/KpiSummaryBar';
import { PriceAlertForm } from './components/PriceAlertForm';
import { ProductFiltersSidebar } from './components/ProductFiltersSidebar';

import { ProductComparisonTable } from './components/ProductComparisonTable';

import { HighlightedDealsSection } from './components/HighlightedDealsSection';
import { highlightedDeals } from './data/products';
import { useProducts } from './hooks/useProducts';
import { selectFilters, selectSelectedProductIds, useProductSelectionStore } from './store/productSelectionStore';
import { usePriceAlertStore } from './store/priceAlertStore';


export default function App() {
  const { data: products = [], isLoading } = useProducts();
  const filters = useProductSelectionStore(useShallow(selectFilters));
  const selectedProductIds = useProductSelectionStore(selectSelectedProductIds);
  const activeAlertCount = usePriceAlertStore((state) => state.alerts.length);

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

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-10 lg:px-8">
        <header className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
            Comparateur intelligent
          </span>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Comparez vos compléments favoris</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Filtrez par marque, type et budget pour construire un comparatif entre deux et quatre produits.
            Analysez les KPIs clés comme le prix par 100 g de protéine pour trouver le meilleur rapport
            qualité/prix.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="#price-alerts"
              className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-500"
            >
              Activer une alerte prix
            </a>
            <span className="text-sm text-slate-500">
              {activeAlertCount > 0
                ? `${activeAlertCount} alerte${activeAlertCount > 1 ? 's' : ''} active${
                    activeAlertCount > 1 ? 's' : ''
                  }`
                : 'Recevez un e-mail dès qu’un prix baisse.'}
            </span>
          </div>
        </header>

        <HighlightedDealsSection deals={highlightedDeals} products={products} isLoading={isLoading} />

        <KpiSummaryBar selectedProducts={selectedProducts} isLoading={isLoading} />

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <ProductFiltersSidebar
            allProducts={products}
            filteredProducts={filteredProducts}
            isLoading={isLoading}
          />
          <ProductComparisonTable products={selectedProducts} isLoading={isLoading} />
        </div>


      </div>
    </div>
  );
}
