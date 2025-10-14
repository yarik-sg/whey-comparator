"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Clara B.",
    role: "Coach sportive — Paris",
    quote:
      "Le suivi des prix m’a permis d’équiper mes clients avec les meilleures marques sans exploser leur budget. Les alertes sont redoutables de précision !",
    avatar: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/avatars/avatar-fitness-01.png",
  },
  {
    name: "Idriss L.",
    role: "CrossFitter — Lyon",
    quote:
      "FitIdion est devenu mon réflexe avant chaque achat. Je compare, je checke les promos et je trouve toujours une offre plus intéressante que sur Google.",
    avatar: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/avatars/avatar-fitness-02.png",
  },
  {
    name: "Mélanie K.",
    role: "Athlète vegan — Bordeaux",
    quote:
      "La sélection vegan est ultra complète et les fiches produits détaillent enfin les ingrédients. Ça change tout pour planifier mes préparations.",
    avatar: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/avatars/avatar-fitness-03.png",
  },
  {
    name: "Thomas P.",
    role: "Responsable d’une box — Nantes",
    quote:
      "On utilise le comparateur pour négocier nos achats en gros. Les graphiques d’historique donnent immédiatement une tendance fiable.",
    avatar: "https://cdn.jsdelivr.net/gh/tsiwla/assets-cdn/avatars/avatar-fitness-04.png",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(255,102,0,0.12),transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_86%_14%,rgba(253,220,142,0.18),transparent_60%)]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Avis &amp; communauté</p>
            <h2 className="font-heading text-3xl font-semibold text-dark sm:text-4xl dark:text-white">
              Une communauté de sportifs exigeants nous fait confiance
            </h2>
            <p className="text-base text-muted dark:text-text-2">
              Notes agrégées depuis nos marchands partenaires, Google Shopping et les retours clients sur le terrain.
            </p>
          </div>
          <div className="flex items-end gap-6 rounded-3xl border border-accent/60 bg-accent/90 px-6 py-5 shadow-neo backdrop-blur dark:border-accent-d/40 dark:bg-[rgba(30,41,59,0.75)]">
            <div>
              <p className="text-4xl font-semibold text-dark dark:text-text-1">4.8<span className="ml-1 text-2xl text-primary">/5</span></p>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted dark:text-text-2">Basée sur 1 820 avis</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
              asChild
            >
              <a href="/comparateur?tab=reviews">Lire tous les avis</a>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="flex h-full flex-col justify-between rounded-3xl border border-accent/50 bg-background/95 p-6 shadow-neo transition hover:-translate-y-1 hover:shadow-lg dark:border-accent-d/40 dark:bg-[rgba(30,41,59,0.85)]"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/70 bg-white shadow-sm">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark dark:text-text-1">{testimonial.name}</p>
                  <p className="text-xs text-muted dark:text-text-2">{testimonial.role}</p>
                </div>
              </div>
              <p className="mt-6 flex-1 text-sm leading-relaxed text-muted dark:text-text-2">“{testimonial.quote}”</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                <span aria-hidden>★★★★★</span>
                Expérience vérifiée
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
