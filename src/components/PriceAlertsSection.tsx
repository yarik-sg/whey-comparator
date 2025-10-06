import { useShallow } from 'zustand/react/shallow';

import type { Product } from '../data/products';
import { usePriceAlertStore } from '../store/priceAlertStore';
import { PriceAlertForm } from './PriceAlertForm';

interface PriceAlertsSectionProps {
  products: Product[];
  isLoading: boolean;
}

export function PriceAlertsSection({ products, isLoading }: PriceAlertsSectionProps) {
  const { alerts, status } = usePriceAlertStore(
    useShallow((state) => ({ alerts: state.alerts, status: state.status })),
  );

  const activeAlertLabel =
    alerts.length === 0
      ? 'Aucune alerte créée pour le moment.'
      : alerts.length === 1
        ? '1 alerte active — soyez le premier averti !'
        : `${alerts.length} alertes actives — merci pour votre confiance !`;

  return (
    <section
      id="price-alerts"
      className="relative overflow-hidden rounded-3xl border border-primary-100 bg-primary-50/60 p-8"
    >
      <div className="absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary-200/40 blur-3xl" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Alertes prix</p>
          <h2 className="text-3xl font-bold text-slate-900">
            Soyez averti dès qu'un complément atteint votre prix idéal
          </h2>
          <p className="text-base text-slate-600">
            Enregistrez une alerte et recevez un email lorsque nos partenaires franchissent votre seuil cible.
            Chaque inscription déclenche une surveillance automatique avec accusé de réception.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Priorité aux meilleures offres whey et créatine.</li>
            <li>• Désactivation en un clic depuis le tableau des alertes.</li>
            <li>• {activeAlertLabel}</li>
          </ul>
        </div>
        <div className="w-full max-w-xl">
          {isLoading && products.length === 0 ? (
            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm shadow-primary-900/5">
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
              <div className="h-10 w-full animate-pulse rounded-full bg-primary-100" />
            </div>
          ) : (
            <PriceAlertForm
              products={products}
              className="rounded-2xl bg-white p-6 shadow-sm shadow-primary-900/10"
            />
          )}
          {status === 'loading' ? (
            <p className="mt-2 text-xs text-slate-500">
              Connexion au service d'alertes en cours…
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
