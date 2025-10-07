import Link from "next/link";

const productLinks = [
  { label: "Promos du moment", href: "/#promotions" },
  { label: "Comparer des produits", href: "/comparison" },
  { label: "Catalogue complet", href: "/products" },
];

const companyLinks = [
  { label: "À propos", href: "/#a-propos" },
  { label: "Contact", href: "mailto:contact@sport-comparator.io" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.5fr,1fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Sport Comparator
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Comparez les compléments sportifs en toute confiance : nous agrégeons les prix, les avis
              et les promotions pour vous aider à choisir le meilleur produit selon vos objectifs.
            </p>
          </div>
          <nav className="space-y-4 text-sm">
            <p className="font-semibold text-slate-900">Découvrir</p>
            <ul className="space-y-2 text-slate-500">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-orange-500" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="space-y-4 text-sm">
            <p className="font-semibold text-slate-900">Rester en contact</p>
            <ul className="space-y-2 text-slate-500">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a className="transition hover:text-orange-500" href={link.href}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className="transition hover:text-orange-500" href={link.href}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Sport Comparator. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-500"
              >
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
