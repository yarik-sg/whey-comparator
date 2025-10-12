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
  other: 'Autre',
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
    () =>
      Array.from(
        new Set(
          allProducts
            .map((product) => product.brand)
            .filter((brand): brand is string => Boolean(brand?.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [allProducts],
  );

  const typeOptions = useMemo(() => {
    const detected = new Set<ProductType>();
    for (const product of allProducts) {
      detected.add(product.type);
    }
    return Array.from(detected);
  }, [allProducts]);

  useEffect(() => {
    if (!isLoading && allProducts.length > 0) {
      const prices = allProducts
        .map((product) => product.price)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

      const nextBounds: [number, number] =
        prices.length > 0
          ? [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
          : [0, 0];

      if (nextBounds[0] !== priceBounds[0] || nextBounds[1] !== priceBounds[1]) {
        setPriceBounds(nextBounds);
      }
    } else if (!isLoading && allProducts.length === 0 && (priceBounds[0] !== 0 || priceBounds[1] !== 0)) {
      setPriceBounds([0, 0]);
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
      <aside className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-aurora-soft">
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-neutral-800/60" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded bg-neutral-800/60" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-neutral-800/60" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-3/4 animate-pulse rounded bg-neutral-800/60" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-aurora-soft">
      <div>
        <h2 className="text-lg font-semibold text-white">Filtres</h2>
        <p className="text-sm text-neutral-300">Affinez la liste pour trouver les produits à comparer.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-300">Marques</h3>
        <div className="space-y-2">
          {brandOptions.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-primary-500 focus:ring-primary-300"
              />
              {brand}
            </label>
          ))}
          {brandOptions.length === 0 && <p className="text-sm text-neutral-400">Aucune marque disponible.</p>}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-300">Type</h3>
        <div className="space-y-2">
          {(typeOptions.length > 0 ? typeOptions : (['whey', 'creatine'] as ProductType[])).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => handleTypeToggle(type)}
                className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-primary-500 focus:ring-primary-300"
              />
              {typeLabels[type]}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-300">Prix (€)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase text-neutral-400">Min</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
              value={priceRange[0]}
              min={priceBounds[0]}
              max={priceRange[1]}
              onChange={handleMinPriceChange}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-neutral-400">Max</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-300">Sélection ({selectedProductIds.length}/4)</h3>
          <span className="text-xs text-neutral-400">Comparer 2 à 4 produits</span>
        </div>
        <div className="space-y-2">
          {filteredSelection.map(({ product, disabled }) => {
            const isSelected = selectedProductIds.includes(product.id);
            const labelClasses = [
              'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition',
              isSelected
                ? 'border-secondary-300/80 bg-secondary-100/80 text-neutral-900'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-200',
              disabled ? 'opacity-60' : 'hover:border-secondary-300 hover:bg-secondary-100/60',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <label key={product.id} className={labelClasses}>
                <div className="flex items-center gap-3">
                  <ProductImage
                    imageUrl={product.imageUrl}
                    alt={product.imageAlt}
                    className="h-12 w-12 flex-shrink-0 rounded-lg border border-secondary-200/70"
                    fallbackLabel={product.imageAlt}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{product.name}</span>
                    <span className="text-xs text-neutral-300">
                      {product.brand} • {typeLabels[product.type] ?? typeLabels.other}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-primary-500 focus:ring-primary-300 disabled:opacity-40"
                />
              </label>
            );
          })}
          {!isLoading && filteredSelection.length === 0 && (
            <p className="text-sm text-neutral-300">Aucun produit ne correspond aux filtres.</p>
          )}
        </div>
      </div>
    </aside>
  );
};
