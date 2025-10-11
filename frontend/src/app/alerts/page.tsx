"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Breadcrumb } from "@/components/Breadcrumb";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-16 pb-20">
      <section className="bg-orange-50/80 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Mes alertes", href: "/alerts" },
            ]}
            className="text-sm text-slate-500"
          />

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-500">
                Alertes prix intelligentes
              </p>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Pilotez vos alertes FitIdion
              </h1>
              <p className="max-w-2xl text-base text-slate-600">
                Suivez vos seuils personnalisés, mettez en pause des alertes ciblées et recevez les variations de prix en
                avant-première. FitIdion surveille vos compléments favoris 24/7.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/products">Explorer le catalogue</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
                  <Link href="/comparateur">Lancer le comparateur</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-orange-200 bg-white/80 p-6 text-sm text-slate-600 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Vue d&apos;ensemble</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-semibold text-slate-900">{alerts.length}</p>
                  <p className="text-xs text-slate-500">Alertes chargées</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-slate-900">{activeCount}</p>
                  <p className="text-xs text-slate-500">Alertes actives</p>
                </div>
              </div>
              <p className="rounded-2xl bg-orange-50/80 px-4 py-3 text-xs text-slate-500">
                {activeEmail
                  ? `Suivi en cours pour ${activeEmail}.`
                  : "Renseignez votre e-mail ci-dessous pour retrouver vos alertes."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-10">
        <Card className="p-8 sm:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900">Retrouver mes alertes</h2>
              <p className="text-sm text-slate-600">
                Saisissez l&apos;adresse utilisée lors de la création d&apos;une alerte pour consulter son statut, mettre en pause ou
                supprimer une notification personnalisée.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="email"
                placeholder="vous@exemple.com"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                className="flex-1 rounded-full"
              />
              <div className="flex gap-2">
                <Button type="submit" className="rounded-full px-6" disabled={isLoading}>
                  Rechercher
                </Button>
                <Button type="button" variant="ghost" className="rounded-full px-6" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </div>
            </form>

            {activeEmail && (
              <p className="text-xs text-slate-500">
                {isFetching ? "Chargement des alertes…" : `${alerts.length} alerte(s) trouvée(s) pour ${activeEmail}`}
                {activeCount > 0 ? ` · ${activeCount} active(s)` : ""}
              </p>
            )}

            {error && (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                Impossible de charger vos alertes. Réessayez plus tard.
              </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                <tbody className="divide-y divide-slate-100">
                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                        Chargement de vos alertes…
                      </td>
                    </tr>
                  )}

                  {!isLoading && alerts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                        {activeEmail
                          ? "Aucune alerte active pour cette adresse."
                          : "Renseignez votre e-mail pour afficher vos alertes."}
                      </td>
                    </tr>
                  )}

                  {alerts.map((alert) => {
                    const productName = alert.product?.name ?? `Produit #${alert.product_id}`;
                    return (
                      <tr key={alert.id} className="transition hover:bg-orange-50/40">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{productName}</span>
                            {alert.product?.brand && (
                              <span className="text-xs text-slate-500">{alert.product.brand}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                          {formatCurrency(alert.target_price)}
                        </td>
                        <td className="px-4 py-4 text-xs">
                          {alert.active ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-600">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
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
                              className="rounded-full border-orange-200 bg-white/80 text-xs text-orange-600 hover:border-orange-300 hover:bg-orange-50"
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
                              variant="ghost"
                              className="rounded-full text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500">
              Astuce : créez vos alertes directement depuis une fiche produit pour pré-remplir le seuil idéal et recevoir un
              suivi prioritaire.
            </div>
          </div>
        </Card>

        <Card className="p-8 sm:p-10">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Comment fonctionnent les alertes FitIdion ?</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-orange-500">1.</span> Nos robots comparent les prix toutes les 15 minutes
                sur les marchands partenaires et remontent la meilleure offre.
              </li>
              <li>
                <span className="font-semibold text-orange-500">2.</span> Lorsque le seuil est atteint, vous recevez un e-mail
                personnalisé avec la fiche détaillée du vendeur et les frais de port estimés.
              </li>
              <li>
                <span className="font-semibold text-orange-500">3.</span> Vous pouvez mettre en pause ou supprimer vos
                alertes en un clic depuis cette interface de suivi.
              </li>
            </ul>
          </div>
        </Card>
      </section>

      <WhyChooseUsSection />
      <PriceAlertsSection />
    </div>
  );
}

