import Link from "next/link";

const productLinks = [
  { label: "Promos du moment", href: "/catalogue" },
  { label: "Comparateur intelligent", href: "/comparateur" },
  { label: "Analyses produits", href: "/products" },
];

const companyLinks = [
  { label: "À propos de FitIdion", href: "/#a-propos" },
  { label: "Contact", href: "mailto:hello@fitidion.io" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-white via-white/95 to-fitidion-light/90 py-14 text-fitidion-dark shadow-inner backdrop-blur dark:border-white/10 dark:from-slate-950/80 dark:via-slate-950/70 dark:to-slate-950/80 dark:text-slate-100">
      <div className="absolute inset-0 -z-10 bg-fitidion-radial opacity-60 dark:opacity-40" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr,1fr,1fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full bg-fitidion-orange/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-fitidion-orange">
              FitIdion
              <span className="h-2 w-2 rounded-full bg-fitidion-gold" aria-hidden />
              Fitness intelligent
            </div>
            <h2 className="text-2xl font-semibold leading-tight text-fitidion-dark dark:text-white">
              Optimisez chaque décision sportive avec notre couche d&apos;intelligence produit.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted">
              FitIdion croise catalogues, historique de prix, avis et stocks pour vous guider vers les
              compléments et équipements les plus adaptés. Activez vos alertes, suivez vos marques
              favorites et laissez notre IA anticiper les meilleures opportunités.
            </p>
          </div>
          <nav className="space-y-4 text-sm">
            <p className="font-semibold uppercase tracking-[0.25em] text-fitidion-dark/80 dark:text-slate-200">Explorer</p>
            <ul className="space-y-3 text-muted">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-fitidion-orange" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="space-y-4 text-sm">
            <p className="font-semibold uppercase tracking-[0.25em] text-fitidion-dark/80 dark:text-slate-200">Connecter</p>
            <ul className="space-y-3 text-muted">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a className="transition hover:text-fitidion-orange" href={link.href}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className="transition hover:text-fitidion-orange" href={link.href}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/30 pt-6 text-sm text-muted sm:flex-row sm:items-center dark:border-white/10">
          <p>© {new Date().getFullYear()} FitIdion — Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-fitidion-dark transition hover:border-fitidion-orange/40 hover:bg-fitidion-orange/10 dark:border-white/20 dark:bg-white/5 dark:text-slate-100"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-fitidion-gold" aria-hidden />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
