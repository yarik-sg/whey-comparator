import { useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Product } from '../data/products';
import { useProductSelectionStore } from '../store/productSelectionStore';
import { ProductImage } from './ProductImage';

interface ProductComparisonTableProps {
  products: Product[];
  isLoading: boolean;
}

interface ComparisonRow {
  label: string;
  render: (product: Product) => ReactNode;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    ...options,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date(value));
};

export const ProductComparisonTable = ({ products, isLoading }: ProductComparisonTableProps) => {
  const toggleProductSelection = useProductSelectionStore((state) => state.toggleProductSelection);

  const rows = useMemo<ComparisonRow[]>(
    () =>
      [
        {
          label: 'Marque',
          render: (product: Product) => product.brand,
        },
        {
          label: 'Type',
          render: (product: Product) => (product.type === 'whey' ? 'Whey' : 'Créatine'),
        },
        {
          label: 'Prix actuel',
          render: (product: Product) => (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(product.price)}
              </span>
              {product.discountRate > 0 ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="mr-2 line-through text-slate-400 dark:text-slate-500">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    -{Math.round(product.discountRate * 100)}%
                  </span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">Aucune remise</span>
              )}
            </div>
          ),
        },
        {
          label: 'Fin de promo',
          render: (product: Product) => {
            const formattedDate = formatDate(product.promotionEndsAt);
            return formattedDate ? `Jusqu’au ${formattedDate}` : 'Offre permanente';
          },
        },
        {
          label: 'Badges',
          render: (product: Product) =>
            product.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 shadow-sm dark:bg-primary-500/10 dark:text-primary-200"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">Aucun badge</span>
            ),
        },
        {
          label: 'Portions',
          render: (product: Product) => formatNumber(product.servings, { maximumFractionDigits: 0 }),
        },
        {
          label: 'Protéines / portion',
          render: (product: Product) =>
            product.proteinPerServing > 0 ? `${formatNumber(product.proteinPerServing)} g` : 'N/A',
        },
        {
          label: 'Créatine / portion',
          render: (product: Product) =>
            product.creatinePerServing ? `${formatNumber(product.creatinePerServing)} g` : 'N/A',
        },
        {
          label: 'Prix / portion',
          render: (product: Product) => formatCurrency(product.price / product.servings),
        },
        {
          label: 'Taille du pot',
          render: (product: Product) => `${formatNumber(product.sizeGrams, { maximumFractionDigits: 0 })} g`,
        },
        {
          label: 'Arôme',
          render: (product: Product) => product.flavor,
        },
        {
          label: 'Note moyenne',
          render: (product: Product) => `${formatNumber(product.rating)} / 5`,
        },
      ],
    [],
  );

  if (isLoading) {
    return (
      <section className="surface-card glass-effect space-y-4 p-6">
        <div className="h-6 w-48 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-700/40" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length < 2) {
    return (
      <section className="surface-card glass-effect p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Choisissez au moins 2 produits</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Utilisez la colonne de gauche pour sélectionner entre deux et quatre produits à comparer.
        </p>
      </section>
    );
  }

  return (
    <section className="surface-card glass-effect space-y-8 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comparatif des produits</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Colonnes dynamiques selon votre sélection.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Retirez un produit pour libérer une place dans le comparateur.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-200/60 bg-white/70 p-5 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-glow-primary dark:border-slate-700/40 dark:bg-slate-900/60"
          >
            <div className="flex items-start gap-3">
              <ProductImage
                imageUrl={product.imageUrl}
                alt={product.imageAlt ?? product.name}
                className="h-16 w-16 flex-shrink-0 rounded-2xl border border-white/60 shadow-sm shadow-slate-900/10 dark:border-slate-700/40"
                fallbackLabel={`${product.brand} ${product.name}`}
              />
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                  {product.brand}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{product.name}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {product.servings} portions • {product.flavor}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="price-tag text-sm">{formatCurrency(product.price)}</span>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {formatCurrency(product.price / product.servings)} / portion
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleProductSelection(product.id)}
                className="btn-ghost rounded-full border-primary-200/60 px-3 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50/60 dark:border-primary-400/30 dark:text-primary-200 dark:hover:bg-primary-500/10"
              >
                Retirer
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left text-sm text-slate-700 dark:text-slate-200">
          <thead className="bg-slate-100/60 text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur dark:bg-slate-800/50 dark:text-slate-300">
            <tr>
              <th className="w-48 px-4 py-3">Critère</th>
              {products.map((product) => (
                <th key={product.id} className="min-w-[160px] px-4 py-3 text-left">
                  {product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.label}
                className={`${rowIndex % 2 === 0 ? 'bg-white/70 dark:bg-slate-900/40' : 'bg-slate-100/60 dark:bg-slate-800/40'} border-b border-slate-100/60 dark:border-slate-700/40 last:border-0`}
              >
                <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {row.label}
                </th>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-4 align-top text-slate-700 dark:text-slate-200">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-slate-100/60 bg-white/70 dark:border-slate-700/40 dark:bg-slate-900/50">
              <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Lien
              </th>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4">
                  {product.link ? (
                    <a
                      href={product.link}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-500 dark:text-primary-300 dark:hover:text-primary-200"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir le produit
                      <span aria-hidden>↗</span>
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500">Non renseigné</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
