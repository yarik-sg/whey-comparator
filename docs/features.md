# Fonctionnalités notables

## Comparateur nutrition
- Catalogue multi-sources (SerpAPI, scraper interne) avec normalisation des offres et KPIs (prix/100 g, teneur en protéines).
- Tableaux comparatifs dynamiques avec sélection automatique des produits si aucun ID n’est fourni.
- Alertes prix par e-mail avec stockage local et synchronisation via l’API FastAPI.

## Section « Promos à ne pas manquer »
- Mise en avant des meilleures offres agrégées côté API.
- Cartes promotionnelles responsive (images, prix unitaire, prix total avec livraison, stock).

## Localisateur de salles de sport
- Nouvelle section d’accueil « Trouvez votre salle de sport » (voir `frontend/src/components/GymLocatorSection.tsx`) s’appuyant sur `/api/gyms` via le hook `frontend/src/hooks/useGyms.ts`.
- Cartes responsive (`frontend/src/components/GymCard.tsx`) listant Basic-Fit, Fitness Park, On Air, Neoness, Keepcool… avec adresse complète, distance estimée, temps de trajet et prix mensuel.
- Filtres réactifs : recherche libre « Entrez votre ville », sélecteur de villes disponibles, slider 2–30 km et bouton « Voir toutes les salles proches ».
- Géolocalisation opt-in pour recalculer le rayon autour de l’utilisateur (état visuel success/erreur) et affichage d’un message de rafraîchissement lors des refetch React Query.
- Design fidèle à la charte blanc/orange : badges d’équipements, boutons arrondis, icônes lucide-react (`MapPin`, `MapPinned`, `PiggyBank`).
- Dataset mock et utilitaires prêts pour l’intégration Basic-Fit / Fitness Park / On Air regroupés dans `frontend/src/lib/gymLocator.ts` (calcul Haversine, fallback, normalisation API).

## API FastAPI
- Endpoints `GET /api/gyms` (et alias `/gyms`) avec paramètres `city`, `max_distance_km`, `lat`, `lng`, `limit`.
- Réponse normalisée (`distance_km`, `estimated_duration`, `monthly_price`, `available_cities`) avec bascule automatique sur le dataset mock lorsque l’upstream ne renvoie rien.
- Haversine pour la distance et estimation de durée ≈ 25 km/h.

## Extensibilité
- Les composants Next.js (`GymLocatorSection`, `GymCard`) et le module `gymLocator` sont prêts pour une intégration progressive d’APIs partenaires (Basic-Fit, Fitness Park, On Air…).
- Les types TypeScript partagés (`GymLocation`, `GymLocatorResponse`, `GymQueryFilters`) garantissent la compatibilité entre le frontend et l’API.
