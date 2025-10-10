"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/apiClient";
import type { ProductSummary } from "@/types/api";

interface CreatePriceAlertProps {
  product: ProductSummary;
}

interface CreateAlertPayload {
  user_email: string;
  product_id: number;
  target_price: number;
}

export function CreatePriceAlert({ product }: CreatePriceAlertProps) {
  const bestPrice = product.bestPrice?.amount ?? null;
  const recommendedThreshold = useMemo(() => {
    if (typeof bestPrice !== "number") {
      return "";
    }
    const recommended = Math.max(bestPrice * 0.95, 0);
    return recommended.toFixed(2);
  }, [bestPrice]);

  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(recommendedThreshold);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: CreateAlertPayload) => {
      return apiClient.post("/price-alerts/", { body: payload });
    },
    onSuccess: () => {
      toast.success("Alerte de prix créée avec succès !");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Impossible de créer l'alerte.";
      toast.error(message);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Veuillez renseigner votre e-mail.");
      return;
    }
    const parsedTarget = Number.parseFloat(targetPrice.replace(",", "."));
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      toast.error("Indiquez un seuil de prix valide.");
      return;
    }

    const resolvedProductId =
      typeof product.id === "number"
        ? product.id
        : Number.parseInt(String(product.id), 10);
    if (!Number.isFinite(resolvedProductId)) {
      toast.error("Impossible de créer une alerte pour ce produit.");
      return;
    }

    await mutateAsync({
      user_email: email.trim(),
      product_id: resolvedProductId,
      target_price: Number(parsedTarget.toFixed(2)),
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-100">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-white">🔔 Créer une alerte de prix</h2>
        <p className="text-xs text-gray-300">
          Recevez un e-mail dès que nous détectons une baisse sous votre seuil personnalisé.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
            Adresse e-mail
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
            Seuil souhaité (€)
            <Input
              type="number"
              step="0.01"
              min="0"
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
              placeholder={recommendedThreshold || "29.90"}
            />
          </label>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <p>
            Prix actuel :
            <span className="ml-1 font-semibold text-white">
              {product.bestPrice?.formatted ?? (bestPrice ? `${bestPrice.toFixed(2)} €` : "—")}
            </span>
          </p>
          {recommendedThreshold && (
            <p className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
              Suggestion : {recommendedThreshold} €
            </p>
          )}
        </div>
        <Button type="submit" className="w-full rounded-full bg-orange-500 text-white hover:bg-orange-600" disabled={isPending}>
          {isPending ? "Création en cours…" : "Créer l'alerte"}
        </Button>
      </form>
    </section>
  );
}
