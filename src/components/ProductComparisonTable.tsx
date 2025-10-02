import { useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Product } from '../data/products';
import { useProductSelectionStore } from '../store/productSelectionStore';

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
              <span className="text-base font-semibold text-slate-900">{formatCurrency(product.price)}</span>
              {product.discountRate > 0 ? (
                <span className="text-xs text-slate-500">
                  <span className="mr-2 line-through">{formatCurrency(product.originalPrice)}</span>
                  <span className="font-semibold text-emerald-600">
                    -{Math.round(product.discountRate * 100)}%
                  </span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">Aucune remise</span>
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
                    className="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400">Aucun badge</span>
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
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length < 2) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Choisissez au moins 2 produits</h2>
        <p className="mt-2 text-sm text-slate-500">
          Utilisez la colonne de gauche pour sélectionner entre deux et quatre produits à comparer.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Comparatif des produits</h2>
          <p className="text-sm text-slate-500">Colonnes dynamiques selon votre sélection.</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr>
              <th className="w-48 border-b border-slate-200 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Critère
              </th>
              {products.map((product) => (
                <th
                  key={product.id}
                  className="border-b border-slate-200 pb-3 text-left text-base font-semibold text-slate-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div>{product.name}</div>
                      <div className="text-xs text-slate-500">{product.brand}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleProductSelection(product.id)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Retirer
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <th className="py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</th>
                {products.map((product) => (
                  <td key={product.id} className="py-4 pr-6">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-slate-100">
              <th className="py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Lien</th>
              {products.map((product) => (
                <td key={product.id} className="py-4">
                  {product.link ? (
                    <a
                      href={product.link}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir le produit
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">Non renseigné</span>
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
