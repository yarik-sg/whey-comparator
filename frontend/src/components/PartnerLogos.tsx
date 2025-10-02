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
    <section className="bg-[#0d1b2a] py-16">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
            Ils nous font confiance
          </p>
          <h2 className="mt-4 text-3xl font-bold text-white">
            Des partenariats pour dénicher les meilleures offres
          </h2>
          <p className="mt-4 text-base text-gray-300">
            Nous collaborons avec les leaders européens des compléments pour garantir
            des tarifs négociés, des stocks fiables et des informations produit
            vérifiées.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {partnerLogos.map(({ name, alt, logoUrl }) => (
            <div
              key={name}
              className="group flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 px-6 py-6 backdrop-blur"
            >
              <img
                src={logoUrl}
                alt={alt}
                className="h-12 w-full max-w-[150px] object-contain opacity-70 transition duration-300 ease-out group-hover:opacity-100 group-hover:grayscale-0 grayscale"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
