import type { Metadata } from "next";

import programmes from "@/data/programmes.json";
import type { Programme } from "@/components/programs/ProgramCard";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { createMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createMetadata({
  title: "Programmes d'entraînement",
  description:
    "Sélectionnez un programme FitIdion adapté à votre niveau, à votre temps disponible et à vos objectifs d'entraînement.",
  path: "/programmes",
});

const programmesData = programmes as Programme[];

export default function ProgrammesPage() {
  const stats = [
    { label: "Niveaux", value: "Débutant à avancé" },
    { label: "Durée", value: "1 semaine à 1 mois" },
    { label: "Machines", value: "Guidées, cardio & PPL" },
  ];

  const pillars = [
    {
      title: "Machines maîtrisées",
      content:
        "Chaque programme détaille les machines utilisées, les réglages recommandés et l’ordre des exercices pour optimiser l’apprentissage.",
    },
    {
      title: "Conseils terrain",
      content:
        "Respiration, tempo, suivi des charges et gestion du stress métabolique : les astuces intégrées dans chaque fiche accélèrent votre progression.",
    },
    {
      title: "Nutrition contextualisée",
      content:
        "Hydratation, macros et timing alimentaire sont rappelés pour coller à l’objectif (prise de masse, sèche ou remise en route).",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-background via-background/90 to-background text-[color:var(--text)]">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 lg:px-8">
        <div className="space-y-6 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Programmes FitIdion
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            3 parcours machines pour rester guidé de la salle à l’assiette
          </h1>
          <p className="mx-auto max-w-3xl text-base text-[color:var(--text)]/70 sm:text-lg">
            Retrouvez un programme Débutant sur 1 semaine, un split Push/Pull/Legs dédié à la prise de masse sur 1 mois et un circuit Sèche mêlant cardio et machines pour effacer le gras sans sacrifier le muscle.
          </p>
        </div>

        <div className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-[color:var(--accent)]/30 p-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/5 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text)]/60">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold">{pillar.title}</h2>
              <p className="mt-3 text-sm text-[color:var(--text)]/70">{pillar.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Choisissez votre rythme</h2>
          <p className="mx-auto max-w-3xl text-base text-[color:var(--text)]/70">
            Chaque fiche programme rassemble les machines à utiliser, les tempos recommandés, les astuces de coach et les rappels nutritionnels adaptés à l’objectif.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {programmesData.map((programme) => (
            <ProgramCard key={programme.id} programme={programme} />
          ))}
        </div>
      </section>
    </div>
  );
}
