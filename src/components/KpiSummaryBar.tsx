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

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
};

export const KpiSummaryBar = ({ selectedProducts, isLoading }: KpiSummaryBarProps) => {
  const metrics = useMemo(() => {
    if (selectedProducts.length === 0) {
      return null;
    }

    const priceValues = selectedProducts
      .map((product) => product.totalPrice?.amount ?? product.bestPrice?.amount ?? product.price)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    const averagePrice =
      priceValues.length > 0
        ? priceValues.reduce((sum, value) => sum + value, 0) / priceValues.length
        : null;

    const pricePerKgValues = selectedProducts
      .map((product) => product.pricePerKg)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    const averagePricePerKg =
      pricePerKgValues.length > 0
        ? pricePerKgValues.reduce((sum, value) => sum + value, 0) / pricePerKgValues.length
        : null;

    const bestValueProduct = selectedProducts
      .map((product) => ({ product, value: product.proteinPerEuro }))
      .filter(
        (entry): entry is { product: Product; value: number } =>
          typeof entry.value === 'number' && Number.isFinite(entry.value),
      )
      .sort((a, b) => b.value - a.value)[0] ?? null;

    const ratingValues = selectedProducts
      .map((product) => product.rating)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    const averageRating =
      ratingValues.length > 0
        ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
        : null;

    return {
      averagePrice,
      averagePricePerKg,
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
        label="Prix moyen / kg"
        value={
          typeof metrics.averagePricePerKg === 'number'
            ? `${metrics.averagePricePerKg.toFixed(2)} €`
            : 'N/A'
        }
        helper={
          typeof metrics.averagePricePerKg === 'number'
            ? 'Calculé sur les offres avec information prix/kg.'
            : 'Informations prix/kg indisponibles.'
        }
      />
      <KpiCard
        label="Meilleur rapport qualité/prix"
        value={metrics.bestValueProduct ? metrics.bestValueProduct.product.name : 'N/A'}
        helper={
          metrics.bestValueProduct
            ? `${metrics.bestValueProduct.value.toFixed(2)} g de protéine / €`
            : 'Sélectionnez un produit riche en protéines.'
        }
      />
      <KpiCard
        label="Note moyenne"
        value={
          typeof metrics.averageRating === 'number'
            ? `${metrics.averageRating.toFixed(1)} / 5`
            : 'N/A'
        }
      />
    </section>
  );
};
