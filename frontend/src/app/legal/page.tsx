import type { Metadata } from "next";

import { createMetadata } from "@/lib/siteMetadata";

const legalSections = [
  {
    id: "mentions-legales",
    title: "Mentions légales",
    content: [
      "FitIdion est édité par FitIdion SAS, 10 rue du Progrès, 75010 Paris.",
      "Directeur de la publication : Clara Delmas.",
      "Contact : support@fitidion.com.",
      "Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.",
      "SIREN : 912 345 678 — Capital social : 50 000 €.",
    ],
  },
  {
    id: "confidentialite",
    title: "Politique de confidentialité",
    content: [
      "Les données collectées (produits suivis, salles favorites, alertes prix) sont utilisées exclusivement pour fournir les services FitIdion.",
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant via support@fitidion.com.",
      "Les alertes e-mail sont envoyées uniquement après consentement explicite et peuvent être désactivées à tout moment.",
      "Les outils d'analyse anonymisent les IP et ne conservent aucun cookie non essentiel sans votre accord.",
      "FitIdion s'engage à notifier les utilisateurs en cas de violation de données dans un délai de 72 heures.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies et traceurs",
    content: [
      "Le site utilise des cookies fonctionnels nécessaires au fonctionnement du comparateur et du tableau de bord.",
      "Les cookies de mesure d'audience sont anonymisés et peuvent être désactivés depuis le centre de préférences.",
      "Aucun cookie publicitaire n'est déposé sans action explicite de l'utilisateur.",
    ],
  },
];

const lastUpdated = new Intl.DateTimeFormat("fr-FR").format(new Date());

export const metadata: Metadata = createMetadata({
  title: "Mentions légales & confidentialité",
  description: "Consultez les mentions légales, la politique de confidentialité et la gestion des cookies de la plateforme FitIdion.",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <main className="bg-background py-20 text-[color:var(--text)]">
      <div className="mx-auto max-w-4xl space-y-12 px-6">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Legal
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">Mentions légales & confidentialité</h1>
          <p className="mx-auto max-w-2xl text-base text-[color:var(--text)]/70 sm:text-lg">
            Transparence sur notre société, nos engagements en matière de protection des données et l'usage des cookies FitIdion.
          </p>
        </header>

        <section className="space-y-10">
          {legalSections.map((section) => (
            <article key={section.id} id={section.id} className="space-y-4 rounded-3xl border border-accent/60 bg-[color:var(--accent)]/30 p-8 shadow-soft">
              <h2 className="text-2xl font-semibold text-[color:var(--text)]">{section.title}</h2>
              <ul className="space-y-3 text-sm text-[color:var(--text)]/75">
                {section.content.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <footer className="rounded-3xl border border-primary/40 bg-primary/10 p-6 text-center text-sm text-primary">
          Dernière mise à jour : {lastUpdated}
        </footer>
      </div>
    </main>
  );
}
