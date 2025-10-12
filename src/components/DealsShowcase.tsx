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
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-aurora-soft">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-300">Offres à ne pas manquer</p>
          <h2 className="text-3xl font-bold text-white">Promotions inspirées des meilleures sélections idealo</h2>
          <p className="text-base text-neutral-300">
            Comparez les tarifs et les avantages de chaque offre avant de passer commande. Notre algorithme
            met en avant les deals avec le meilleur prix par 100 g et la disponibilité la plus fiable.
          </p>
        </div>
        <a
          href="#comparateur"
          className="inline-flex items-center justify-center rounded-full bg-flame-gradient px-6 py-3 text-sm font-semibold text-white shadow-aurora-soft transition hover:brightness-110"
        >
          Voir tous les produits comparés
        </a>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {deals.map((deal) => (
          <article
            key={deal.title}
            className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-secondary-300/60 hover:bg-neutral-900/80"
          >
            <span className="inline-flex w-fit rounded-full bg-secondary-100/80 px-3 py-1 text-xs font-semibold text-neutral-900">
              {deal.badge}
            </span>
            <h3 className="text-xl font-semibold text-white">{deal.title}</h3>
            <p className="text-sm text-neutral-300">{deal.description}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-2xl font-bold text-secondary-200">{deal.discount}</span>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-200 transition group-hover:text-secondary-200"
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
