# Roadmap FitIdion

Cette feuille de route s'appuie sur l'architecture décrite dans `docs/architecture.md` et les modules existants.

## 1. Données & intelligence produit

- Industrialiser les scrapers partenaires (`services/scraper/collectors`) avec persistance Postgres (`apps/api/app/models.py`).
- Ajouter un score FitIdion calculé côté backend (`apps/api/app/schemas.py`) et exposé via `GET /products`.
- Enrichir l'historique prix (`apps/api/app/routers/products.py` + `main.py`) avec sources multiples et export CSV.
- Synchroniser les alertes avec une plateforme emailing (ex. intégrer Resend dans `app/email.py`).

## 2. Expérience utilisateur

- Sauvegarder comparaisons & alertes côté utilisateur (future auth `frontend/src/app/account`, liaison `apps/api`).
- Étendre la page Programmes (`frontend/src/app/programmes/page.tsx`) avec filtres (objectifs/niveau) et favoris stockés via `localStorage`.
- Optimiser le Gym Locator mobile (`frontend/src/app/gyms/page.tsx`) avec carte interactive (Mapbox) et actions rapides.

## 3. Observabilité & fiabilité

- Tests end-to-end (Playwright) couvrant comparateur, alertes, programmes, catalogue (`frontend/` + `apps/api`).
- Instrumentation OpenTelemetry (`apps/api/app/main.py`, `frontend/src/lib/apiClient.ts`) + export Sentry / Prometheus.
- Dashboard scraping : métriques Celery (`app/tasks.py`), temps moyen, taux de succès, statut Basic-Fit (`services/gyms_scraper.py`).

## 4. Livraison continue

- Pipeline CI/CD : lint (`npm run lint`, `poetry run pytest`), build, publication d'images Docker (`docker-compose.yml`).
- Environnement staging (Docker Compose prod-like ou Kubernetes) avec seeds (`data/`, `apps/api/alembic`).
- Templates PR/Issues alignés sur la charte (`docs/design_guidelines.md`, `docs/features.md`).

## 5. Assets brand

- Remplacer les placeholders `frontend/public/` (`FitIdionLogo*.txt`, `favicon.txt`) par les assets finaux `.svg`/`.ico`.
- Mettre à jour `frontend/public/manifest.json` après l'upload (icônes, couleurs thème).

---

🗺️ *Objectif : faire de FitIdion le copilote fitness de référence en combinant data, design et automation.*
