import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { KpiSummaryBar } from './components/KpiSummaryBar';
import { ProductFiltersSidebar } from './components/ProductFiltersSidebar';

import { ProductComparisonTable } from './components/ProductComparisonTable';

import { HighlightedDealsSection } from './components/HighlightedDealsSection';
import { PriceAlertsSection } from './components/PriceAlertsSection';
import { highlightedDeals } from './data/products';
import { useProducts } from './hooks/useProducts';
import {
  selectFilters,
  selectSelectedProductIds,
  useProductSelectionStore,
} from './store/productSelectionStore';
import { usePriceAlertStore } from './store/priceAlertStore';
import { ThemeToggle } from './components/theme/ThemeToggle';


export default function App() {
  const { data: products = [], isLoading } = useProducts();
  const filters = useProductSelectionStore(useShallow(selectFilters));
  const selectedProductIds = useProductSelectionStore(selectSelectedProductIds);
  const setSelectedProductIds = useProductSelectionStore((state) => state.setSelectedProductIds);
  const activeAlertCount = usePriceAlertStore((state) => state.alerts.length);

  useEffect(() => {
    if (!isLoading && products.length > 0 && selectedProductIds.length === 0) {
      const defaultSelection = products.slice(0, Math.min(products.length, 2)).map((product) => product.id);
      setSelectedProductIds(defaultSelection);
    }
  }, [isLoading, products, selectedProductIds.length, setSelectedProductIds]);

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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-athletic-radial opacity-80 dark:opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-athletic-grid opacity-40 dark:opacity-10" aria-hidden />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-16 pt-12 sm:px-6 lg:px-10">
        <header className="surface-card glass-effect overflow-hidden p-8 shadow-athletic sm:p-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-athletic-linear opacity-40 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="badge-best-price">Meilleur prix en temps réel</span>
              <ThemeToggle />
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Comparateur intelligent
              </p>
              <h1 className="text-balance text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                <span className="text-gradient">Comparez vos compléments favoris</span>
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Filtrez par marque, type et budget pour construire un comparatif entre deux et quatre produits.
                Analysez les KPIs clés comme le prix par 100 g de protéine pour trouver le meilleur rapport
                qualité/prix.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <a href="#price-alerts" className="btn-primary">
                Activer une alerte prix
              </a>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {activeAlertCount > 0
                  ? `${activeAlertCount} alerte${activeAlertCount > 1 ? 's' : ''} active${
                      activeAlertCount > 1 ? 's' : ''
                    }`
                  : 'Recevez un e-mail dès qu’un prix baisse.'}
              </span>
            </div>
          </div>
        </header>

        <HighlightedDealsSection deals={highlightedDeals} products={products} isLoading={isLoading} />

        <KpiSummaryBar selectedProducts={selectedProducts} isLoading={isLoading} />

        <div className="grid gap-8 lg:grid-cols-[320px,1fr] lg:items-start">
          <ProductFiltersSidebar
            allProducts={products}
            filteredProducts={filteredProducts}
            isLoading={isLoading}
          />
          <ProductComparisonTable products={selectedProducts} isLoading={isLoading} />
        </div>

        <PriceAlertsSection products={products} isLoading={isLoading} />
      </div>
    </div>
  );
}
