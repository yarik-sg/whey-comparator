import { create } from 'zustand';

import type { ProductType } from '../data/products';

type Range = [number, number];

interface ProductSelectionState {
  selectedBrands: string[];
  selectedTypes: ProductType[];
  priceBounds: Range;
  priceRange: Range;
  selectedProductIds: string[];
  setSelectedBrands: (brands: string[]) => void;
  setSelectedTypes: (types: ProductType[]) => void;
  setPriceBounds: (bounds: Range) => void;
  setPriceRange: (range: Range) => void;
  toggleProductSelection: (productId: string) => void;
  clearSelection: () => void;
}

const defaultRange: Range = [0, 200];

export const useProductSelectionStore = create<ProductSelectionState>((set) => ({
  selectedBrands: [],
  selectedTypes: [],
  priceBounds: defaultRange,
  priceRange: defaultRange,
  selectedProductIds: [],
  setSelectedBrands: (brands) => set({ selectedBrands: brands }),
  setSelectedTypes: (types) => set({ selectedTypes: types }),
  setPriceBounds: (bounds) =>
    set({
      priceBounds: bounds,
      priceRange: bounds,
    }),
  setPriceRange: (range) => set({ priceRange: range }),
  toggleProductSelection: (productId) =>
    set((state) => {
      if (state.selectedProductIds.includes(productId)) {
        return {
          selectedProductIds: state.selectedProductIds.filter((id) => id !== productId),
        };
      }

      if (state.selectedProductIds.length >= 4) {
        return state;
      }

      return {
        selectedProductIds: [...state.selectedProductIds, productId],
      };
    }),
  clearSelection: () => set({ selectedProductIds: [] }),
}));

export const selectFilters = (state: ProductSelectionState) => ({
  selectedBrands: state.selectedBrands,
  selectedTypes: state.selectedTypes,
  priceBounds: state.priceBounds,
  priceRange: state.priceRange,
});

export const selectSelectedProductIds = (state: ProductSelectionState) =>
  state.selectedProductIds;
