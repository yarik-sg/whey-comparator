"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const productLinks = [
  { label: "Comparaison multi-produits", href: "/comparison" },
  { label: "Promotions protéines", href: "/#promotions" },
  { label: "Alertes prix", href: "/#alertes-prix" },
  { label: "Catalogue nutrition", href: "/products" },
];

const helpLinks = [
  { label: "Centre d&apos;aide", href: "mailto:contact@sport-comparator.io" },
  { label: "Support technique", href: "mailto:support@sport-comparator.io" },
  { label: "Guide d&apos;utilisation", href: "/comparison" },
  { label: "FAQ", href: "/#faq" },
];

const companyLinks = [
  { label: "À propos", href: "/#a-propos" },
  { label: "Partenaires", href: "/#partenaires" },
  { label: "Presse", href: "mailto:presse@sport-comparator.io" },
  { label: "Contact", href: "mailto:contact@sport-comparator.io" },
];

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com", icon: "M23.643 4.937a9.39 9.39 0 0 1-2.828.807 4.932 4.932 0 0 0 2.165-2.724 9.72 9.72 0 0 1-3.127 1.226 4.916 4.916 0 0 0-8.384 4.482A13.944 13.944 0 0 1 1.671 3.149a4.822 4.822 0 0 0-.664 2.475 4.92 4.92 0 0 0 2.188 4.096 4.903 4.903 0 0 1-2.228-.616v.062a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.224.085 4.935 4.935 0 0 0 4.6 3.417A9.867 9.867 0 0 1 0 21.542 13.94 13.94 0 0 0 7.548 23.5c9.058 0 14.01-7.721 14.01-14.422 0-.22-.005-.439-.015-.657a10.093 10.093 0 0 0 2.5-2.484Z" },
  { label: "Instagram", href: "https://instagram.com", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.262 2.242 1.325 3.608.058 1.266.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.063 1.366-.35 2.633-1.325 3.608-.975.975-2.242 1.262-3.608 1.325-1.266.058-1.645.069-4.85.069s-3.584-.011-4.85-.069c-1.366-.063-2.633-.35-3.608-1.325-.975-.975-1.262-2.242-1.325-3.608C2.175 15.646 2.163 15.266 2.163 12s.012-3.584.07-4.85c.062-1.366.35-2.633 1.325-3.608.975-.975 2.242-1.262 3.608-1.325C8.416 2.175 8.796 2.163 12 2.163Zm0-2.163C8.741 0 8.332.013 7.052.072 5.772.131 4.672.428 3.78 1.32.94 4.16.947 7.548.947 12c0 4.452-.007 7.84 2.833 10.68.892.892 1.992 1.189 3.272 1.248 1.28.059 1.689.072 4.948.072s3.668-.013 4.948-.072c1.28-.059 2.38-.356 3.272-1.248 2.84-2.84 2.833-6.228 2.833-10.68 0-4.452.007-7.84-2.833-10.68-.892-.892-1.992-1.189-3.272-1.248C15.668.013 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324Zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998Zm7.2-11.631a1.44 1.44 0 1 0 0-2.88 1.44 1.44 0 0 0 0 2.88Z" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "M4.98 3.5a2.5 2.5 0 1 1-4.999-.001A2.5 2.5 0 0 1 4.98 3.5ZM.5 8.25H4.5V24H.5V8.25Zm7.25 0H11.6V10.3h.055c.43-.815 1.48-1.675 3.044-1.675 3.253 0 3.85 2.142 3.85 4.927V24h-4V14.75c0-2.2-.04-5.025-3.065-5.025-3.07 0-3.54 2.4-3.54 4.87V24h-4V8.25Z" },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setStatus("error");
      setMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setStatus("success");
    setMessage("Merci ! Vous recevrez bientôt nos meilleures offres.");
    setEmail("");
  };

  return (
    <footer className="bg-[#0d1b2a] text-gray-300">
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Sport Comparator</h2>
              <p className="text-sm text-gray-400">
                Trouvez la meilleure whey et comparez les compléments en un clin d&apos;œil. Nous sélectionnons les offres les plus
                pertinentes pour les athlètes et passionnés de nutrition.
              </p>
            </div>

            <nav aria-label="Produits" className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">
                Produits
              </h3>
              <ul className="space-y-2 text-sm">
                {productLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="transition hover:text-white focus-visible:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Aide" className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">Aide</h3>
              <ul className="space-y-2 text-sm">
                {helpLinks.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("mailto:") ? (
                      <a href={href} className="transition hover:text-white focus-visible:underline">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="transition hover:text-white focus-visible:underline">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Société" className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">Société</h3>
              <ul className="space-y-2 text-sm">
                {companyLinks.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("mailto:") ? (
                      <a href={href} className="transition hover:text-white focus-visible:underline">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="transition hover:text-white focus-visible:underline">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">
                Newsletter
              </h3>
              <p className="text-sm text-gray-400">
                Recevez chaque semaine les meilleures promotions et astuces pour optimiser vos performances.
              </p>
              <form
                noValidate
                onSubmit={handleSubmit}
                className="space-y-3"
                aria-describedby="newsletter-feedback"
                data-lpignore="true"
                autoComplete="off"
              >
                <div className="space-y-2">
                  <label htmlFor="newsletter-email" className="text-sm font-medium text-gray-200">
                    Adresse e-mail
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="newsletter-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status !== "idle") {
                          setStatus("idle");
                          setMessage("");
                        }
                      }}
                      placeholder="vous@exemple.com"
                      aria-invalid={status === "error"}
                      aria-describedby={message ? "newsletter-feedback" : undefined}
                      className="w-full rounded-md border border-white/20 bg-[#0b1320] px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1b2a] focus-visible:ring-orange-500"
                    >
                      S&apos;abonner
                    </button>
                  </div>
                </div>
                <p
                  id="newsletter-feedback"
                  className={`text-sm ${
                    status === "error"
                      ? "text-red-400"
                      : status === "success"
                      ? "text-emerald-400"
                      : "text-gray-400"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {message || "Nous respectons votre vie privée et n&apos;envoyons pas de spam."}
                </p>
              </form>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-gray-400 lg:col-span-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">
                Mentions légales
              </h3>
              <p className="mt-2">
                Sport Comparator est édité par la société Fit Data. Les informations fournies sont à titre indicatif et ne
                remplacent pas l&apos;avis d&apos;un professionnel de santé. Consultez nos{" "}
                <Link href="/conditions-generales" className="underline">
                  conditions générales
                </Link>{" "}
                et notre{" "}
                <Link href="/politique-confidentialite" className="underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0b1320]">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Sport Comparator. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="transition hover:text-white focus-visible:underline"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d={icon} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
