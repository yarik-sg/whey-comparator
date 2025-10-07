import { useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Product, ProductType } from '../data/products';
import {
  selectFilters,
  selectSelectedProductIds,
  useProductSelectionStore,
} from '../store/productSelectionStore';
import { ProductImage } from './ProductImage';

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
      <aside className="surface-card glass-effect space-y-6 p-6">
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-3/4 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="surface-card glass-effect space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filtres</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Affinez la liste pour trouver les produits à comparer.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Marques</h3>
        <div className="space-y-2">
          {brandOptions.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900/40"
              />
              {brand}
            </label>
          ))}
          {brandOptions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune marque disponible.</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Type</h3>
        <div className="space-y-2">
          {(['whey', 'creatine'] as ProductType[]).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => handleTypeToggle(type)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900/40"
              />
              {typeLabels[type]}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Prix (€)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase text-slate-400 dark:text-slate-500">Min</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-900/40"
              value={priceRange[0]}
              min={priceBounds[0]}
              max={priceRange[1]}
              onChange={handleMinPriceChange}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-400 dark:text-slate-500">Max</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-900/40"
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Sélection ({selectedProductIds.length}/4)
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Comparer 2 à 4 produits</span>
        </div>
        <div className="space-y-2">
          {filteredSelection.map(({ product, disabled }) => {
            const isSelected = selectedProductIds.includes(product.id);
            const labelClasses = [
              'flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm text-slate-700 transition dark:text-slate-200',
              isSelected
                ? 'border-primary-300 bg-primary-50/80 shadow-sm shadow-primary-500/10 dark:border-primary-400/50 dark:bg-primary-500/10'
                : 'border-slate-200 bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/40',
              disabled ? 'opacity-60' : 'hover:-translate-y-[1px] hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/20',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <label key={product.id} className={labelClasses}>
                <div className="flex items-center gap-3">
                  <ProductImage
                    imageUrl={product.imageUrl}
                    alt={product.imageAlt ?? product.name}
                    className="h-12 w-12 flex-shrink-0 rounded-xl"
                    fallbackLabel={`${product.brand} ${product.name}`}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{product.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {product.brand} • {typeLabels[product.type]}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40 dark:border-slate-500 dark:bg-slate-900/50"
                />
              </label>
            );
          })}
          {!isLoading && filteredSelection.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aucun produit ne correspond aux filtres.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
