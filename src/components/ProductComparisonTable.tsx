import { useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Price, Product } from '../data/products';
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

const typeLabels: Record<Product['type'], string> = {
  whey: 'Whey',
  creatine: 'Créatine',
  other: 'Autre',
};

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

const formatPrice = (price: Price | null | undefined) => {
  if (!price) {
    return 'N/A';
  }

  if (price.formatted) {
    return price.formatted;
  }

  return formatCurrency(price.amount);
};

const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
};

const formatStock = (product: Product) => {
  if (typeof product.inStock === 'boolean') {
    return product.inStock ? 'En stock' : 'Rupture';
  }

  if (product.stockStatus) {
    return product.stockStatus;
  }

  return 'Indisponible';
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
          render: (product: Product) => typeLabels[product.type] ?? typeLabels.other,
        },
        {
          label: 'Meilleur prix',
          render: (product: Product) => formatPrice(product.bestPrice ?? product.totalPrice),
        },
        {
          label: 'Prix total (livraison)',
          render: (product: Product) => formatPrice(product.totalPrice ?? product.bestPrice),
        },
        {
          label: 'Vendeur mis en avant',
          render: (product: Product) => product.bestVendor ?? '—',
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
          label: 'Protéines / €',
          render: (product: Product) =>
            typeof product.proteinPerEuro === 'number'
              ? `${formatNumber(product.proteinPerEuro)} g`
              : 'N/A',
        },
        {
          label: 'Protéines / portion',
          render: (product: Product) =>
            typeof product.proteinPerServing === 'number'
              ? `${formatNumber(product.proteinPerServing)} g`
              : 'N/A',
        },
        {
          label: 'Taille portion',
          render: (product: Product) =>
            typeof product.servingSize === 'number'
              ? `${formatNumber(product.servingSize)} g`
              : 'N/A',
        },
        {
          label: 'Prix / kg',
          render: (product: Product) =>
            typeof product.pricePerKg === 'number'
              ? `${product.pricePerKg.toFixed(2)} €`
              : 'N/A',
        },
        {
          label: 'Disponibilité',
          render: (product: Product) => formatStock(product),
        },
        {
          label: 'Offres suivies',
          render: (product: Product) =>
            product.offersCount > 0 ? `${product.offersCount}` : 'Aucune donnée',
        },
        {
          label: 'Note moyenne',
          render: (product: Product) =>
            typeof product.rating === 'number' ? `${product.rating.toFixed(1)} / 5` : 'N/A',
        },
        {
          label: 'Saveur',
          render: (product: Product) => product.flavor ?? '—',
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
    <section className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Comparatif des produits</h2>
          <p className="text-sm text-slate-500">Colonnes dynamiques selon votre sélection.</p>
        </div>
        <p className="text-xs text-slate-400">Retirez un produit pour libérer une place dans le comparateur.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <ProductImage
                imageUrl={product.imageUrl}
                alt={product.imageAlt}
                className="h-16 w-16 flex-shrink-0 rounded-xl border border-white shadow"
                fallbackLabel={product.imageAlt}
              />
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                  {typeLabels[product.type] ?? typeLabels.other}
                </span>
                <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                <span className="text-xs text-slate-500">{product.bestVendor ?? product.brand}</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {formatPrice(product.bestPrice ?? product.totalPrice)}
                </p>
                <p className="text-xs text-slate-500">
                  {typeof product.pricePerKg === 'number'
                    ? `${product.pricePerKg.toFixed(2)} € / kg`
                    : formatStock(product)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleProductSelection(product.id)}
                className="rounded-full border border-primary-200 px-3 py-1 text-xs font-medium text-primary-600 transition hover:border-primary-300 hover:bg-primary-50"
              >
                Retirer
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} border-b border-slate-100 last:border-0`}
              >
                <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </th>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-4 align-top text-slate-700">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-slate-100 bg-white">
              <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lien
              </th>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4">
                  {product.link ? (
                    <a
                      href={product.link}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir le produit
                      <span aria-hidden>↗</span>
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
