"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button, buttonClassName } from "@/components/ui/button";
import { PriceAlertForm } from "@/components/PriceAlertForm";

interface PriceAlertsSectionProps {
  onExploreCatalogue?: () => void;
  catalogueHref?: string;
}

export function PriceAlertsSection({ onExploreCatalogue, catalogueHref = "/products" }: PriceAlertsSectionProps) {
  return (
    <section className="bg-orange-50/70 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,1fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
              Ne ratez plus la bonne affaire
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Activez vos alertes personnalisées
            </h2>
            <p className="text-base leading-relaxed text-slate-600">
              Configurez vos alertes prix pour être notifié dès qu’un vendeur casse les prix ou qu’un nouveau marchand
              référence votre protéine favorite. Notre robot analyse chaque variation et vous prévient en priorité.
            </p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-orange-500">✓</span>
                Notifications instantanées ou résumés hebdomadaires selon votre préférence.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-orange-500">✓</span>
                Historique de prix sur 90 jours et suivi du meilleur rapport qualité/prix.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-orange-500">✓</span>
                Suggestions intelligentes basées sur vos recherches et votre objectif sportif.
              </li>
            </ul>
            <div className="pt-2">
              {onExploreCatalogue ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-orange-200 text-orange-600"
                  onClick={onExploreCatalogue}
                >
                  Explorer le catalogue
                </Button>
              ) : (
                <Link
                  href={catalogueHref}
                  className={buttonClassName({
                    variant: "outline",
                    size: "lg",
                    className: "rounded-full border-orange-200 text-orange-600",
                  })}
                >
                  Explorer le catalogue
                </Link>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="lg:pl-4"
          >
            <PriceAlertForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
