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
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-500">
            Données de confiance
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Nos indicateurs clés
          </h2>
          <p className="mt-4 text-base text-slate-500">
            Une plateforme alimentée en continu pour repérer les meilleures affaires et vous guider dans vos achats sportifs.
          </p>
        </div>

        <dl className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, description }) => (
            <Card
              key={label}
              className="group relative overflow-hidden border-orange-100/60 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <dt className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500 transition group-hover:bg-orange-200">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-3xl font-bold text-slate-900">{value}</span>
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                </span>
              </dt>
              <dd className="mt-4 text-sm leading-relaxed text-slate-500">
                {description}
              </dd>
              <span className="pointer-events-none absolute inset-x-6 bottom-2 h-1 rounded-full bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 opacity-0 transition group-hover:opacity-100" />
            </Card>
          ))}
        </dl>
      </div>
    </section>
  );
}
