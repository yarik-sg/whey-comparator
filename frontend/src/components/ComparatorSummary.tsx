"use client";

import { motion } from "framer-motion";

export interface Category {
  titre: string;
  query: string;
  icon: string;
  bg: string;
}

interface ComparatorSummaryProps {
  categories: Category[];
  onSelectCategory: (query: string) => void;
}

export function ComparatorSummary({ categories, onSelectCategory }: ComparatorSummaryProps) {
  return (
    <section className="bg-[#0d1b2a] py-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Pourquoi utiliser notre comparateur ?</h2>
            <p className="mt-4 text-gray-300">
              Accédez à des centaines de produits sélectionnés parmi les leaders du marché du sport
              et laissez notre algorithme trouver en quelques secondes le prix le plus bas.
            </p>
            <ul className="mt-8 space-y-4 text-gray-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-orange-400">★</span>
                <span>Analyse multi-boutiques et suivi en temps réel des fluctuations tarifaires.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-orange-400">★</span>
                <span>Filtres poussés pour comparer les saveurs, formats et compositions.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-orange-400">★</span>
                <span>Alertes prix personnalisables sur vos marques favorites.</span>
              </li>
            </ul>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.titre}
                onClick={() => onSelectCategory(category.query)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.05 }}
                className={`flex flex-col items-start rounded-2xl px-5 py-6 text-left text-white shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${category.bg}`}
              >
                <span className="text-3xl">{category.icon}</span>
                <span className="mt-3 text-lg font-semibold">{category.titre}</span>
                <span className="mt-2 text-sm text-white/80">Comparer &gt;</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
