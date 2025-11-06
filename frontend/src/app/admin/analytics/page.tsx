"use client";

import { useMemo } from "react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "–";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnalyticsDashboardPage() {
  const { state } = useAnalytics();

  const stats = useMemo(() => {
    const uniquePages = new Set(
      state.pageVisits.map((visit) => `${visit.path}${visit.search ? `?${visit.search}` : ""}`),
    );

    const keyActions = new Map<string, number>();
    state.buttonClicks.forEach((event) => {
      const action = event.action ?? "click";
      keyActions.set(action, (keyActions.get(action) ?? 0) + 1);
    });

    return {
      pageViews: state.pageVisits.length,
      uniquePages: uniquePages.size,
      productViews: state.productViews.length,
      buttonClicks: state.buttonClicks.length,
      actions: Array.from(keyActions.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [state.buttonClicks, state.pageVisits, state.productViews]);

  const recentPageViews = state.pageVisits.slice(0, 10);
  const recentProductViews = state.productViews.slice(0, 10);
  const recentButtonClicks = state.buttonClicks.slice(0, 10);

  return (
    <div className="container mx-auto space-y-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-dark">Tableau de bord analytics</h1>
        <p className="max-w-2xl text-sm text-muted">
          Données de navigation collectées sans informations personnelles : pages consultées, fiches produit ouvertes et
          clics sur les boutons clés. Utilisez ces insights pour améliorer l&apos;expérience utilisateur tout en respectant la vie
          privée.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Pages vues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-dark">{stats.pageViews}</p>
            <p className="text-xs text-muted">{stats.uniquePages} pages uniques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Produits consultés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-dark">{stats.productViews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Interactions boutons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-dark">{stats.buttonClicks}</p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {stats.actions.slice(0, 3).map(([action, count]) => (
                <li key={action}>
                  {action} · {count}
                </li>
              ))}
              {stats.actions.length === 0 && <li>Aucune interaction suivie.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Données sensibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-600">Aucune donnée personnelle collectée.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark">Dernières pages vues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted">
              {recentPageViews.map((event) => (
                <li key={event.id} className="space-y-1">
                  <p className="font-semibold text-dark">{event.path}</p>
                  <p className="text-xs text-muted/80">{formatDate(event.timestamp)}</p>
                  {event.search && <p className="text-xs text-muted/80">?{event.search}</p>}
                </li>
              ))}
              {recentPageViews.length === 0 && <li>Aucune page vue pour le moment.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark">Produits consultés</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted">
              {recentProductViews.map((event) => (
                <li key={event.id} className="space-y-1">
                  <p className="font-semibold text-dark">{event.name ?? `Produit ${event.productId}`}</p>
                  {event.brand && <p className="text-xs text-muted/80">{event.brand}</p>}
                  <p className="text-xs text-muted/80">{formatDate(event.timestamp)}</p>
                </li>
              ))}
              {recentProductViews.length === 0 && <li>Aucune fiche produit consultée.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark">Clics récents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted">
              {recentButtonClicks.map((event) => (
                <li key={event.id} className="space-y-1">
                  <p className="font-semibold text-dark">Action : {event.action}</p>
                  {event.label && <p className="text-xs text-muted/80">{event.label}</p>}
                  <p className="text-xs text-muted/80">{formatDate(event.timestamp)}</p>
                </li>
              ))}
              {recentButtonClicks.length === 0 && <li>Aucune interaction enregistrée.</li>}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
