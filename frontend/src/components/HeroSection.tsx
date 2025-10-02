"use client";

import { motion } from "framer-motion";

interface HeroSectionProps {
  onStartComparison: () => void;
  onViewDeals: () => void;
}

export function HeroSection({ onStartComparison, onViewDeals }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-24 bg-gradient-to-br from-[#0d1b2a] via-[#1b263b] to-[#415a77] text-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="uppercase tracking-[0.3em] text-sm text-orange-400 mb-4">Comparateur nouvelle génération</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Ne payez plus jamais votre whey au prix fort
          </h1>
          <p className="mt-6 text-lg text-gray-200">
            Sport Comparator agrège les meilleures boutiques en ligne pour vous proposer
            des suppléments, équipements et tenues de sport au meilleur tarif, en temps réel.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onStartComparison}
              className="rounded-full bg-orange-500 hover:bg-orange-400 transition-colors px-8 py-3 font-semibold shadow-lg"
            >
              Lancer le comparateur
            </button>
            <button
              onClick={onViewDeals}
              className="rounded-full border border-white/40 hover:border-orange-300 hover:text-orange-200 transition-colors px-8 py-3 font-semibold"
            >
              Voir les promos
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
