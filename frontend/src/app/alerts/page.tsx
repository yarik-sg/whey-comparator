"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/apiClient";
import { usePriceAlerts } from "@/lib/queries";
import type { PriceAlertRecord } from "@/types/api";

function formatCurrency(value: number | string) {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }
  return numeric.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function AlertsPage() {
  const [emailInput, setEmailInput] = useState("");
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: alerts = [],
    isLoading,
    isFetching,
    error,
  } = usePriceAlerts(activeEmail);

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, nextActive }: { id: number; nextActive: boolean }) => {
      await apiClient.patch(`/price-alerts/${id}`, {
        body: { active: nextActive },
      });
    },
    onSuccess: () => {
      toast.success("Alerte mise à jour");
      queryClient.invalidateQueries({ queryKey: ["price-alerts", activeEmail] });
    },
    onError: (mutationError: unknown) => {
      const message = mutationError instanceof Error ? mutationError.message : "Impossible de mettre à jour l'alerte.";
      toast.error(message);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/price-alerts/${id}`);
    },
    onSuccess: () => {
      toast.success("Alerte supprimée");
      queryClient.invalidateQueries({ queryKey: ["price-alerts", activeEmail] });
    },
    onError: (mutationError: unknown) => {
      const message = mutationError instanceof Error ? mutationError.message : "Suppression impossible.";
      toast.error(message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) {
      toast.error("Renseignez une adresse e-mail pour retrouver vos alertes.");
      return;
    }
    setActiveEmail(trimmed);
  };

  const handleReset = () => {
    setActiveEmail(null);
    setEmailInput("");
  };

  const activeCount = useMemo(() => alerts.filter((alert) => alert.active).length, [alerts]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Mes alertes prix</h1>
            <p className="text-sm text-muted/70">Suivez vos seuils personnalisés et gérez vos notifications.</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Explorer le catalogue
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Breadcrumb
          items={[
            { label: "Accueil", href: "/" },
            { label: "Mes alertes", href: "/alerts" },
          ]}
          className="mb-8 text-muted/70"
        />

        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-muted/60">
          <header className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Retrouver mes alertes</h2>
            <p className="text-xs text-muted/70">
              Saisissez l&apos;adresse utilisée lors de la création d&apos;une alerte pour consulter son statut ou la désactiver.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="email"
              placeholder="vous@exemple.com"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full bg-primary text-white hover:bg-primary/90">
                Rechercher
              </Button>
              <Button type="button" variant="ghost" className="rounded-full" onClick={handleReset}>
                Réinitialiser
              </Button>
            </div>
          </form>

          {activeEmail && (
            <p className="text-xs text-muted/70">
              {isFetching ? "Chargement des alertes…" : `${alerts.length} alerte(s) trouvée(s) pour ${activeEmail}`}
              {activeCount > 0 ? ` · ${activeCount} active(s)` : ""}
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-100">
              Impossible de charger vos alertes. Réessayez plus tard.
            </p>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/5 text-left text-sm text-muted/60">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-muted/70">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Produit
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Seuil (€)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Statut
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted/70">
                      Chargement de vos alertes…
                    </td>
                  </tr>
                )}

                {!isLoading && alerts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted/70">
                      {activeEmail
                        ? "Aucune alerte active pour cette adresse."
                        : "Renseignez votre e-mail pour afficher vos alertes."}
                    </td>
                  </tr>
                )}

                {alerts.map((alert) => {
                  const productName = alert.product?.name ?? `Produit #${alert.product_id}`;
                  return (
                    <tr key={alert.id} className="transition hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{productName}</span>
                          {alert.product?.brand && (
                            <span className="text-xs text-muted/80">{alert.product.brand}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-white">
                        {formatCurrency(alert.target_price)}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        {alert.active ? (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-accent0/10 px-3 py-1 text-muted/70">
                            En pause
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full border-white/20 text-xs"
                            disabled={toggleAlertMutation.isPending}
                            onClick={() =>
                              toggleAlertMutation.mutate({
                                id: alert.id,
                                nextActive: !alert.active,
                              })
                            }
                          >
                            {alert.active ? "Mettre en pause" : "Réactiver"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="rounded-full text-xs"
                            disabled={deleteAlertMutation.isPending}
                            onClick={() => deleteAlertMutation.mutate(alert.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

