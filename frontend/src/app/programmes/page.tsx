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
  return (
    <div className="bg-background py-16 text-[color:var(--text)]">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Programmes FitIdion
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">Des routines calibrées pour vos objectifs</h1>
          <p className="mx-auto max-w-2xl text-base text-[color:var(--text)]/70 sm:text-lg">
            Choisissez une routine prête à l’emploi en fonction de votre niveau, du temps disponible et de vos objectifs : prise de masse, remise en forme ou performance.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {programmesData.map((programme) => (
            <ProgramCard key={programme.id} programme={programme} />
          ))}
        </div>
      </section>
    </div>
  );
}
