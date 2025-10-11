# Fonctionnalités clés FitIdion

## 1. Comparateur intelligent
- Résolution multi-sources (scrapers internes + SerpAPI) avec normalisation des offres.
- Calcul automatique du meilleur deal (prix total, livraison, ratio protéines/prix).
- Comparaison multi-produits : pré-sélection, scores nutritionnels, historique de prix.
- Mode sombre natif et badges FitIdion pour mettre en avant les alertes actives.

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
- Dataset fallback `gymLocator.ts` prêt pour connecteurs Basic-Fit / Fitness Park / On Air.

## 5. Sections marketing réimaginées
- `HeroSection` : gradient FitIdion, CTA duo, suggestions de recherche en pilules.
- `StatsSection`, `WhyChooseUsSection`, `PartnerLogos` : typographie Poppins, badges uppercase,
  animations Framer Motion et ombres FitIdion.
- `DealsShowcase` : cartes stackées, bandeau highlight FitIdion, CTA comparateur.

## 6. API & data layer
- Endpoints agrégés : catalogue, comparateur, fiches produit, alertes prix, gyms.
- Webhooks (refresh produits/offres/alertes) sécurisés par signature FitIdion.
- Fallback catalogue synchronisé front/back pour résilience offline.

---

🚀 *FitIdion combine data, design et personnalisation pour guider les sportifs vers les meilleurs choix.*
