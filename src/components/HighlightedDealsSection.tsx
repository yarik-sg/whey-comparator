import type { Deal } from '../data/products';
import { ProductImage } from './ProductImage';

type HighlightedDealsSectionProps = {
  deals: Deal[];
  isLoading: boolean;
};

const formatCurrency = (value: number | null | undefined, currency = 'EUR') => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const resolvePriceLabel = (deal: Deal) => {
  if (deal.price?.formatted) {
    return deal.price.formatted;
  }

  if (typeof deal.price?.amount === 'number') {
    return formatCurrency(deal.price.amount, deal.price.currency ?? 'EUR');
  }

  return 'Prix indisponible';
};

const resolveTotalPriceLabel = (deal: Deal) => {
  if (deal.totalPrice?.formatted) {
    return deal.totalPrice.formatted;
  }

  if (typeof deal.totalPrice?.amount === 'number') {
    return formatCurrency(deal.totalPrice.amount, deal.totalPrice.currency ?? 'EUR');
  }

  return null;
};

export const HighlightedDealsSection = ({ deals, isLoading }: HighlightedDealsSectionProps) => {
  if (isLoading) {
    return (
      <section className="grid gap-4 rounded-2xl bg-white/80 p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </section>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl bg-white/80 p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Offres à ne pas manquer</h2>
        <p className="text-sm text-slate-500">
          Sélection des meilleures opportunités identifiées sur nos sources partenaires.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => {
          const totalPriceLabel = resolveTotalPriceLabel(deal);

          return (
            <article
              key={deal.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="space-y-3">
                <ProductImage
                  imageUrl={deal.image}
                  alt={deal.title}
                  className="h-40 w-full rounded-xl"
                  fallbackLabel={deal.title}
                />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                    {deal.vendor}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">{deal.title}</h3>
                  <p className="text-xs text-slate-500">Source : {deal.source}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{resolvePriceLabel(deal)}</span>
                  {totalPriceLabel && totalPriceLabel !== resolvePriceLabel(deal) ? (
                    <span className="text-xs text-slate-500">avec livraison : {totalPriceLabel}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {typeof deal.shippingCost === 'number' ? (
                    <span>Livraison : {formatCurrency(deal.shippingCost)}</span>
                  ) : null}
                  {deal.shippingText ? <span>{deal.shippingText}</span> : null}
                  {typeof deal.pricePerKg === 'number' ? (
                    <span>{deal.pricePerKg.toFixed(2)} € / kg</span>
                  ) : null}
                  {deal.inStock !== null && deal.inStock !== undefined ? (
                    <span className={deal.inStock ? 'text-emerald-600' : 'text-red-500'}>
                      {deal.inStock ? 'En stock' : 'Rupture'}
                    </span>
                  ) : null}
                </div>
                <a
                  href={deal.link ?? '#'}
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir l’offre
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
