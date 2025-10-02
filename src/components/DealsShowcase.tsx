const deals = [
  {
    title: 'Pack performance 2kg',
    discount: '-18%',
    description: 'Idéal pour optimiser vos entraînements avec un prix au kilo imbattable cette semaine.',
    badge: 'Offre flash',
  },
  {
    title: 'Whey bio sans lactose',
    discount: '-12%',
    description: 'La whey la plus clean du moment, certifiée bio et livrée en 24h avec remise exclusive.',
    badge: 'Sélection green',
  },
  {
    title: 'Isolate premium 90%',
    discount: '-25%',
    description: 'Isolate haute pureté pour des résultats rapides, comparé automatiquement aux meilleurs prix.',
    badge: 'Deal idealo',
  },
];

export function DealsShowcase() {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Offres à ne pas manquer</p>
          <h2 className="text-3xl font-bold text-slate-900">Promotions inspirées des meilleures sélections idealo</h2>
          <p className="text-base text-slate-600">
            Comparez les tarifs et les avantages de chaque offre avant de passer commande. Notre algorithme
            met en avant les deals avec le meilleur prix par 100 g et la disponibilité la plus fiable.
          </p>
        </div>
        <a
          href="#comparateur"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Voir tous les produits comparés
        </a>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {deals.map((deal) => (
          <article
            key={deal.title}
            className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-6 transition hover:border-primary-200 hover:bg-white"
          >
            <span className="inline-flex w-fit rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
              {deal.badge}
            </span>
            <h3 className="text-xl font-semibold text-slate-900">{deal.title}</h3>
            <p className="text-sm text-slate-600">{deal.description}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-2xl font-bold text-primary-600">{deal.discount}</span>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition group-hover:text-primary-600"
              >
                Découvrir l'offre
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M5 10h10m0 0l-4-4m4 4l-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
