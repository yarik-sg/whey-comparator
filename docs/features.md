# Fonctionnalités clés FitIdion

Cette synthèse relie chaque fonctionnalité aux fichiers front (`frontend/`) et back (`apps/api/`, `main.py`) correspondants.

## 1. Comparateur intelligent

- Résolution multi-sources : `main.py` (`collect_serp_deals`, `collect_scraper_deals`) + micro-service `services/scraper`.
- Calcul du meilleur deal : `main.py` (`mark_best_price`) et `frontend/src/components/PriceComparison.tsx`.
- Comparaison multi-produits : endpoint `GET /comparison` (`main.py`) consommé par `frontend/src/app/comparison/page.tsx`.
- Graphique d'historique : `main.py` (`/products/{id}/price-history`) + `frontend/src/components/PriceHistoryChart.tsx`.
- Mode sombre natif : `frontend/src/components/ThemeProvider.tsx` + tokens `globals.css`.

## 2. Catalogue FitIdion

- Filtres dynamiques : `frontend/src/app/catalogue/page.tsx` (hooks `useProductList`) + endpoint `GET /products` (`main.py`).
- Cartes vitrées : `frontend/src/components/ProductCard.tsx` + classes `fitidion-theme.css`.
- Skeletons : `frontend/src/components/ProductCardSkeleton.tsx`.
- CTA comparateur/alerte : `CompareLinkButton.tsx`, `CreatePriceAlert.tsx`.

## 3. Alertes prix

- Gestion UI : `frontend/src/app/alerts/page.tsx`, `PriceAlertForm.tsx`, `CreatePriceAlert.tsx`.
- Backend : `apps/api/app/routers/price_alerts.py` (CRUD) + `app/tasks.py`/`app/email.py` pour la notification.
- Recherche des alertes : `frontend/src/lib/queries.ts` (`usePriceAlerts`).

## 4. Gym Locator & expérience terrain

- Section landing : `frontend/src/components/GymLocatorSection.tsx`.
- Page dédiée : `frontend/src/app/gyms/page.tsx` + hook `useGyms.ts`.
- Scraper Basic-Fit : `services/gyms_scraper.py` (consommé par `GET /api/gyms` dans `main.py`).

## 5. Programmes dynamiques

- Endpoint `GET /programmes` (`main.py`) alimenté par `data/programmes.json`.
- Page frontend : `frontend/src/app/programmes/page.tsx` + `ProgramCard.tsx`.
- Recherche unifiée : `GET /search` (`main.py`) retourne également les programmes.

## 6. Sections marketing réimaginées

- Hero, Stats, WhyChooseUs, Deals : `HeroSection.tsx`, `StatsSection.tsx`, `WhyChooseUsSection.tsx`, `DealsShowcase.tsx`.
- Animations : `Framer Motion` dans les fichiers précités (pattern `initial`/`animate`).
- Partenaires & témoignages : `PartnerLogos.tsx`, `TestimonialsSection.tsx`.

## 7. API & data layer

- CRUD principal : `apps/api/app/routers/*.py` (produits, offres, fournisseurs, alertes).
- Agrégation temps réel : `main.py` (`/products`, `/compare`, `/comparison`, `/search`).
- Webhooks : `main.py` (`/webhooks/*`) + `services/scraper`.
- Fallbacks : `fallback_catalogue.py` + `frontend/src/lib/fallbackCatalogue.ts`.

---

🚀 *FitIdion conjugue collecte de données, design premium et personnalisation pour guider les sportifs vers les meilleurs choix.*
