import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { KpiSummaryBar } from './components/KpiSummaryBar';
import { ProductFiltersSidebar } from './components/ProductFiltersSidebar';

import { ProductComparisonTable } from './components/ProductComparisonTable';

import { HighlightedDealsSection } from './components/HighlightedDealsSection';
import { GymLocatorSection } from './components/GymLocatorSection';
import { PriceAlertsSection } from './components/PriceAlertsSection';
import { useHighlightedDeals } from './hooks/useHighlightedDeals';
import { useProducts } from './hooks/useProducts';
import {
  selectFilters,
  selectSelectedProductIds,
  useProductSelectionStore,
} from './store/productSelectionStore';
import { usePriceAlertStore } from './store/priceAlertStore';


export default function App() {
  const { data: products = [], isLoading } = useProducts();
  const {
    data: deals = [],
    isLoading: isLoadingDeals,
  } = useHighlightedDeals();
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

      const matchesType =
        filters.selectedTypes.length === 0 || filters.selectedTypes.includes(product.type);

      const [minPrice, maxPrice] = filters.priceRange;
      const hasPrice = typeof product.price === 'number' && Number.isFinite(product.price);
      const matchesPrice = hasPrice
        ? product.price! >= minPrice && product.price! <= maxPrice
        : filters.priceBounds[0] === 0 && filters.priceBounds[1] === 0;
      return matchesBrand && matchesType && matchesPrice;
    });
  }, [filters.selectedBrands, filters.selectedTypes, filters.priceRange, products]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900 text-neutral-100">
      <div className="absolute inset-0 -z-20 bg-neutral-900" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-midnight-glow" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-radiant-radial opacity-80" aria-hidden />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-16 pt-12 lg:px-8">
        <header className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-200/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-900 shadow-aurora-soft">
            Comparateur intelligent
          </span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Comparez vos compléments favoris</h1>
          <p className="max-w-2xl text-base text-neutral-200">
            Filtrez par marque, type et budget pour construire un comparatif entre deux et quatre produits.
            Analysez les KPIs clés comme le prix par 100 g de protéine pour trouver le meilleur rapport
            qualité/prix.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="#price-alerts"
              className="inline-flex items-center justify-center rounded-full bg-flame-gradient px-6 py-2 text-sm font-semibold text-white shadow-aurora-soft transition hover:brightness-105"
            >
              Activer une alerte prix
            </a>
            <span className="text-sm text-neutral-300">
              {activeAlertCount > 0
                ? `${activeAlertCount} alerte${activeAlertCount > 1 ? 's' : ''} active${
                    activeAlertCount > 1 ? 's' : ''
                  }`
                : 'Recevez un e-mail dès qu’un prix baisse.'}
            </span>
          </div>
        </header>

        <HighlightedDealsSection deals={deals} isLoading={isLoadingDeals} />

        <GymLocatorSection />

        <KpiSummaryBar selectedProducts={selectedProducts} isLoading={isLoading} />

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
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
