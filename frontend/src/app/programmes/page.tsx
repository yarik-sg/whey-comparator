import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import programmes from "@/data/programmes.json";

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

const niveauStyles: Record<string, string> = {
  Débutant: "bg-[color:var(--secondary)] text-[color:var(--text)]",
  Intermédiaire: "bg-[color:var(--accent)] text-[color:var(--text)]",
  Avancé: "bg-primary/15 text-primary",
};

const imageFallbackStyles: Record<string, string> = {
  "prise-masse-8s": "bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.22),_transparent_70%)]",
  "seche-musculaire-6s": "bg-[radial-gradient(circle_at_top,_rgba(255,148,77,0.25),_transparent_68%)]",
  "full-body-debutant-4s": "bg-[radial-gradient(circle_at_top,_rgba(255,232,209,0.8),_transparent_72%)]",
};

export default function ProgrammesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,102,0,0.12),_transparent_60%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,232,209,0.45),_transparent_65%)]" aria-hidden />

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            size="md"
            className="mx-auto uppercase tracking-[0.4em] text-[0.68rem] text-[color:var(--text)]/80"
          >
            Programmes FitIdion
          </Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[color:var(--text)] sm:text-5xl">
            Des plans adaptés à chaque objectif
          </h1>
          <p className="mt-4 text-lg text-muted">
            Explorez des programmes conçus par nos coachs pour progresser à votre rythme, que vous cherchiez à prendre de la masse, sécher ou renforcer tout votre corps.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {programmesData.map((programme) => {
            const niveauClass = niveauStyles[programme.niveau] ?? "bg-[color:var(--accent)] text-[color:var(--text)]";

            return (
              <Card key={programme.id} className="group flex h-full flex-col overflow-hidden p-0">
                <div
                  className={`relative aspect-[16/10] overflow-hidden ${
                    imageFallbackStyles[programme.id] ??
                    "bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.18),_transparent_70%)]"
                  }`}
                >
                  <Image
                    src={programme.image_url}
                    alt={`Illustration du programme ${programme.titre}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    priority={false}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="accent" className={niveauClass}>
                        {programme.niveau}
                      </Badge>
                      <Badge variant="outline">{programme.duree}</Badge>
                    </div>
                    <h2 className="text-2xl font-semibold text-[color:var(--text)]">
                      {programme.titre}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">
                      {programme.description}
                    </p>
                  </div>

                  <div className="flex-1 rounded-2xl bg-[color:var(--accent)]/70 p-5 shadow-inner ring-1 ring-[color:var(--border-soft)] transition group-hover:bg-[color:var(--accent)]/90">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/90">
                      Exercices clés
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-[color:var(--text)]/85">
                      {programme.liste_exercices.map((exercice) => (
                        <li key={exercice.nom} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-primary/80 shadow-[0_0_0_3px_rgba(255,102,0,0.18)]" />
                          <div>
                            <p className="font-medium text-[color:var(--text)]">{exercice.nom}</p>
                            <p className="text-xs text-muted">{exercice.series}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
