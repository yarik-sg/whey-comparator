# Fonctionnalités clés FitIdion

## 1. Comparateur intelligent
- Résolution multi-sources (scrapers internes + SerpAPI) avec normalisation des offres.
- Calcul automatique du meilleur deal (prix total, livraison, ratio protéines/prix).
- Comparaison multi-produits : pré-sélection, scores nutritionnels, historique de prix.
- Mode sombre natif et badges FitIdion pour mettre en avant les alertes actives.
- Graphique d'historique (Recharts) basé sur les 30 derniers relevés stockés en base ou via fallback,
  avec statistiques (min/max/moyenne/tendance) injectées par l'API.

## 2. Catalogue FitIdion
- Filtres dynamiques (marques, catégories, prix, disponibilité, objectifs nutrition).
- Cartes vitrées `card-surface` avec surbrillance FitIdion (`bg-orange-50` → `bg-fitidion-orange/10`).
- Skeletons oranges doux pour les chargements (`animate-pulse`).
- CTA « Ajouter au comparateur » et « Activer l’alerte » directement accessibles.

## 3. Alertes prix FitIdion
- Interface dédiée (`/alerts`) avec recherche email, statut actif/inactif, actions rapides.
- Notifications gérées par l’API (FastAPI + Celery) et suivies côté frontend (TanStack Query).
- Expérience visuelle sombre/néon pour mettre en avant l’aspect monitoring 24/7.

## 4. Gym Locator & expériences terrain
- Section d’accueil immersive : cartes vitrées, halos FitIdion, CTA « Découvrir autour de moi ».
- Filtres rayon + ville + recherche libre, géolocalisation opt-in.
- Cartes `GymCard` revisitées avec boutons FitIdion et badges équipements.
- Connecteur Basic-Fit temps réel (`services/gyms_scraper.py`) consommé par `/gyms` pour alimenter les
  listings live et la recherche unifiée.

## 5. Programmes dynamiques
- Page `/programmes` Next.js branchée sur `GET /programmes` (JSON partagé `data/programmes.json`).
- Cartes responsive avec icône Dumbbell, durée, niveau et objectif.
- Section programmes intégrée à la recherche globale (`/search`) afin de proposer des routines en plus des
  produits et salles.

## 6. Sections marketing réimaginées
- `HeroSection` : gradient FitIdion, CTA duo, suggestions de recherche en pilules.
- `StatsSection`, `WhyChooseUsSection`, `PartnerLogos` : typographie Poppins, badges uppercase,
  animations Framer Motion et ombres FitIdion.
- `DealsShowcase` : cartes stackées, bandeau highlight FitIdion, CTA comparateur.

## 7. API & data layer
- Endpoints agrégés : catalogue, comparateur, fiches produit, alertes prix, gyms.
- Webhooks (refresh produits/offres/alertes) sécurisés par signature FitIdion.
- Historique de prix persisté (SQL + fallback JSON) exposé sous forme de points + statistiques.
- Fallback catalogue synchronisé front/back pour résilience offline.

---

🚀 *FitIdion combine data, design et personnalisation pour guider les sportifs vers les meilleurs choix.*
