import { useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Product, ProductType } from '../data/products';
import {
  selectFilters,
  selectSelectedProductIds,
  useProductSelectionStore,
} from '../store/productSelectionStore';

interface ProductFiltersSidebarProps {
  allProducts: Product[];
  filteredProducts: Product[];
  isLoading: boolean;
}

const typeLabels: Record<ProductType, string> = {
  whey: 'Whey',
  creatine: 'Créatine',
};

export const ProductFiltersSidebar = ({
  allProducts,
  filteredProducts,
  isLoading,
}: ProductFiltersSidebarProps) => {
  const { selectedBrands, selectedTypes, priceBounds, priceRange } =
    useProductSelectionStore(useShallow(selectFilters));
  const selectedProductIds = useProductSelectionStore(selectSelectedProductIds);
  const { setSelectedBrands, setSelectedTypes, setPriceBounds, setPriceRange, toggleProductSelection } =
    useProductSelectionStore(
      useShallow((state) => ({
        setSelectedBrands: state.setSelectedBrands,
        setSelectedTypes: state.setSelectedTypes,
        setPriceBounds: state.setPriceBounds,
        setPriceRange: state.setPriceRange,
        toggleProductSelection: state.toggleProductSelection,
      })),
    );

  const brandOptions = useMemo(
    () => Array.from(new Set(allProducts.map((product) => product.brand))).sort(),
    [allProducts],
  );

  useEffect(() => {
    if (!isLoading && allProducts.length > 0) {
      const min = Math.min(...allProducts.map((product) => product.price));
      const max = Math.max(...allProducts.map((product) => product.price));
      const nextBounds: [number, number] = [Math.floor(min), Math.ceil(max)];

      if (nextBounds[0] !== priceBounds[0] || nextBounds[1] !== priceBounds[1]) {
        setPriceBounds(nextBounds);
      }
    }
  }, [allProducts, isLoading, priceBounds, setPriceBounds]);

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((value) => value !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleTypeToggle = (type: ProductType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((value) => value !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleMinPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextMin = Number.parseFloat(event.target.value);
    setPriceRange([Number.isNaN(nextMin) ? priceBounds[0] : nextMin, priceRange[1]]);
  };

  const handleMaxPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextMax = Number.parseFloat(event.target.value);
    setPriceRange([priceRange[0], Number.isNaN(nextMax) ? priceBounds[1] : nextMax]);
  };

  const filteredSelection = useMemo(
    () =>
      filteredProducts.map((product) => ({
        product,
        disabled:
          selectedProductIds.length >= 4 && !selectedProductIds.includes(product.id),
      })),
    [filteredProducts, selectedProductIds],
  );

  if (isLoading && allProducts.length === 0) {
    return (
      <aside className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>
        <p className="text-sm text-slate-500">Affinez la liste pour trouver les produits à comparer.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Marques</h3>
        <div className="space-y-2">
          {brandOptions.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              {brand}
            </label>
          ))}
          {brandOptions.length === 0 && <p className="text-sm text-slate-500">Aucune marque disponible.</p>}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Type</h3>
        <div className="space-y-2">
          {(['whey', 'creatine'] as ProductType[]).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => handleTypeToggle(type)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              {typeLabels[type]}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Prix (€)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase text-slate-400">Min</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              value={priceRange[0]}
              min={priceBounds[0]}
              max={priceRange[1]}
              onChange={handleMinPriceChange}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-400">Max</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              value={priceRange[1]}
              min={priceRange[0]}
              max={priceBounds[1]}
              onChange={handleMaxPriceChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sélection ({selectedProductIds.length}/4)</h3>
          <span className="text-xs text-slate-400">Comparer 2 à 4 produits</span>
        </div>
        <div className="space-y-2">
          {filteredSelection.map(({ product, disabled }) => (
            <label
              key={product.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{product.name}</span>
                <span className="text-xs text-slate-500">
                  {product.brand} • {typeLabels[product.type]}
                </span>
              </div>
              <input
                type="checkbox"
                checked={selectedProductIds.includes(product.id)}
                disabled={disabled}
                onChange={() => toggleProductSelection(product.id)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
              />
            </label>
          ))}
          {!isLoading && filteredSelection.length === 0 && (
            <p className="text-sm text-slate-500">Aucun produit ne correspond aux filtres.</p>
          )}
        </div>
      </div>
    </aside>
  );
};
