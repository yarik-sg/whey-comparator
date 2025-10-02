"use client";

import type { ElementType } from "react";
import { BarChart3, Layers, Store, Zap } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#0b1320] py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,153,0,0.16),transparent_65%)]" />
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400/80">
            Données de confiance
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Nos indicateurs clés</h2>
          <p className="mt-4 text-base text-gray-300">
            Un aperçu de la couverture et de la réactivité de notre plateforme de comparaison dédiée aux compléments sportifs.
          </p>
        </div>

        <dl className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, description }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-white/10"
            >
              <dt className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 transition group-hover:bg-orange-500/20">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-3xl font-bold text-white">{value}</span>
                  <span className="text-sm font-semibold uppercase tracking-wide text-gray-300">{label}</span>
                </span>
              </dt>
              <dd className="mt-4 text-sm text-gray-400 group-hover:text-gray-300">{description}</dd>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
