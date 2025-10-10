# 🧬 Whey Comparator

Comparateur multi-sources pour les compléments alimentaires (whey, créatine, etc.). Le projet regroupe une API **FastAPI** qui agrège des offres SerpAPI/scraper et une interface **Next.js 15** (React 19) optimisée pour consulter, comparer et analyser les prix.

## ✨ Fonctionnalités clés

- **Catalogue unifié** : liste des produits enrichie (prix, disponibilité, notation, rapport protéines/€) avec sélection automatique de la meilleure offre.
- **Comparateur multi-produits** : page dédiée permettant de juxtaposer plusieurs références, d'afficher un résumé des meilleurs prix et d'accéder rapidement aux marchands (avec pré-sélection automatique si aucun ID n'est fourni).
- **Page produit enrichie** : fiches détaillées affichant carrousel média, tableau d'offres, historique de prix, avis, flux de collecte et recommandations similaires avec bascule automatique sur les données fallback si l'API principale échoue.
- **Historique et fallback** : données de secours embarquées lorsque le scraper est indisponible, avec génération d'images réalistes, normalisation automatique des URLs distantes et fusion intelligente des réponses pour le comparateur et les pages produit.
- **Front moderne** : composants Tailwind réutilisables, mode sombre natif, navigation fluide entre catalogue, promotions et comparateur.
- **Localisateur de salles de sport** : section d’accueil « Trouvez votre salle de sport » (`frontend/src/components/GymLocatorSection.tsx`) affichant les clubs Basic-Fit, Fitness Park, On Air, Neoness, etc. à proximité, avec filtrage par ville/rayon, géolocalisation, bouton « Voir toutes les salles proches » et fallback mock (`frontend/src/lib/gymLocator.ts`).

## 🏗️ Architecture du dépôt

```
whey-comparator/
├── main.py                  # API FastAPI (agrégation, normalisation, comparaison)
├── fallback_catalogue.py    # Données de secours utilisées par l'API
├── services/                # Intégrations externes et utilitaires scraping
├── frontend/                # Application Next.js 14 (app router)
│   ├── Dockerfile           # Image de développement Next.js (Turbopack)
│   ├── src/app/             # Pages (catalogue, comparaison, produits…)
│   ├── src/components/      # UI (ProductCard, OfferTable, etc.)
│   └── src/lib/             # Client HTTP, helpers
├── apps/api/                # API complète avec Poetry, SQLAlchemy, Celery
├── docs/                    # Documentation annexe
└── docker-compose.yml       # Orchestration locale API + frontend + services
```

## 🚀 Mise en route

### Option 1 · Docker Compose (recommandé)

1. Assurez-vous d'avoir Docker et Docker Compose installés.
2. Lancez l'ensemble des services :

   ```bash
   docker compose up --build
   ```

   Cette commande démarre PostgreSQL, Redis, l'API FastAPI (avec rechargement), le worker Celery et le frontend Next.js (hot reload). Les volumes nommés conservent la base de données et les dépendances Node.

3. Accédez aux services :
   - API : [http://localhost:8000](http://localhost:8000) (`/docs` pour Swagger).
   - Frontend : [http://localhost:3000](http://localhost:3000).

4. Arrêt et nettoyage :

   ```bash
   docker compose down
   # Pour réinitialiser complètement (DB + dépendances)
   docker compose down -v
   ```

Les variables nécessaires (`API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, etc.) sont injectées automatiquement par `docker-compose.yml` pour relier l'interface à l'API.

### Option 2 · Lancer les services manuellement

#### Prérequis

- Python 3.11+
- Node.js 18+
- npm 9+ ou pnpm/yarn (adapter les commandes si besoin)

#### Lancer l'API FastAPI (mode standalone)

```bash
python -m venv .venv
source .venv/bin/activate  # sous Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Variables utiles :

- `SERPAPI_KEY` : clé API SerpAPI (une valeur de développement est fournie par défaut).
- `SCRAPER_BASE_URL` : URL du service scraper (défaut `http://localhost:8001`).

#### Lancer le backend complet (apps/api)

```bash
cd apps/api
poetry install
poetry run uvicorn app.main:app --reload
```

Les variables `API_DATABASE_URL`, `API_CELERY_BROKER_URL` et `API_CELERY_RESULT_BACKEND` acceptent les mêmes valeurs que dans `docker-compose.yml`.

#### Lancer le frontend Next.js

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000). Pour lier le backend conteneurisé, définissez `API_BASE_URL=http://api:8000` (ou utilisez le proxy `/api/proxy`).

### Scripts utiles

| Commande                       | Description                                                |
|--------------------------------|------------------------------------------------------------|
| `docker compose up --build`    | Démarre la stack complète (DB, Redis, API, worker, front). |
| `docker compose logs -f api`   | Suit les logs de l'API FastAPI conteneurisée.              |
| `npm run lint`                 | Analyse TypeScript/ESLint.                                |
| `npm run build`                | Génère la version production de l'interface.              |
| `npm run preview`              | Sert l'app Next.js buildée.                               |
| `uvicorn main:app --reload`    | Démarre l'API standalone avec rechargement à chaud.       |

## 🔍 Historique des actions réalisées

1. **Tâche 1 – Fondations backend** : création de l'API FastAPI, du catalogue de secours et des routines d'agrégation (normalisation des prix, calcul des indicateurs, sélection du meilleur deal).
2. **Tâche 2 – Interface Next.js** : mise en place de l'app Next 14, pages catalogue/produits/comparateur, composants principaux (ProductCard, OfferTable, SiteFooter) et intégration du client HTTP.
3. **Tâche 3 – Améliorations continues** : comparaison pré-remplie, meilleur rendu mobile/desktop, correction de l'affichage des images produits, mise à jour de la documentation.
4. **Tâche 4 – Orchestration Docker** : ajout des images frontend/backend, configuration Compose (DB, Redis, API, worker) et documentation associée.
5. **Tâche 5 – Fiabilisation pages produit & comparateur** : refonte de la page produit (carrousel, offre vedette, historique, avis, recommandations, flux de données), appels API `/products/{id}/offers|similar|price-history` robustes et fusion des réponses fallback pour la comparaison multi-produits.

## 🧪 Tests & Qualité

- ESLint et TypeScript garantissent la cohérence du frontend (`npm run lint`).
- L'API s'accompagne de validations runtime et de données de fallback pour un comportement prévisible même sans services externes.
- Docker Compose facilite le lancement d'un environnement complet pour tester l'intégration bout en bout.

---

💡 Besoin d'intégrer de nouvelles sources ou d'étendre les métriques ? Ajoutez simplement un service dans `services/` et exposez-le via l'API : le frontend consommera automatiquement les champs normalisés.
