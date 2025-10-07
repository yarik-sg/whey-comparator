# 🧬 Whey Comparator

Comparateur multi-sources pour les compléments alimentaires (whey, créatine, etc.). Le projet regroupe une API **FastAPI** qui agrège des offres SerpAPI/scraper et une interface **Next.js 14** optimisée pour consulter, comparer et analyser les prix.

## ✨ Fonctionnalités clés

- **Catalogue unifié** : liste des produits enrichie (prix, disponibilité, notation, rapport protéines/€) avec sélection automatique de la meilleure offre.  
- **Comparateur multi-produits** : page dédiée permettant de juxtaposer plusieurs références, d'afficher un résumé des meilleurs prix et d'accéder rapidement aux marchands.  
- **Historique et fallback** : données de secours embarquées lorsque le scraper est indisponible, avec génération d'images réalistes et normalisation automatique des URLs distantes.  
- **Front moderne** : composants Tailwind réutilisables, mode sombre natif, navigation fluide entre catalogue, promotions et comparateur.

## 🏗️ Architecture du dépôt

```
whey-comparator/
├── main.py                  # API FastAPI (agrégation, normalisation, comparaison)
├── fallback_catalogue.py    # Données de secours utilisées par l'API
├── services/                # Intégrations externes et utilitaires scraping
├── frontend/                # Application Next.js 14 (app router)
│   ├── src/app/             # Pages (catalogue, comparaison, produits…)
│   ├── src/components/      # UI (ProductCard, OfferTable, etc.)
│   └── src/lib/             # Client HTTP, helpers
├── docs/                    # Documentation annexe
└── docker-compose.yml       # Orchestration locale API + frontend
```

## 🚀 Mise en route

### Prérequis

- Python 3.11+
- Node.js 18+
- npm 9+ ou pnpm/yarn (adapter les commandes si besoin)

### Lancer l'API FastAPI

```bash
python -m venv .venv
source .venv/bin/activate  # sous Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Variables utiles :

- `SERPAPI_KEY` : clé API SerpAPI (une valeur de développement est fournie par défaut).
- `SCRAPER_BASE_URL` : URL du service scraper (défaut `http://localhost:8001`).

### Lancer le frontend Next.js

```bash
cd frontend
npm install
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000). Pour relier le frontend à l'API locale, définissez `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` (ou utilisez le proxy `/api/proxy`).

### Scripts utiles

| Commande                 | Description                                                |
|--------------------------|------------------------------------------------------------|
| `npm run lint`           | Analyse TypeScript/ESLint.                                |
| `npm run build`          | Génère la version production de l'interface.              |
| `npm run preview`        | Sert l'app Next.js buildée.                               |
| `uvicorn main:app --reload` | Démarre l'API avec rechargement à chaud.              |

## 🔍 Historique des actions réalisées

1. **Tâche 1 – Fondations backend** : création de l'API FastAPI, du catalogue de secours et des routines d'agrégation (normalisation des prix, calcul des indicateurs, sélection du meilleur deal).  
2. **Tâche 2 – Interface Next.js** : mise en place de l'app Next 14, pages catalogue/produits/comparateur, composants principaux (ProductCard, OfferTable, SiteFooter) et intégration du client HTTP.  
3. **Tâche 3 – Améliorations continues** : comparaison pré-remplie, meilleur rendu mobile/desktop, correction de l'affichage des images produits, mise à jour de la documentation.

## 🧪 Tests & Qualité

- ESLint et TypeScript garantissent la cohérence du frontend (`npm run lint`).
- L'API s'accompagne de validations runtime et de données de fallback pour un comportement prévisible même sans services externes.

---

💡 Besoin d'intégrer de nouvelles sources ou d'étendre les métriques ? Ajoutez simplement un service dans `services/` et exposez-le via l'API : le frontend consommera automatiquement les champs normalisés.
