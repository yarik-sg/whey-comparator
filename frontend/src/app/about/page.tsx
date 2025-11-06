import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";
import { Card } from "@/components/ui/card";

const visionHighlights = [
  {
    title: "Transparence totale",
    description:
      "Agrégation multi-sources, indicateurs nutritionnels et explications claires pour permettre des choix éclairés.",
  },
  {
    title: "Personnalisation intelligente",
    description:
      "Alertes dynamiques, recommandations de programmes et recherche contextuelle pour chaque objectif sportif.",
  },
  {
    title: "Communauté engagée",
    description:
      "Partenariats certifiés, retours utilisateurs et contenus experts pour progresser ensemble.",
  },
];

const milestones = [
  {
    date: "2022",
    title: "Naissance du comparateur",
    description: "Premiers scripts de collecte et lancement de Whey Comparator pour trouver la meilleure protéine.",
  },
  {
    date: "2023",
    title: "Virage multi-verticales",
    description: "Ajout des salles, des programmes d'entraînement et des alertes automatisées.",
  },
  {
    date: "2024",
    title: "FitIdion",
    description: "Nouvelle identité, design system unifié et intégration temps réel des partenaires.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Vision FitIdion",
  description:
    "Découvrez la mission de FitIdion et la vision produit derrière la plateforme du fitness intelligent.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden bg-background py-20 text-[color:var(--text)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.16),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.24),_transparent_60%)]" aria-hidden />

      <section className="mx-auto max-w-5xl space-y-12 px-6">
        <header className="space-y-6 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            À propos
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">La vision FitIdion</h1>
          <p className="mx-auto max-w-2xl text-base text-[color:var(--text)]/70 sm:text-lg">
            Notre mission est de rendre chaque décision fitness simple, transparente et motivante grâce à la donnée et au design.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-3">
          {visionHighlights.map((highlight) => (
            <Card key={highlight.title} className="h-full border-none bg-[color:var(--accent)]/80 p-6 text-left shadow-soft">
              <h2 className="text-lg font-semibold text-[color:var(--text)]">{highlight.title}</h2>
              <p className="mt-3 text-sm text-[color:var(--text)]/70">{highlight.description}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-accent/60 bg-[color:var(--accent)]/40 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-[color:var(--text)]">Notre feuille de route</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {milestones.map((milestone) => (
              <div key={milestone.date} className="space-y-3 rounded-2xl bg-background/80 p-6 text-left shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">{milestone.date}</span>
                <h3 className="text-lg font-semibold text-[color:var(--text)]">{milestone.title}</h3>
                <p className="text-sm text-[color:var(--text)]/70">{milestone.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-3xl border border-accent/70 bg-background/90 p-8 shadow-soft sm:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[color:var(--text)]">Nos engagements</h2>
            <ul className="space-y-3 text-sm text-[color:var(--text)]/75">
              <li>✔️ Transparence sur la collecte et le scoring des prix.</li>
              <li>✔️ Accessibilité : interface bilingue en préparation et contrastes élevés.</li>
              <li>✔️ Respect des partenaires et des marchands via un programme d'affiliation clair.</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[color:var(--text)]">Ce qui arrive ensuite</h2>
            <p className="text-sm text-[color:var(--text)]/70">
              Nous travaillons sur des recommandations personnalisées, un suivi nutritionnel connecté et un hub communautaire pour partager des retours d'expérience.
            </p>
            <p className="text-sm text-[color:var(--text)]/70">
              Inscrivez-vous aux alertes prix pour être informé des nouveautés et des lancements de fonctionnalités.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
