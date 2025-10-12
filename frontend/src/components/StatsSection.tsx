"use client";

import type { ElementType } from "react";
import { BarChart3, Layers, Store, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";

type Stat = {
  icon: ElementType;
  value: string;
  label: string;
  description: string;
};

const stats: Stat[] = [
  {
    icon: BarChart3,
    value: "170M+",
    label: "Offres analysées",
    description: "Flux et catalogues synchronisés en continu pour garder une vision complète du marché.",
  },
  {
    icon: Layers,
    value: "900+",
    label: "Produits suivis",
    description: "Chaque référence dispose d'une fiche détaillée, mise à jour avec ses dernières variations de prix.",
  },
  {
    icon: Store,
    value: "120+",
    label: "Marchands partenaires",
    description: "Un réseau de revendeurs vérifiés, couvrant aussi bien les grandes enseignes que les boutiques spécialisées.",
  },
  {
    icon: Zap,
    value: "24/7",
    label: "Monitoring des prix",
    description: "Alertes déclenchées automatiquement dès qu'un seuil de prix est franchi sur un marchand suivi.",
  },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(255,102,0,0.12),transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_10%,rgba(253,220,142,0.12),transparent_60%)]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Données de confiance
          </p>
          <h2 className="mt-3 text-3xl font-bold text-dark sm:text-4xl dark:text-white">
            Nos indicateurs clés
          </h2>
          <p className="mt-4 text-base text-muted dark:text-muted/70">
            Une plateforme alimentée en continu pour repérer les meilleures affaires et vous guider dans vos achats sportifs.
          </p>
        </div>

        <dl className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, description }) => (
            <Card
              key={label}
              className="group relative overflow-hidden border-white/15 bg-white/75 p-6 shadow-glass transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-fitidion dark:border-white/10 dark:bg-slate-900/60"
            >
              <dt className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-3xl font-bold text-dark dark:text-white">{value}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted/80">{label}</span>
                </span>
              </dt>
              <dd className="mt-4 text-sm leading-relaxed text-muted dark:text-muted/70">
                {description}
              </dd>
              <span className="pointer-events-none absolute inset-x-6 bottom-2 h-1 rounded-full bg-gradient-to-r from-fitidion-orange/30 via-fitidion-gold/50 to-fitidion-orange/30 opacity-0 transition group-hover:opacity-100" />
            </Card>
          ))}
        </dl>
      </div>
    </section>
  );
}
