"use client";

import { motion } from "framer-motion";
import { BadgeCheck, LineChart, Sparkles } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#0d1b2a] py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,140,0,0.15),transparent_55%)]" />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300/80">
            Pourquoi nous choisir ?
          </p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Une proposition de valeur taillée pour les sportifs exigeants
          </h2>
          <p className="mt-5 text-base text-gray-300">
            Notre équipe combine technologie, expertise nutritionnelle et expérience utilisateur pour transformer la comparaison
            en un accompagnement complet avant achat.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description, details }) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
            >
              <div>
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 text-orange-300 ring-2 ring-orange-500/30">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm text-gray-200/90">{description}</p>
                <ul className="mt-5 space-y-2 text-sm text-gray-300">
                  {details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-400" />
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 h-0.5 w-full rounded-full bg-gradient-to-r from-orange-500/0 via-orange-500/40 to-orange-500/0 opacity-0 transition duration-500 group-hover:opacity-100" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
