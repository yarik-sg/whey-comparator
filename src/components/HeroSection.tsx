export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 text-white shadow-xl">
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" aria-hidden />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary-400/10 blur-3xl" aria-hidden />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M12 3l1.65 4.95L18 9.6l-4.35 1.65L12 16.2l-1.65-4.95L6 9.6l4.35-1.65L12 3z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            Comparateur nouvelle génération
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Comparez les meilleures whey en un clin d'oeil
            </h1>
            <p className="text-lg text-slate-200">
              Visualisez instantanément le rapport qualité/prix de vos compléments favoris, avec des
              indicateurs clés et des conseils personnalisés inspirés de l'expérience idealo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#comparateur"
              className="inline-flex items-center justify-center rounded-full bg-primary-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-primary-900/20 transition hover:bg-primary-300"
            >
              Lancer le comparatif
            </a>
            <a
              href="#alertes-prix"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Activer une alerte personnalisée
            </a>
          </div>
        </div>
        <div className="w-full max-w-md rounded-3xl bg-white/5 p-6 backdrop-blur">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-200">Pourquoi comparer ?</p>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-300" aria-hidden />
                Identifiez les meilleures offres selon votre budget et votre apport protéique.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-300" aria-hidden />
                Surveillez les promotions flash pour acheter au moment idéal.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-300" aria-hidden />
                Configurez des alertes prix pour être prévenu dès que votre cible est atteinte.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
