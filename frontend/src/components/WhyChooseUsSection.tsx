"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Données fiables",
    description:
      "Scrapers propriétaires, API partenaires et contrôles humains pour garantir une information produit vérifiée.",
  },
  {
    icon: Zap,
    title: "Mises à jour continues",
    description:
      "Prix, stocks et frais de port sont recalculés 24/7 pour vous alerter dès qu’un seuil est franchi.",
  },
  {
    icon: Star,
    title: "Classements transparents",
    description:
      "Score FitIdion basé sur le rapport qualité/prix, les avis et la fiabilité des marchands, sans influence commerciale.",
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
              <Card className="group h-full border-accent/70 bg-background/95 p-8 shadow-neo transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-fitidion dark:border-[var(--text)]/20 dark:bg-dark/80">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-dark dark:text-[var(--text)]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted dark:text-[var(--text-2)]">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
