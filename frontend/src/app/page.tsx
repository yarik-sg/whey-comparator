"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Categorie {
  titre: string;
  query: string;
  icon: string;
  bg: string;
}

const categories: Categorie[] = [
  { titre: "Whey Protein", query: "whey protein", icon: "💪", bg: "bg-orange-500" },
  { titre: "Créatine", query: "creatine", icon: "⚡", bg: "bg-blue-600" },
  { titre: "BCAA", query: "bcaa", icon: "🍃", bg: "bg-green-500" },
  { titre: "Pré-Workout", query: "pre workout", icon: "🔥", bg: "bg-red-500" },
  { titre: "Accessoires Gym", query: "accessoires musculation fitness", icon: "🏋️‍♂️", bg: "bg-purple-500" },
  { titre: "Vêtements Sportifs", query: "vêtements sport running fitness homme femme", icon: "👕", bg: "bg-teal-500" },
  { titre: "Catalogue", query: "__catalogue__", icon: "📘", bg: "bg-gray-700" }, // Nouvelle tuile
];

export default function Home() {
  const router = useRouter();

  const handleClick = (query: string) => {
    if (query === "__catalogue__") {
      router.push("/catalogue"); // redirection vers la nouvelle page catalogue
    } else {
      router.push(`/comparateur?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0d1b2a] to-[#1b263b] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#0d1b2a] py-6 shadow-lg">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-orange-500">💪 Sport Comparator</h1>
          <p className="text-gray-300">Comparez les meilleurs suppléments & équipements</p>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-16">
        <h2 className="text-4xl font-bold mb-4">Trouvez le meilleur prix 💰</h2>
        <p className="text-lg text-gray-300">
          Suppléments, accessoires et vêtements sportifs au meilleur prix
        </p>
      </section>

      {/* Catégories */}
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.titre}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleClick(cat.query)}
              className={`cursor-pointer p-6 rounded-xl shadow-lg hover:shadow-2xl transition ${cat.bg} flex flex-col items-center justify-center`}
            >
              <span className="text-5xl">{cat.icon}</span>
              <h3 className="text-xl font-bold mt-4">{cat.titre}</h3>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1b2a] py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Sport Comparator — Inspiré par Idealo & LeDénicheur
      </footer>
    </div>
  );
}
