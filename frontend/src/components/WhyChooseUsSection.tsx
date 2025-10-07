"use client";

import { motion } from "framer-motion";
import { BadgeCheck, LineChart, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";

const pillars = [
  {
    icon: BadgeCheck,
    title: "Fiabilité des données",
    description:
      "Chaque offre est vérifiée manuellement et automatiquement pour garantir des informations prix et stock exactes.",
    details: [
      "Surveillance multi-sources couplée à des contrôles anti-doublons.",
      "Qualité produit vérifiée via avis certifiés et traçabilité fournisseurs.",
    ],
  },
  {
    icon: LineChart,
    title: "Vision actionnable",
    description:
      "Nos algorithmes traduisent les flux SerpAI en recommandations claires pour décider en quelques secondes.",
    details: [
      "Modèles propriétaires pondérant prix, disponibilité et frais cachés.",
      "Synthèse claire des évolutions pour planifier votre achat au meilleur moment.",
    ],
  },
  {
    icon: Sparkles,
    title: "Accompagnement expert",
    description:
      "Nous guidons votre choix grâce à des guides et comparatifs pensés avec des nutritionnistes et athlètes.",
    details: [
      "Conseils personnalisés selon votre objectif et votre budget.",
      "Sélection éditorialisée des références les plus appréciées de la communauté.",
    ],
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

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description, details }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="group flex h-full flex-col justify-between border-orange-100/70 bg-white/90 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div>
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500 ring-4 ring-orange-100">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm text-slate-500">{description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-500">
                    {details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-orange-400" />
                        <span className="leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 h-1 w-24 rounded-full bg-orange-200 transition group-hover:bg-orange-400" />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
