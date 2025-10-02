"use client";

import { motion } from "framer-motion";

const stats = [
  {
    label: "Boutiques analysées",
    value: "35+",
    description: "Sélection des marchands les plus fiables du marché francophone.",
  },
  {
    label: "Mises à jour quotidiennes",
    value: "12k",
    description: "Relevés de prix consolidés plusieurs fois par jour.",
  },
  {
    label: "Alertes actives",
    value: "4.8k",
    description: "Athlètes inscrits sur nos notifications personnalisées.",
  },
];

const highlights = [
  "Algorithme propriétaire pour classer les offres en fonction du prix, des frais de port et de la disponibilité.",
  "Filtres avancés pour comparer les formats, compositions et labels nutritionnels.",
  "Historique des variations afin de savoir quand déclencher votre achat.",
];

export function ComparatorSummary() {
  return (
    <section className="bg-[#0d1b2a] py-20">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
              Pourquoi nous choisir ?
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              Un comparateur pensé pour les sportifs exigeants
            </h2>
            <p className="mt-5 text-gray-300">
              Nous agrégons les données produits, prix et avis des leaders du marché pour vous livrer une vision claire et actionnable en quelques secondes.
            </p>
            <ul className="mt-8 space-y-4 text-gray-200">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="mt-1 text-orange-400">★</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {stats.map(({ label, value, description }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur"
              >
                <span className="text-3xl font-bold text-orange-300">{value}</span>
                <h3 className="mt-2 text-lg font-semibold">{label}</h3>
                <p className="mt-3 text-sm text-gray-200/80">{description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
