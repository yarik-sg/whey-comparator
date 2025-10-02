"use client";

import { motion } from "framer-motion";

interface PriceAlertsSectionProps {
  onExploreCatalogue: () => void;
}

export function PriceAlertsSection({ onExploreCatalogue }: PriceAlertsSectionProps) {
  return (
    <section className="bg-[#1b263b] py-20 text-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">Ne ratez plus la bonne affaire</h2>
            <p className="text-gray-200">
              Activez des alertes pour être prévenu dès qu'un prix chute ou qu'un nouveau marchand
              référence vos produits favoris. Personnalisez vos seuils par marque, catégorie ou format.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <span className="text-orange-400">✓</span>
                Notifications e-mail hebdo ou instantanées
              </li>
              <li className="flex items-center gap-3">
                <span className="text-orange-400">✓</span>
                Historique des prix et tendances saisonnières
              </li>
              <li className="flex items-center gap-3">
                <span className="text-orange-400">✓</span>
                Suggestions intelligentes selon vos achats précédents
              </li>
            </ul>
            <div className="pt-4">
              <button
                onClick={onExploreCatalogue}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-400"
              >
                Découvrir le catalogue
                <span aria-hidden>→</span>
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl bg-[#0d1b2a] p-8 shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm uppercase tracking-widest text-gray-400">Alerte active</span>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">-12% détecté</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Whey Native - Chocolat</h3>
                <p className="text-gray-300">Prix cible : 22,90€ • Actuel : 21,50€</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-gray-300">
                  "Notification envoyée à 8h12 — remise exceptionnelle chez FitShop."
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Historique 30j</p>
                  <p className="mt-1 text-lg font-semibold text-white">-18%</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Boutiques suivies</p>
                  <p className="mt-1 text-lg font-semibold text-white">12</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
