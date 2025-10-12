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
                    className="rounded-full bg-secondary-100/80 px-2 py-1 text-xs font-semibold text-neutral-900"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-neutral-400">Aucun badge</span>
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
          render: (product: Product) => {
            const label = formatStock(product);
            if (typeof product.inStock === 'boolean') {
              return (
                <span className={product.inStock ? 'text-accent-300' : 'text-alert-400'}>{label}</span>
              );
            }
            return <span className="text-neutral-300">{label}</span>;
          },
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
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-aurora-soft">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-neutral-800/60" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-neutral-800/60" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length < 2) {
    return (
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 text-center shadow-aurora-soft">
        <h2 className="text-lg font-semibold text-white">Choisissez au moins 2 produits</h2>
        <p className="mt-2 text-sm text-neutral-300">
          Utilisez la colonne de gauche pour sélectionner entre deux et quatre produits à comparer.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-aurora-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Comparatif des produits</h2>
          <p className="text-sm text-neutral-300">Colonnes dynamiques selon votre sélection.</p>
        </div>
        <p className="text-xs text-neutral-400">Retirez un produit pour libérer une place dans le comparateur.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex h-full flex-col justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-inner"
          >
            <div className="flex items-start gap-3">
              <ProductImage
                imageUrl={product.imageUrl}
                alt={product.imageAlt}
                className="h-16 w-16 flex-shrink-0 rounded-xl border border-secondary-200/70 shadow-aurora-soft"
                fallbackLabel={product.imageAlt}
              />
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary-300">
                  {typeLabels[product.type] ?? typeLabels.other}
                </span>
                <h3 className="text-base font-semibold text-white">{product.name}</h3>
                <span className="text-xs text-neutral-300">{product.bestVendor ?? product.brand}</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-secondary-200">
                  {formatPrice(product.bestPrice ?? product.totalPrice)}
                </p>
                <p className="text-xs text-neutral-400">
                  {typeof product.pricePerKg === 'number'
                    ? `${product.pricePerKg.toFixed(2)} € / kg`
                    : formatStock(product)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleProductSelection(product.id)}
                className="rounded-full border border-secondary-300/70 bg-secondary-100/80 px-3 py-1 text-xs font-medium text-neutral-900 transition hover:bg-secondary-200/80"
              >
                Retirer
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left text-sm text-neutral-200">
          <thead className="bg-neutral-900/80 text-xs font-semibold uppercase tracking-wide text-secondary-300">
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
                className={`${rowIndex % 2 === 0 ? 'bg-neutral-900/70' : 'bg-neutral-900/50'} border-b border-neutral-800 last:border-0`}
              >
                <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-secondary-300">
                  {row.label}
                </th>
                {products.map((product) => (
                  <td key={product.id} className="px-4 py-4 align-top text-neutral-200">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-neutral-800 bg-neutral-900/70">
              <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-secondary-300">
                Lien
              </th>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4">
                  {product.link ? (
                    <a
                      href={product.link}
                      className="inline-flex items-center gap-2 text-sm font-medium text-secondary-200 hover:text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir le produit
                      <span aria-hidden>↗</span>
                    </a>
                  ) : (
                    <span className="text-sm text-neutral-400">Non renseigné</span>
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
