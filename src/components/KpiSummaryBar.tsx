import { useMemo } from 'react';

import type { Product } from '../data/products';

interface KpiSummaryBarProps {
  selectedProducts: Product[];
  isLoading: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  helper?: string;
}

const KpiCard = ({ label, value, helper }: KpiCardProps) => (
  <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
  </div>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

export const KpiSummaryBar = ({ selectedProducts, isLoading }: KpiSummaryBarProps) => {
  const metrics = useMemo(() => {
    if (selectedProducts.length === 0) {
      return null;
    }

    const totalPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0);
    const averagePrice = totalPrice / selectedProducts.length;

    const proteinBasedProducts = selectedProducts.filter((product) => product.proteinPerServing > 0);
    const pricePer100g = proteinBasedProducts.map((product) => {
      const totalProtein = product.proteinPerServing * product.servings;
      return totalProtein > 0 ? (product.price / totalProtein) * 100 : Number.POSITIVE_INFINITY;
    });

    const averagePricePer100g =
      pricePer100g.length > 0
        ? pricePer100g.reduce((sum, value) => sum + value, 0) / pricePer100g.length
        : undefined;

    const bestValueProduct = proteinBasedProducts.reduce<
      | { product: Product; value: number }
      | undefined
    >((best, product) => {
      const totalProtein = product.proteinPerServing * product.servings;
      if (totalProtein === 0) {
        return best;
      }
      const value = (product.price / totalProtein) * 100;
      if (!best || value < best.value) {
        return { product, value };
      }
      return best;
    }, undefined);

    const averageRating =
      selectedProducts.reduce((sum, product) => sum + product.rating, 0) / selectedProducts.length;

    return {
      averagePrice,
      averagePricePer100g,
      bestValueProduct,
      averageRating,
    };
  }, [selectedProducts]);

  if (isLoading) {
    return (
      <section className="grid gap-4 rounded-2xl bg-white/80 p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </section>
    );
  }

  if (!metrics) {
    return (
      <section className="rounded-2xl bg-white/80 p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          Sélectionnez des produits pour voir les indicateurs clés (KPIs).
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-2xl bg-white/80 p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Prix moyen" value={formatCurrency(metrics.averagePrice)} />
      <KpiCard
        label="Prix moyen / 100 g de protéine"
        value={
          metrics.averagePricePer100g
            ? `${metrics.averagePricePer100g.toFixed(2)} €`
            : 'N/A'
        }
        helper={
          metrics.averagePricePer100g
            ? 'Basé sur les produits riches en protéines sélectionnés.'
            : 'Aucun produit protéiné sélectionné.'
        }
      />
      <KpiCard
        label="Meilleur rapport qualité/prix"
        value={metrics.bestValueProduct ? metrics.bestValueProduct.product.name : 'N/A'}
        helper={
          metrics.bestValueProduct
            ? `${metrics.bestValueProduct.value.toFixed(2)} € / 100 g de protéine`
            : 'Sélectionnez au moins une whey.'
        }
      />
      <KpiCard label="Note moyenne" value={`${metrics.averageRating.toFixed(1)} / 5`} />
    </section>
  );
};
