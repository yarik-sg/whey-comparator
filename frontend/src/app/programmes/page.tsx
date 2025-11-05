import Image from "next/image";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import programmes from "@/data/programmes.json";
import { createMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createMetadata({
  title: "Programmes d'entraînement",
  description: "Accédez aux programmes d'entraînement FitIdion selon votre niveau, votre durée disponible et vos objectifs.",
  path: "/programmes",
});

type Programme = {
  id: string;
  titre: string;
  duree: string;
  niveau: string;
  description: string;
  image_url: string;
  liste_exercices: Array<{
    nom: string;
    series: string;
  }>;
};

const programmesData = programmes as Programme[];

export default function ProgrammesPage() {
  return (
    <div className="bg-background py-16 text-[color:var(--text)]">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
            <Card key={programme.id} className="overflow-hidden border-none bg-[color:var(--accent)]/80 shadow-soft">
              <div className="relative h-52 w-full">
                <Image
                  src={programme.image_url}
                  alt={`Programme ${programme.titre}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-[color:var(--text)]">{programme.titre}</h2>
                  <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                    {programme.niveau}
                  </Badge>
                </div>

                <p className="text-sm text-[color:var(--text)]/80">{programme.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-[color:var(--text)]/60">
                  <span className="rounded-full bg-white/10 px-3 py-1">Durée : {programme.duree}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {programme.liste_exercices.length} exercices clés
                  </span>
                </div>

                <ul className="grid gap-2 text-sm text-[color:var(--text)]">
                  {programme.liste_exercices.map((exercice, index) => (
                    <li key={`${programme.id}-${index}`} className="flex items-center justify-between rounded-full bg-white/5 px-4 py-2">
                      <span>{exercice.nom}</span>
                      <span className="text-[color:var(--text)]/70">{exercice.series}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
