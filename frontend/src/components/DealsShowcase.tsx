"use client";

import { motion } from "framer-motion";

const deals = [
  {
    title: "Whey Isolate 2kg",
    description: "-35% sur la marque OptiPower + livraison offerte",
    badge: "Top Deal",
    color: "from-orange-500/80 to-red-500/80",
  },
  {
    title: "Créatine monohydrate",
    description: "Pot 500g à 14,90€ — stock limité",
    badge: "Flash",
    color: "from-blue-500/80 to-cyan-500/80",
  },
  {
    title: "Ceinture de force",
    description: "Accessoire premium cuir -20% jusqu'à dimanche",
    badge: "Accessoires",
    color: "from-purple-500/80 to-pink-500/80",
  },
];

export function DealsShowcase() {
  return (
    <section id="promotions" className="bg-[#0b1320] py-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Promos à ne pas manquer</h2>
            <p className="mt-3 text-gray-300">
              Des offres négociées avec les meilleurs e-shops spécialisés fitness.
            </p>
          </div>
          <p className="text-sm text-gray-400">Actualisées plusieurs fois par jour</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal, index) => (
            <motion.article
              key={deal.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${deal.color} p-6 shadow-lg`}
            >
              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-black/30 rounded-full mb-4">
                {deal.badge}
              </span>
              <h3 className="text-2xl font-semibold text-white">{deal.title}</h3>
              <p className="mt-3 text-sm text-white/90">{deal.description}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-medium text-white"
              >
                Profiter de l'offre →
              </motion.button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
