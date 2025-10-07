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
      className="relative overflow-hidden rounded-4xl border border-primary-200/40 bg-gradient-to-br from-primary-50/70 via-white/85 to-accent-50/70 p-8 shadow-[0_35px_80px_-45px_rgba(59,130,246,0.45)] transition dark:border-primary-400/30 dark:from-slate-900/60 dark:via-slate-900/50 dark:to-emerald-900/40"
    >
      <div className="absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary-300/40 blur-3xl dark:bg-primary-500/30" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">Alertes prix</p>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Soyez averti dès qu'un complément atteint votre prix idéal
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Enregistrez une alerte et recevez un email lorsque nos partenaires franchissent votre seuil cible.
            Chaque inscription déclenche une surveillance automatique avec accusé de réception.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Priorité aux meilleures offres whey et créatine.</li>
            <li>• Désactivation en un clic depuis le tableau des alertes.</li>
            <li>• {activeAlertLabel}</li>
          </ul>
        </div>
        <div className="w-full max-w-xl">
          {isLoading && products.length === 0 ? (
            <div className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-lg shadow-primary-900/10 backdrop-blur dark:bg-slate-900/70">
              <div className="h-5 w-40 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
                    <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-100/80 dark:bg-slate-800/50" />
                  </div>
                ))}
              </div>
              <div className="h-10 w-full animate-pulse rounded-full bg-primary-200/80 dark:bg-primary-500/30" />
            </div>
          ) : (
            <PriceAlertForm
              products={products}
              className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-primary-900/10 backdrop-blur-sm dark:bg-slate-950/70"
            />
          )}
          {status === 'loading' ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Connexion au service d'alertes en cours…
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
