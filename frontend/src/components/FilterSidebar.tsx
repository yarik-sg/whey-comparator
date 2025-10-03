"use client";

import { useMemo } from "react";

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

function parseNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  availableBrands,
  isLoading = false,
}: FilterSidebarProps) {
  const brandOptions = useMemo(
    () => availableBrands.slice(0, 12).sort((a, b) => a.localeCompare(b)),
    [availableBrands],
  );

  const handleToggleBrand = (brand: string) => {
    const normalized = brand.toLowerCase();
    const hasBrand = filters.brands.some((value) => value.toLowerCase() === normalized);

    const updatedBrands = hasBrand
      ? filters.brands.filter((value) => value.toLowerCase() !== normalized)
      : [...filters.brands, brand];

    onChange({ ...filters, brands: updatedBrands });
  };

  if (isLoading) {
    return (
      <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-4 w-full animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Filtres</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-orange-300 transition hover:text-orange-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          Réinitialiser
        </button>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Prix (€)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Min</span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={filters.minPrice ?? ""}
              onChange={(event) =>
                onChange({ ...filters, minPrice: parseNumber(event.target.value) })
              }
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Max</span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={filters.maxPrice ?? ""}
              onChange={(event) =>
                onChange({ ...filters, maxPrice: parseNumber(event.target.value) })
              }
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>
        </div>
      </fieldset>

      {brandOptions.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Marques
          </legend>
          <div className="space-y-2">
            {brandOptions.map((brand) => {
              const id = `brand-${brand.toLowerCase().replace(/[^a-z0-9]/gi, "-")}`;
              const checked = filters.brands.some(
                (value) => value.toLowerCase() === brand.toLowerCase(),
              );

              return (
                <label key={brand} htmlFor={id} className="flex items-center gap-2">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleBrand(brand)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-400"
                  />
                  <span>{brand}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Note minimale
        </legend>
        <select
          value={filters.minRating ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              minRating: event.target.value === "" ? null : Number(event.target.value),
            })
          }
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">Toutes</option>
          <option value="3">3 ★</option>
          <option value="3.5">3.5 ★</option>
          <option value="4">4 ★</option>
          <option value="4.5">4.5 ★</option>
        </select>
      </fieldset>

      <fieldset className="flex items-center justify-between">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Disponibilité
        </legend>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(event) =>
              onChange({ ...filters, inStock: event.target.checked ? true : null })
            }
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-400"
          />
          <span>En stock uniquement</span>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Catégorie
        </legend>
        <input
          type="text"
          value={filters.category ?? ""}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value || null })
          }
          placeholder="Ex: whey, vegan..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </fieldset>
    </aside>
  );
}
