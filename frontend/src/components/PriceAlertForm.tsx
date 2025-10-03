"use client";

import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";

interface FormState {
  email: string;
  product: string;
  priceThreshold: string;
}

interface FormErrors {
  email?: string;
  product?: string;
  priceThreshold?: string;
}

interface SubmissionStatus {
  state: "idle" | "loading" | "success" | "error";
  message?: string;
}

const initialState: FormState = {
  email: "",
  product: "",
  priceThreshold: "",
};

export function PriceAlertForm() {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>({ state: "idle" });

  const isSubmitting = status.state === "loading";

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validate = useCallback(
    (state: FormState): FormErrors => {
      const currentErrors: FormErrors = {};

      if (!state.email) {
        currentErrors.email = "L'e-mail est requis.";
      } else if (!emailRegex.test(state.email)) {
        currentErrors.email = "Veuillez entrer un e-mail valide.";
      }

      if (!state.product.trim()) {
        currentErrors.product = "Indiquez le produit que vous souhaitez suivre.";
      }

      const parsedThreshold = Number.parseFloat(state.priceThreshold.replace(",", "."));
      if (!state.priceThreshold) {
        currentErrors.priceThreshold = "Le seuil est requis.";
      } else if (Number.isNaN(parsedThreshold) || parsedThreshold <= 0) {
        currentErrors.priceThreshold = "Saisissez un montant supérieur à 0.";
      }

      return currentErrors;
    },
    [emailRegex]
  );

  const handleChange = useCallback((key: keyof FormState) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [key]: event.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
      if (status.state !== "idle") {
        setStatus({ state: "idle" });
      }
    };
  }, [status.state]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validationErrors = validate(formState);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setStatus({ state: "error", message: "Veuillez corriger les erreurs ci-dessous." });
        return;
      }

      setStatus({ state: "loading" });

      try {
        const response = await fetch("/api/alerts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formState.email.trim(),
            product: formState.product.trim(),
            priceThreshold: Number.parseFloat(formState.priceThreshold.replace(",", ".")),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = typeof data.message === "string" ? data.message : undefined;
          throw new Error(message ?? "Impossible d'enregistrer votre alerte pour le moment.");
        }

        setStatus({
          state: "success",
          message: "Votre alerte a été enregistrée ! Nous vous préviendrons dès que le prix baisse.",
        });
        setFormState(initialState);
        setErrors({});
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
        setStatus({ state: "error", message });
      }
    },
    [formState, validate]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-white/10 bg-[#0d1b2a] p-8 shadow-lg"
      autoComplete="off"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2" suppressHydrationWarning>
          <label htmlFor="alert-email" className="block text-sm font-medium text-gray-200">
            Adresse e-mail
          </label>
          <input
            id="alert-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            data-lpignore="true"
            data-lastpass-icon="false"
            value={formState.email}
            onChange={handleChange("email")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
            placeholder="vous@exemple.com"
            required
          />
          {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="alert-product" className="block text-sm font-medium text-gray-200">
            Produit ciblé
          </label>
          <input
            id="alert-product"
            type="text"
            data-lastpass-icon="false"
            value={formState.product}
            onChange={handleChange("product")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
            placeholder="Ex. Whey Native Chocolat 1kg"
            required
          />
          {errors.product && <p className="mt-2 text-sm text-red-400">{errors.product}</p>}
        </div>

        <div>
          <label htmlFor="alert-threshold" className="block text-sm font-medium text-gray-200">
            Seuil de prix (€)
          </label>
          <input
            id="alert-threshold"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            data-lastpass-icon="false"
            value={formState.priceThreshold}
            onChange={handleChange("priceThreshold")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
            placeholder="Ex. 24.90"
            required
          />
          {errors.priceThreshold && (
            <p className="mt-2 text-sm text-red-400">{errors.priceThreshold}</p>
          )}
        </div>
      </div>

      {status.state !== "idle" && status.message && (
        <p
          className={`text-sm ${
            status.state === "success" ? "text-emerald-300" : "text-red-400"
          }`}
        >
          {status.message}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enregistrement..." : "Créer l'alerte"}
      </button>
    </form>
  );
}
