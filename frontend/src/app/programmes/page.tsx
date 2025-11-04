import Image from "next/image";

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
  Débutant: "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  Intermédiaire: "bg-sky-100/80 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  Avancé: "bg-rose-100/80 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
};

const imageFallbackStyles: Record<string, string> = {
  "prise-masse-8s": "bg-gradient-to-br from-orange-300 via-orange-200 to-amber-100",
  "seche-musculaire-6s": "bg-gradient-to-br from-rose-400 via-rose-300 to-pink-200",
  "full-body-debutant-4s": "bg-gradient-to-br from-emerald-300 via-emerald-200 to-lime-200",
};

export default function ProgrammesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50/80 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,140,66,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,148,77,0.18),_transparent_60%)]" />

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-orange-100/80 px-4 py-1 text-sm font-medium uppercase tracking-wider text-orange-700 shadow-sm dark:bg-orange-500/20 dark:text-orange-200">
            Programmes FitIdion
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-gray-100 sm:text-5xl">
            Des plans adaptés à chaque objectif
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">
            Explorez des programmes conçus par nos coachs pour progresser à votre rythme, que vous cherchiez à prendre de la masse, sécher ou renforcer tout votre corps.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {programmesData.map((programme) => {
            const niveauClass = niveauStyles[programme.niveau] ??
              "bg-slate-100/80 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200";

            return (
              <article
                key={programme.id}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-orange-100/70 bg-white/80 shadow-[0_15px_40px_-24px_rgba(255,140,66,0.55)] backdrop-blur transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_48px_-20px_rgba(255,140,66,0.65)] dark:border-white/5 dark:bg-slate-900/70 dark:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.9)]"
              >
                <div
                  className={`relative aspect-[16/10] overflow-hidden ${
                    imageFallbackStyles[programme.id] ??
                    "bg-gradient-to-br from-orange-200 via-orange-100 to-amber-50"
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
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${niveauClass}`}>
                        {programme.niveau}
                      </span>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-orange-600 shadow-sm ring-1 ring-orange-200/60 dark:bg-slate-800/60 dark:text-orange-200 dark:ring-white/10">
                        {programme.duree}
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">
                      {programme.titre}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                      {programme.description}
                    </p>
                  </div>

                  <div className="flex-1 rounded-2xl bg-orange-50/60 p-5 shadow-inner ring-1 ring-orange-100/60 transition group-hover:bg-orange-100/60 dark:bg-slate-800/60 dark:ring-white/5 dark:group-hover:bg-slate-800/80">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-200">
                      Exercices clés
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-gray-200">
                      {programme.liste_exercices.map((exercice) => (
                        <li key={exercice.nom} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-orange-400 shadow-[0_0_0_3px_rgba(255,148,77,0.25)] dark:bg-orange-300" />
                          <div>
                            <p className="font-medium">{exercice.nom}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{exercice.series}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
