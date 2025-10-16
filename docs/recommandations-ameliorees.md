# Recommandations stratégiques FitIdion

Objectif : dépasser les comparateurs historiques en combinant intelligence des données, expérience utilisateur premium et confiance.

## 1. Fiabilité & performance

- **Cache & résilience** : activer Redis sur `apps/api` (`app/celery_app.py`, `app/tasks.py`) pour `/products`, `/comparison`, `/alerts` avec fallback `fallback_catalogue.py`.
- **Pipelines scraping** : orchestrer la collecte via `services/scraper/scheduler.py` (priorisation par popularité, monitoring Prometheus, alertes Slack).
- **Alertes industrialisées** : stocker les seuils dans Postgres (`PriceAlert`), traiter via Celery (`app/tasks.py`), exposer l’historique dans `/price-alerts` (`routers/price_alerts.py`).

## 2. Expérience FitIdion

- **Badges dynamiques** : enrichir `PriceComparison.tsx` et `ProductCard.tsx` avec indicateurs (« -12 % vs 30 jours ») calculés côté backend (`main.py`).
- **Comparateur augmenté** : ajouter un module `Palmarès FitIdion` dans `frontend/src/app/comparison/page.tsx` (meilleur prix, score nutrition, fiabilité vendeur).
- **Catalogue mémorisé** : persister filtres/sélections dans `frontend/src/app/catalogue/page.tsx` (URL + `localStorage`).
- **Guides FitIdion** : alimenter un carrousel de guides (nouveau composant dans `frontend/src/components`) connectés à `docs/`.

## 3. Data & différenciation

- **Score FitIdion** : calcul dans `apps/api/app/models.py`/`schemas.py`, affichage dans `ProductCard.tsx` et `PriceComparison.tsx`.
- **Analyse livraison** : enrichir `Offer` (ajouter frais/délais), exposer via `GET /offers` et `main.py`, afficher graphiques dans `frontend/src/components/OfferTable.tsx`.
- **Avis agrégés** : centraliser dans `main.py` (`/products/{id}/reviews`) et surfaces `ReviewsSection.tsx`.
- **Flux de données** : ajouter un composant `DataStatus` (frontend) affichant heure de collecte (données `services/scraper`, `apps/api/app/tasks.py`).

## 4. KPI & succès

- SLA API > 99 % (observabilité `apps/api/app/main.py`, `docker-compose.yml`).
- Temps de réponse `/products` < 500 ms p95 (monitoring Prometheus + traces `X-Request-ID`).
- +20 % de clics comparateur après introduction du Palmarès FitIdion.
- ≥30 % des utilisateurs d’alertes reviennent via un email FitIdion (`app/email.py`).
- Adoption du mode sombre > 40 % (`ThemeProvider.tsx`).

---

🎯 *FitIdion doit être perçu comme un copilote fitness fiable, inspirant et obsédé par la donnée.*
