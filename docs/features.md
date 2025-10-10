# Fonctionnalités notables

## Comparateur nutrition
- Catalogue multi-sources (SerpAPI, scraper interne) avec normalisation des offres et KPIs (prix/100 g, teneur en protéines).
- Tableaux comparatifs dynamiques avec sélection automatique des produits si aucun ID n’est fourni.
- Alertes prix par e-mail avec stockage local et synchronisation via l’API FastAPI.

## Section « Promos à ne pas manquer »
- Mise en avant des meilleures offres agrégées côté API.
- Cartes promotionnelles responsive (images, prix unitaire, prix total avec livraison, stock).

## Localisateur de salles de sport
- Nouvelle section d’accueil « Trouvez votre salle de sport » utilisant `/api/gyms`.
- Affichage en grille des clubs Basic-Fit, Fitness Park, On Air, Neoness, Keepcool, etc. avec distance estimée, adresse complète et prix mensuel.
- Filtres réactifs par ville ou rayon (slider 2–30 km) et recherche libre « Entrez votre ville ».
- Bouton « Voir toutes les salles proches » pour élargir la sélection et état vide contextualisé.
- Géolocalisation opt-in (utiliser ma position) exploitant `navigator.geolocation` pour recalculer les distances via l’API.
- Cartes au design blanc/orange, badges d’équipements, icônes SVG inspirées de lucide.
- Fallback mocké : `src/lib/gymLocator.js` fournit un dataset embarqué prêt à être remplacé par les APIs Basic-Fit / Fitness Park / On Air.

## API FastAPI
- Endpoint `GET /gyms` avec paramètres `city`, `max_distance_km`, `lat`, `lng`, `limit`.
- Réponse normalisée (`distance_km`, `estimated_duration`, `monthly_price`, `available_cities`, `meta.providers_ready`).
- Haversine pour la distance et estimation de durée ≈ 25 km/h.

## Extensibilité
- Les composants (`GymLocatorSection`, `GymCard`) et le module `gymLocator` sont prêts pour une intégration progressive d’APIs partenaires.
- Les types `.d.ts` assurent la compatibilité TypeScript malgré l’utilisation de fichiers `.js/.jsx`.
