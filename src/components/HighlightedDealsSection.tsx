import { useMemo } from 'react';

import type { HighlightedDeal, Product } from '../data/products';
import { ProductImage } from './ProductImage';

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
      <section className="surface-card glass-effect grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
        ))}
      </section>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="surface-card glass-effect space-y-6 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Offres à ne pas manquer</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Promotions vérifiées et remises limitées dans le temps pour optimiser votre panier.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ deal, product }) => {
          const discountPercent = Math.round(product.discountRate * 100);
          const endsAtLabel = formatDate(product.promotionEndsAt);

          return (
            <article
              key={deal.id}
              className="group flex h-full flex-col justify-between gap-6 rounded-3xl border border-transparent bg-white/70 p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-glow-primary dark:bg-slate-900/60"
            >
              <div className="space-y-3">
                <ProductImage
                  imageUrl={product.imageUrl}
                  alt={product.imageAlt ?? product.name}
                  className="h-40 w-full rounded-2xl"
                  fallbackLabel={`${product.brand} ${product.name}`}
                />
                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                  {product.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-primary-50 px-2 py-1 text-primary-700 shadow-sm dark:bg-primary-500/10 dark:text-primary-200"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{product.brand}</p>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{product.name}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{deal.description}</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="price-tag text-base">{formatCurrency(product.price)}</span>
                  {product.discountRate > 0 ? (
                    <>
                      <span className="text-sm text-slate-400 line-through dark:text-slate-500">
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className="text-sm font-semibold text-accent-500">-{discountPercent}%</span>
                    </>
                  ) : null}
                </div>
                {endsAtLabel ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Offre valable jusqu’au {endsAtLabel}.</p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">Offre permanente.</p>
                )}
                <a
                  href={product.link ?? '#'}
                  className="btn-primary inline-flex w-full justify-center"
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
