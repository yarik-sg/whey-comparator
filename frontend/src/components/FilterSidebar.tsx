"use client";

import { useMemo, useState } from "react";
import { Filter, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export interface ProductFilters {
  minPrice?: number | null;
  maxPrice?: number | null;
  brands: string[];
  minRating?: number | null;
  inStock?: boolean | null;
  category?: string | null;
}

interface FilterSidebarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onReset: () => void;
  availableBrands: string[];
  isLoading?: boolean;
}

const DEFAULT_PRICE_MAX = 200;

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  availableBrands,
  isLoading = false,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const sliderMin = 0;
  const sliderMax = Math.max(filters.maxPrice ?? DEFAULT_PRICE_MAX, DEFAULT_PRICE_MAX);
  const sliderValue: [number, number] = [
    filters.minPrice ?? sliderMin,
    filters.maxPrice ?? sliderMax,
  ];

  const brandOptions = useMemo(
    () => availableBrands.slice(0, 10).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    [availableBrands],
  );

  const handlePriceChange = ([minValue, maxValue]: [number, number]) => {
    const normalizedMin = minValue <= sliderMin ? null : Math.round(minValue);
    const normalizedMax = maxValue >= sliderMax ? null : Math.round(maxValue);

    onChange({
      ...filters,
      minPrice: normalizedMin,
      maxPrice: normalizedMax,
    });
  };

  const toggleBrand = (brand: string) => {
    const normalized = brand.toLowerCase();
    const hasBrand = filters.brands.some((value) => value.toLowerCase() === normalized);
    const nextBrands = hasBrand
      ? filters.brands.filter((value) => value.toLowerCase() !== normalized)
      : [...filters.brands, brand];
    onChange({ ...filters, brands: nextBrands });
  };

  const priceActive =
    filters.minPrice !== null && filters.minPrice !== undefined
      ? true
      : filters.maxPrice !== null && filters.maxPrice !== undefined;
  const activeFiltersCount =
    (filters.brands?.length ?? 0) +
    (filters.minRating ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (priceActive ? 1 : 0);

  if (isLoading) {
    return (
      <aside className="space-y-4 rounded-2xl border border-secondary/60 bg-white p-4">
        <div className="h-5 w-28 animate-pulse rounded-full bg-accent/60" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-4 w-full animate-pulse rounded-full bg-accent/70" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-secondary/60 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-secondary/60 px-4 py-3">
        <div className="flex items-center gap-2 text-muted">
          <Filter className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="font-semibold">Filtres</h3>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? "Masquer les filtres" : "Afficher les filtres"}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden /> : <Filter className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div className={`${isOpen ? "block" : "hidden lg:block"}`}>
        <section className="space-y-4 border-b border-secondary/60 px-4 py-4">
          <h4 className="text-sm font-semibold text-dark">Budget</h4>
          <Slider min={sliderMin} max={sliderMax} step={5} value={sliderValue} onValueChange={handlePriceChange} />
          <div className="flex justify-between text-xs text-muted">
            <span>{(filters.minPrice ?? sliderMin).toLocaleString("fr-FR")}€</span>
            <span>{(filters.maxPrice ?? sliderMax).toLocaleString("fr-FR")}€</span>
          </div>
        </section>

        {brandOptions.length > 0 && (
          <section className="space-y-3 border-b border-secondary/60 px-4 py-4">
            <h4 className="text-sm font-semibold text-dark">Marques populaires</h4>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
              {brandOptions.map((brand) => {
                const checked = filters.brands.some(
                  (value) => value.toLowerCase() === brand.toLowerCase(),
                );
                return (
                  <label key={brand} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-muted hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={checked} onChange={() => toggleBrand(brand)} />
                      <span>{brand}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-3 border-b border-secondary/60 px-4 py-4">
          <h4 className="text-sm font-semibold text-dark">Note minimale</h4>
          <div className="flex flex-col gap-2 text-sm text-muted">
            {[4, 3, 2].map((rating) => (
              <label key={rating} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={filters.minRating === rating}
                  onChange={() => onChange({ ...filters, minRating: rating })}
                />
                <span>{rating}+ étoiles</span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => onChange({ ...filters, minRating: null })}
              className="self-start text-xs font-medium text-primary hover:text-secondary"
            >
              Réinitialiser la note
            </button>
          </div>
        </section>

        <section className="space-y-3 border-b border-secondary/60 px-4 py-4">
          <h4 className="text-sm font-semibold text-dark">Disponibilité</h4>
          <label className="flex items-center gap-2 text-sm text-muted">
            <Checkbox
              checked={Boolean(filters.inStock)}
              onChange={(event) =>
                onChange({ ...filters, inStock: event.target.checked ? true : null })
              }
            />
            En stock uniquement
          </label>
        </section>

        <section className="space-y-3 border-b border-secondary/60 px-4 py-4">
          <h4 className="text-sm font-semibold text-dark">Catégorie</h4>
          <Input
            type="text"
            value={filters.category ?? ""}
            onChange={(event) =>
              onChange({ ...filters, category: event.target.value.trim() || null })
            }
            placeholder="Ex: whey, vegan..."
          />
        </section>

        <div className="px-4 py-4">
          <button
            type="button"
            onClick={onReset}
            disabled={activeFiltersCount === 0}
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFiltersCount > 0
                ? "bg-dark text-white hover:bg-dark/80"
                : "bg-accent/70 text-muted/80"
            }`}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </aside>
  );
}
