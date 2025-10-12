import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Product } from '../data/products';
import { usePriceAlertStore } from '../store/priceAlertStore';

interface PriceAlertFormProps {
  products: Product[];
  className?: string;
}

interface FormErrors {
  email?: string;
  productId?: string;
  priceThreshold?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PriceAlertForm({ products, className }: PriceAlertFormProps) {
  const { email, productId, priceThreshold, alerts, status, message } = usePriceAlertStore(
    useShallow((state) => ({
      email: state.email,
      productId: state.productId,
      priceThreshold: state.priceThreshold,
      alerts: state.alerts,
      status: state.status,
      message: state.message,
    })),
  );

  const { setEmail, setProductId, setPriceThreshold, subscribeToAlert, removeAlert, clearStatus } =
    usePriceAlertStore(
      useShallow((state) => ({
        setEmail: state.setEmail,
        setProductId: state.setProductId,
        setPriceThreshold: state.setPriceThreshold,
        subscribeToAlert: state.subscribeToAlert,
        removeAlert: state.removeAlert,
        clearStatus: state.clearStatus,
      })),
    );

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timeout = window.setTimeout(() => {
        clearStatus();
      }, 5000);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [status, clearStatus]);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        label: `${product.name} — ${product.brand}`,
      })),
    [products],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === 'loading') {
      return;
    }

    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'Veuillez saisir votre e-mail.';
    } else if (!emailPattern.test(email)) {
      newErrors.email = 'Adresse e-mail invalide.';
    }

    if (!productId) {
      newErrors.productId = 'Sélectionnez un produit.';
    }

    const numericThreshold = Number(priceThreshold);
    if (!priceThreshold) {
      newErrors.priceThreshold = 'Indiquez un seuil de prix.';
    } else if (Number.isNaN(numericThreshold) || numericThreshold <= 0) {
      newErrors.priceThreshold = 'Le seuil doit être supérieur à 0 €.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const product = products.find((item) => item.id === productId);
    if (!product) {
      setErrors({ productId: 'Produit introuvable.' });
      return;
    }

    setErrors({});
    await subscribeToAlert({ id: product.id, name: product.name }, numericThreshold);
  };

  const hasAlerts = alerts.length > 0;
  const isLoading = status === 'loading';

  return (
    <div className={`space-y-8 ${className ?? ''}`.trim()}>
      <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-neutral-200" htmlFor="price-alert-email">
            Adresse e-mail
          </label>
          <input
            id="price-alert-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
            placeholder="vous@exemple.com"
          />
          {errors.email ? <p className="mt-1 text-xs text-alert-400">{errors.email}</p> : null}
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-neutral-200" htmlFor="price-alert-product">
            Produit à surveiller
          </label>
          <select
            id="price-alert-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
          >
            <option value="">Sélectionnez un produit</option>
            {productOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.productId ? <p className="mt-1 text-xs text-alert-400">{errors.productId}</p> : null}
        </div>

        <div className="md:col-span-1">
          <label
            className="mb-1 block text-sm font-medium text-neutral-200"
            htmlFor="price-alert-threshold"
          >
            Seuil de prix (€)
          </label>
          <input
            id="price-alert-threshold"
            type="number"
            min={1}
            step="0.5"
            inputMode="decimal"
            value={priceThreshold}
            onChange={(event) => setPriceThreshold(event.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
            placeholder="ex. 29.90"
          />
          {errors.priceThreshold ? (
            <p className="mt-1 text-xs text-alert-400">{errors.priceThreshold}</p>
          ) : null}
        </div>

        <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading || products.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-flame-gradient px-5 py-2 text-sm font-medium text-white shadow-aurora-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            {isLoading ? 'Enregistrement…' : 'Créer une alerte'}
          </button>
          {products.length === 0 ? (
            <span className="text-xs text-neutral-300">Aucun produit disponible pour le moment.</span>
          ) : null}
        </div>
      </form>

      {status !== 'idle' && message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm md:px-6 ${
            status === 'success'
              ? 'border-accent-400/70 bg-accent-500/10 text-accent-200'
              : 'border-alert-400/70 bg-alert-500/10 text-alert-300'
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-300">
            Alertes actives
          </h3>
          {hasAlerts ? (
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200">
              {alerts.length} active{alerts.length > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>

        {hasAlerts ? (
          <ul className="divide-y divide-neutral-800 rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-inner">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-100">{alert.productName}</p>
                  <p className="text-xs text-neutral-300">
                    {alert.email} — seuil : {alert.priceThreshold.toFixed(2)} €
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAlert(alert.id)}
                  className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 transition hover:border-alert-400 hover:text-alert-300"
                >
                  Désactiver
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-300">
            Configurez une alerte pour être averti dès qu’un produit passe sous votre prix cible.
          </p>
        )}
      </div>
    </div>
  );
}
