import Link from "next/link";

const linkSections = [
  {
    title: "Produits",
    links: [
      { label: "Catalogue complet", href: "/catalogue" },
      { label: "Analyses produits", href: "/products" },
      { label: "Meilleures offres", href: "/" },
    ],
  },
  {
    title: "Comparateur",
    links: [
      { label: "Lancer le comparateur", href: "/comparateur" },
      { label: "Alertes prix", href: "/alerts" },
      { label: "Classements marques", href: "/catalogue#marques" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Questions fréquentes", href: "/#faq" },
      { label: "Support", href: "mailto:hello@fitidion.io" },
      { label: "Guides d'achat", href: "/#guides" },
    ],
  },
  {
    title: "À propos",
    links: [
      { label: "Notre mission", href: "/#a-propos" },
      { label: "Rejoindre FitIdion", href: "/#carriere" },
      { label: "Mentions légales", href: "/mentions-legales" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-accent/50 bg-accent py-16 text-text shadow-neo dark:border-accent-d/40 dark:bg-[var(--secondary)] dark:text-[var(--text-2)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.5fr,repeat(3,1fr)]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-neo dark:bg-[var(--background)]/40 dark:text-[var(--text-1)]">
              FitIdion
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              Fitness Intelligent
            </div>
            <h2 className="text-2xl font-semibold leading-tight text-text dark:text-[var(--text-1)]">
              Comparez, optimisez et suivez vos achats fitness avec une interface pensée pour la performance.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted dark:text-[var(--text-2)]">
              Nos algorithmes rassemblent les données produits, les prix en temps réel et les retours de la communauté pour vous aider à trouver la meilleure offre à chaque instant.
            </p>
          </div>
          {linkSections.map((section) => (
            <nav key={section.title} className="space-y-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text dark:text-[var(--text-1)]">
                {section.title}
              </p>
              <ul className="space-y-3 text-muted dark:text-[var(--text-2)]">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("http") || link.href.startsWith("mailto:") ? (
                      <a
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition duration-200 hover:text-primary"
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition duration-200 hover:text-primary"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-accent/60 pt-6 text-sm text-muted dark:border-accent-d/40 dark:text-[var(--text-2)] sm:flex-row sm:items-center">
          <p>© 2025 FitIdion — La plateforme du Fitness Intelligent.</p>
          <div className="flex flex-wrap items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-text transition duration-200 hover:-translate-y-0.5 hover:bg-white/60 hover:text-primary dark:bg-[var(--background)]/30 dark:text-[var(--text-2)] dark:hover:bg-[var(--background)]/50 dark:hover:text-[var(--text-1)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
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
