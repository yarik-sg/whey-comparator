import { useMemo } from 'react';

import type { HighlightedDeal, Product } from '../data/products';

type HighlightedDealsSectionProps = {
  deals: HighlightedDeal[];
  products: Product[];
  isLoading: boolean;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (isoDate: string | null) => {
  if (!isoDate) {
    return null;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date(isoDate));
};

export const HighlightedDealsSection = ({ deals, products, isLoading }: HighlightedDealsSectionProps) => {
  const cards = useMemo(() => {
    if (products.length === 0) {
      return [];
    }

    return deals
      .map((deal) => {
        const product = products.find((item) => item.id === deal.productId);
        if (!product) {
          return undefined;
        }

        return {
          deal,
          product,
        };
      })
      .filter(Boolean) as Array<{ deal: HighlightedDeal; product: Product }>;
  }, [deals, products]);

  if (isLoading) {
    return (
      <section className="grid gap-4 rounded-2xl bg-white/80 p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </section>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl bg-white/80 p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Offres à ne pas manquer</h2>
        <p className="text-sm text-slate-500">
          Promotions vérifiées et remises limitées dans le temps pour optimiser votre panier.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ deal, product }) => {
          const discountPercent = Math.round(product.discountRate * 100);
          const endsAtLabel = formatDate(product.promotionEndsAt);

          return (
            <article
              key={deal.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-600">
                  {product.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-primary-50 px-2 py-1 text-primary-700"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{product.brand}</p>
                  <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                </div>
                <p className="text-sm text-slate-600">{deal.description}</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(product.price)}</span>
                  {product.discountRate > 0 ? (
                    <>
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className="text-sm font-semibold text-emerald-600">-{discountPercent}%</span>
                    </>
                  ) : null}
                </div>
                {endsAtLabel ? (
                  <p className="text-xs text-slate-500">Offre valable jusqu’au {endsAtLabel}.</p>
                ) : (
                  <p className="text-xs text-slate-400">Offre permanente.</p>
                )}
                <a
                  href={product.link ?? '#'}
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  {deal.ctaLabel}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
