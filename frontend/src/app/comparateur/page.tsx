"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

interface Produit {
  site: string;
  nom: string;
  prix: string;
  image?: string;
  lien?: string;
  eur_par_kg?: number | null;
  prix_num?: number | null;
}

export default function Comparateur() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "whey protein 2kg";

  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Recherche & filtres
  const [q, setQ] = useState(qParam);
  const [marque, setMarque] = useState("");
  const [categorie, setCategorie] = useState("");
  const [minPrix, setMinPrix] = useState("");
  const [maxPrix, setMaxPrix] = useState("");

  const fetchProduits = () => {
    setLoading(true);
    setApiError(null);

    const params = new URLSearchParams();
    params.append("q", q);
    if (marque) params.append("marque", marque);
    if (categorie) params.append("categorie", categorie);

    fetch(`/api/proxy?target=compare&${params.toString()}`)
      .then(async (res) => {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            setProduits(data);
          } else {
            setApiError("Réponse inattendue du serveur");
            setProduits([]);
          }
        } catch {
          setApiError("Erreur parsing JSON");
          setProduits([]);
        }
      })
      .catch((err) => {
        setApiError("Erreur API: " + err.message);
        setProduits([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProduits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  // Filtrage local par prix
  const produitsFiltres = produits.filter((p) => {
    const n = typeof p.prix_num === "number" ? p.prix_num : undefined;
    const min = minPrix ? parseFloat(minPrix) : undefined;
    const max = maxPrix ? parseFloat(maxPrix) : undefined;

    if (min !== undefined && (n === undefined || n < min)) return false;
    if (max !== undefined && (n === undefined || n > max)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0d1b2a] text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-wide text-orange-500">
            💪 Sport Comparator
          </h1>

          {/* Barre de recherche */}
          <div className="flex w-full md:w-auto max-w-lg items-center bg-white rounded-lg overflow-hidden shadow-md">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex: whey isolate chocolat 2kg"
              className="flex-1 px-3 py-2 text-black outline-none"
            />
            <button
              onClick={fetchProduits}
              className="bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 transition"
            >
              🔍
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#0d1b2a] to-[#1b263b] text-white py-12 text-center">
        <h2 className="text-3xl font-bold mb-2">
          Comparez les meilleures offres
        </h2>
        <p className="text-gray-300">
          Trouvez le meilleur prix 💰 et la meilleure qualité 🏋️‍♂️
        </p>
      </section>

      {/* Filtres */}
      <div className="container mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={marque}
          onChange={(e) => setMarque(e.target.value)}
          placeholder="Marque (ex: MyProtein)"
          className="px-3 py-2 rounded border text-black"
        />
        <input
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          placeholder="Catégorie (ex: créatine, bcaa)"
          className="px-3 py-2 rounded border text-black"
        />
        <input
          value={minPrix}
          onChange={(e) => setMinPrix(e.target.value)}
          placeholder="Prix min (€)"
          className="px-3 py-2 rounded border text-black"
        />
        <input
          value={maxPrix}
          onChange={(e) => setMaxPrix(e.target.value)}
          placeholder="Prix max (€)"
          className="px-3 py-2 rounded border text-black"
        />
      </div>

      {/* Produits */}
      <main className="container mx-auto px-6 py-10 flex-1">
        {loading ? (
          <p className="text-center text-gray-600 animate-pulse text-lg">
            ⏳ Chargement...
          </p>
        ) : apiError ? (
          <div className="text-red-600 text-center font-semibold">{apiError}</div>
        ) : produitsFiltres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produitsFiltres.map((p, i) => (
              <motion.div
                key={`${p.site}-${p.nom}-${i}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition flex flex-col"
              >
                <div className="aspect-square flex items-center justify-center p-4 bg-white">
                  <img
                    src={p.image || "/placeholder.png"}
                    alt={p.nom}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="text-md font-semibold text-gray-800 line-clamp-2">{p.nom}</h2>
                  <p className="text-orange-600 font-bold text-xl mt-2">{p.prix}</p>
                  {p.eur_par_kg && (
                    <p className="text-sm text-gray-500">~ {p.eur_par_kg} €/kg</p>
                  )}
                  <span className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded self-start text-gray-600">
                    {p.site}
                  </span>
                  {p.lien ? (
                    <a
                      href={p.lien}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-auto bg-orange-500 text-white px-4 py-2 rounded-lg text-center font-semibold hover:bg-orange-600 transition"
                    >
                      Voir le produit
                    </a>
                  ) : (
                    <button
                      disabled
                      className="mt-auto bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      Lien indisponible
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-red-600 text-lg">❌ Aucun produit disponible</p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1b2a] text-white py-4 mt-10">
        <div className="container mx-auto px-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Sport Comparator — Développé avec ❤️
        </div>
      </footer>
    </div>
  );
}
