"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface PriceAlertFormProps {
  className?: string;
}

export function PriceAlertForm({ className }: PriceAlertFormProps = {}) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>({ state: "idle" });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    [emailRegex],
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
        toast.success("Alerte enregistrée avec succès !");
        setFormState(initialState);
        setErrors({});
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
        setStatus({ state: "error", message });
        toast.error(message);
      }
    },
    [formState, validate],
  );

  const containerClassName = cn(
    "space-y-6 rounded-3xl border border-accent/70 bg-background/95 p-8 text-dark shadow-neo backdrop-blur dark:border-[var(--text)]/25 dark:bg-dark/80 dark:text-[var(--text)]",
    className,
  );

  if (!hasMounted) {
    return (
      <div className={containerClassName} aria-hidden="true">
        <div className="space-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-40 rounded-full bg-accent/60" />
              <div className="h-10 w-full rounded-xl bg-accent/70" />
            </div>
          ))}
        </div>

        <div className="mt-6 h-11 w-full rounded-full bg-accent/60" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={containerClassName}
      autoComplete="off"
      noValidate
      data-lpignore="true"
      data-lastpass-icon="false"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="alert-email" className="block text-sm font-semibold text-dark dark:text-[var(--text)]">
            Adresse e-mail
          </label>
          <Input
            id="alert-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            data-lpignore="true"
            data-lastpass-icon="false"
            value={formState.email}
            onChange={handleChange("email")}
            placeholder="vous@exemple.com"
            aria-invalid={errors.email ? "true" : undefined}
          />
          {errors.email && <p className="text-sm text-primary">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="alert-product" className="block text-sm font-semibold text-dark dark:text-[var(--text)]">
            Produit ciblé
          </label>
          <Input
            id="alert-product"
            type="text"
            data-lpignore="true"
            data-lastpass-icon="false"
            value={formState.product}
            onChange={handleChange("product")}
            placeholder="Ex. Whey Native Chocolat 1kg"
            aria-invalid={errors.product ? "true" : undefined}
          />
          {errors.product && <p className="text-sm text-primary">{errors.product}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="alert-threshold" className="block text-sm font-semibold text-dark dark:text-[var(--text)]">
            Seuil de prix (€)
          </label>
          <Input
            id="alert-threshold"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            data-lpignore="true"
            data-lastpass-icon="false"
            value={formState.priceThreshold}
            onChange={handleChange("priceThreshold")}
            placeholder="Ex. 24.90"
            aria-invalid={errors.priceThreshold ? "true" : undefined}
          />
          {errors.priceThreshold && (
            <p className="text-sm text-primary">{errors.priceThreshold}</p>
          )}
        </div>
      </div>

      {status.state !== "idle" && status.message && (
        <p
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            status.state === "success"
              ? "border-primary/40 bg-accent text-primary"
              : "border-dark/40 bg-secondary text-dark",
          )}
        >
          {status.message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enregistrement..." : "Créer l'alerte"}
      </Button>
      <p className="text-xs text-muted">
        Vous pouvez vous désinscrire à tout moment via le lien présent dans chaque e-mail.
      </p>
    </form>
  );
}
