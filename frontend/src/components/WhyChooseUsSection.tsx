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
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,102,0,0.1),transparent_60%)]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            Pourquoi nous choisir ?
          </p>
          <h2 className="mt-4 text-3xl font-bold text-dark sm:text-4xl dark:text-white">
            Une proposition de valeur taillée pour les sportifs exigeants
          </h2>
          <p className="mt-5 text-base text-muted dark:text-muted/70">
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
              <Card className="group h-full border-white/15 bg-white/80 p-8 shadow-glass transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-fitidion dark:border-white/10 dark:bg-slate-900/60">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-dark dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted dark:text-muted/70">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
