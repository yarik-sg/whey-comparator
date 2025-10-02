"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Layers, ShieldCheck } from "lucide-react";

export type StatItem = {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
};

export type StatsSectionProps = {
  title?: string;
  subtitle?: string;
  stats?: StatItem[];
  className?: string;
};

const defaultStats: StatItem[] = [
  {
    value: "170M+",
    label: "Offres indexées",
    description: "Suivi quotidien des plateformes européennes majeures.",
    icon: BarChart3,
  },
  {
    value: "900+",
    label: "Produits actifs",
    description: "Chaque fiche est enrichie de profils nutritionnels et d'avis.",
    icon: Layers,
  },
  {
    value: "120+",
    label: "Marchands surveillés",
    description: "Réseau d'e-commerçants vérifiés et partenaires logistiques.",
    icon: ShieldCheck,
  },
  {
    value: "24/7",
    label: "Monitoring prix",
    description: "Alertes générées en temps réel grâce à SerpAI.",
    icon: Activity,
  },
];

export function StatsSection({
  title = "Nos indicateurs clés",
  subtitle = "Une infrastructure prête pour l'échelle",
  stats = defaultStats,
  className,
}: StatsSectionProps) {
  return (
    <section className={["relative overflow-hidden bg-[#0b1320] py-20", className].filter(Boolean).join(" ")}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,153,0,0.12),transparent_60%)]" />
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400/80">
            {subtitle}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base text-gray-300">
            Des chiffres mis à jour en continu pour garantir une comparaison fiable et exhaustive des compléments sportifs.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, description }) => (
            <article
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-white/10"
            >
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 transition group-hover:bg-orange-500/20">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-300">{label}</p>
                </div>
              </div>
              {description ? (
                <p className="mt-4 text-sm text-gray-400 group-hover:text-gray-300">{description}</p>
              ) : null}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
