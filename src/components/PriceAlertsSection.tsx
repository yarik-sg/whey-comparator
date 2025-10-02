export function PriceAlertsSection() {
  return (
    <section
      id="alertes-prix"
      className="relative overflow-hidden rounded-3xl border border-primary-100 bg-primary-50/60 p-8"
    >
      <div className="absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary-200/40 blur-3xl" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Alertes prix</p>
          <h2 className="text-3xl font-bold text-slate-900">Soyez averti dès qu'une whey atteint votre prix cible</h2>
          <p className="text-base text-slate-600">
            Configurez une alerte et recevez un email lorsqu'une boutique partenaire passe sous votre prix
            idéal. Inspiré du suivi intelligent idealo, vous ne raterez plus jamais un bon plan.
          </p>
        </div>
        <form className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sm shadow-primary-900/10">
          <div className="space-y-1">
            <label htmlFor="alert-email" className="text-sm font-medium text-slate-700">
              Adresse email
            </label>
            <input
              id="alert-email"
              type="email"
              placeholder="vous@exemple.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="alert-target" className="text-sm font-medium text-slate-700">
              Prix cible (€/kg)
            </label>
            <input
              id="alert-target"
              type="number"
              min="0"
              step="0.5"
              placeholder="Ex : 18"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-400"
          >
            Créer mon alerte personnalisée
          </button>
          <p className="text-xs text-slate-500">
            Nous surveillons en continu les variations de prix. Recevez un résumé complet avant que l'offre ne
            disparaisse.
          </p>
        </form>
      </div>
    </section>
  );
}
