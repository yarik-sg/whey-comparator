"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Fiabilité des données",
    description:
      "Sources vérifiées, scrapers et API fiables pour des résultats précis et transparents sur chaque produit.",
  },
  {
    icon: Zap,
    title: "Mises à jour en temps réel",
    description:
      "Nos robots actualisent les prix, disponibilités et frais de port 24/7 pour saisir les meilleures opportunités.",
  },
  {
    icon: Star,
    title: "Classements transparents",
    description:
      "Un scoring objectif qui pondère prix, avis et rapport qualité/prix pour comparer sans biais.",
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-500">
            Pourquoi nous choisir ?
          </p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Une proposition de valeur taillée pour les sportifs exigeants
          </h2>
          <p className="mt-5 text-base text-slate-500">
            Notre équipe combine technologie, expertise nutritionnelle et accompagnement personnalisé pour faire de la
            comparaison un vrai coach avant achat.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="group h-full border-orange-100 bg-white/95 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
