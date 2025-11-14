# FitIdion

Comparateur fitness nouvelle génération combinant une application Next.js 15 (App Router) et une API FastAPI. FitIdion agrège les offres SerpAPI, ScraperAPI et les scrapers internes pour proposer un comparateur temps réel, un catalogue enrichi et un annuaire de salles.

## Sommaire
1. [Fonctionnalités](#fonctionnalités)
2. [Architecture rapide](#architecture-rapide)
3. [Installation & exécution](#installation--exécution)
4. [Commandes utiles](#commandes-utiles)
5. [Guides développeur](#guides-développeur)
6. [Documentation détaillée](#documentation-détaillée)
7. [Changelog](#changelog)

## Fonctionnalités
- Comparateur intelligent (`/comparateur`, `/compare`, `/comparison`) avec historique de prix et agrégation multi-marchands.
- Catalogue produits filtrable (prix, marque, catégorie, ratio protéine/€) alimenté par `GET /products`.
- Annuaire de salles (`/gyms`, `/api/gyms`) connecté aux scrapers Basic-Fit, Fitness Park, Neoness, On Air.
- Programmes d'entraînement (`/programmes`), centre légal, favoris et dashboard.
- API unifiée (`/search`) pour alimenter la recherche globale.

## Architecture rapide
```
Next.js (frontend/) ──► FastAPI (main.py) ──► Services Python (SerpAPI, ScraperAPI, scrapers) ──► Données/fallbacks
                             │
                             └──► Backend complet apps/api (SQLAlchemy + Celery)
```
- Architecture détaillée : `docs/ARCHITECTURE.md`
- Flux comparateur : `docs/PRODUCT_COMPARE_FLOW.md`

## Installation & exécution
### Prérequis
- Node.js ≥ 20 (npm, pnpm ou yarn au choix).
- Python 3.11+.
- (Optionnel) Docker 24+ si vous utilisez `docker-compose.yml`.
- (Optionnel) PostgreSQL + Redis pour `apps/api`.

### Option A — Docker Compose
```bash
git clone https://github.com/<org>/fitidion.git
cd fitidion
docker compose up --build
```
- Frontend : http://localhost:3000
- API FastAPI : http://localhost:8000 (`/docs` pour l'OpenAPI)

Arrêt : `docker compose down` (ajoutez `-v` pour purger les volumes).

### Option B — Installation manuelle
1. **Frontend**
   ```bash
   npm install --prefix frontend
   cp frontend/.env.local.example frontend/.env.local  # créez-le si besoin
   ```
   Variables à définir dans `frontend/.env.local` :
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

   Lancer le serveur :
   ```bash
   npm run dev --prefix frontend
   ```

2. **API FastAPI légère (`main.py`)**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
   Variables clés : `SERPAPI_KEY`, `SCRAPERAPI_KEY`, `SCRAPER_BASE_URL`, `FORCE_IMAGE_HTTPS`.

3. **Backend complet (`apps/api`)**
   ```bash
   cd apps/api
   poetry install
   poetry run uvicorn app.main:app --reload --port 8100
   ```
   Services optionnels :
   ```bash
   poetry run celery -A app.celery_app worker -l info
   poetry run python -m app.scheduler
   ```

## Commandes utiles
```bash
# Lancer le lint frontend
npm run lint --prefix frontend

# Construire le frontend
npm run build --prefix frontend

# Mettre à jour les dépendances backend léger
pip install -r requirements.txt --upgrade

# Exécuter les tests unitaires apps/api
cd apps/api && poetry run pytest
```

## Guides développeur
- **Conventions TypeScript/React** :
  - Préfixez les fichiers client par `"use client"` et utilisez `@tanstack/react-query` pour les données paginées.
  - Les types partagés vivent dans `frontend/src/types/api.ts`. Étendez-les plutôt que de créer de nouveaux objets non typés.
- **Conventions FastAPI** :
  - Les endpoints publics doivent conserver les champs camelCase historiques (compatibilité SPA).
  - Documentez toute nouvelle variable d'environnement dans ce README + `docs/BACKEND.md`.
- **Intégrations externes** :
  - Suivez le guide d'ajout de fournisseur dans `docs/BACKEND.md` et `docs/PRODUCT_COMPARE_FLOW.md` (SerpAPI/ScraperAPI, scrapers internes).
- **Legacy support** : tant que la page `/comparateur` n'est pas migrée, le flag `legacy=true` doit rester opérationnel sur `/compare`.

## Documentation détaillée
| Sujet | Fichier |
|-------|--------|
| Rapport d'audit / problèmes ouverts | `docs/AUDIT_REPORT.md` |
| Architecture & schéma de données | `docs/ARCHITECTURE.md` |
| Backend & API FastAPI | `docs/BACKEND.md` |
| Frontend & conventions | `docs/FRONTEND.md` |
| Référence complète des endpoints | `docs/API_REFERENCE.md` |
| Flux comparateur + services externes | `docs/PRODUCT_COMPARE_FLOW.md` |

## Changelog
Consultez `CHANGELOG.md` pour suivre les évolutions (mise à jour dans ce commit avec la refonte documentaire).
