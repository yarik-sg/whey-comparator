"use client";

const partnerLogos: Array<{
  name: string;
  alt: string;
  logoUrl: string;
}> = [
  {
    name: "MyProtein",
    alt: "Logo de la marque de nutrition sportive MyProtein",
    logoUrl:
      "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/myprotein-logo.svg",
  },
  {
    name: "Optimum Nutrition",
    alt: "Logo du fabricant de compléments Optimum Nutrition",
    logoUrl:
      "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/optimum-nutrition-logo.svg",
  },
  {
    name: "Bulk Powders",
    alt: "Logo du distributeur de compléments Bulk Powders",
    logoUrl:
      "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/bulk-logo.svg",
  },
  {
    name: "Foodspring",
    alt: "Logo de la marque nutritionnelle Foodspring",
    logoUrl:
      "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/foodspring-logo.svg",
  },
  {
    name: "Decathlon Coach",
    alt: "Logo de la plateforme d’entraînement Decathlon Coach",
    logoUrl:
      "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/decathlon-coach-logo.svg",
  },
  {
    name: "Nutrimuscle",
    alt: "Logo du spécialiste français Nutrimuscle",
    logoUrl:
      "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/partners/nutrimuscle-logo.svg",
  },
];

export function PartnerLogos() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,102,0,0.08),transparent_60%)]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Ils nous font confiance
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-dark dark:text-white">
            Des partenariats pour dénicher les meilleures offres
          </h2>
          <p className="mt-4 text-base text-muted dark:text-text-2">
            Nous collaborons avec les leaders européens des compléments pour garantir des tarifs négociés,
            des stocks fiables et une information produit transparente.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-accent/60 bg-white/70 p-6 shadow-neo backdrop-blur dark:border-accent-d/40 dark:bg-[rgba(30,41,59,0.7)]">
          <div className="relative flex items-center gap-12">
            <div className="flex min-w-full items-center gap-12 whitespace-nowrap will-change-transform animate-marquee">
              {[...partnerLogos, ...partnerLogos].map(({ name, alt, logoUrl }, index) => (
                <div
                  key={`${name}-${index}`}
                  className="flex items-center justify-center rounded-2xl bg-white/80 px-10 py-5 shadow-sm transition hover:shadow-md dark:bg-white/5"
                >
                  <img
                    src={logoUrl}
                    alt={alt}
                    className="h-12 w-full max-w-[150px] object-contain opacity-80 transition duration-300 hover:opacity-100"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="mailto:partenaires@fitidion.com"
            className="inline-flex items-center rounded-full border border-primary/40 bg-transparent px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Devenez partenaire
          </a>
        </div>
      </div>
    </section>
  );
}
