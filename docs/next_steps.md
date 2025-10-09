# Roadmap & prochaines intégrations

Cette liste priorise les évolutions à livrer après la refonte du thème et des sections marketing.

## Intégrations données & scraping

- Connecter les scrapers réels (SerpAPI, APIs marchands propriétaires) au pipeline Celery pour remplacer la simulation actuelle.
- Enrichir les offres avec les informations nutritionnelles (profil acides aminés, labels bio) pour alimenter les fiches produits.
- Ajouter un calcul automatique du coût par portion et du score protéine/€ pour soutenir les analyses comparatives.

## Expérience utilisateur

- Synchroniser le formulaire d'alertes prix avec un service d'e-mailing (Resend/Brevo) et permettre la gestion des préférences.
- Sauvegarder les comparaisons favorites côté client (localStorage + partage par URL) et prévoir une authentification légère.
- Étendre les sections marketing avec des témoignages utilisateurs et un module de FAQ dynamique.

## Fiabilité & observabilité

- Couvrir l'API FastAPI de tests end-to-end (HTTPX) incluant les scénarios d'erreurs et validations.
- Instrumenter l'API et le frontend avec une solution d'observabilité (OpenTelemetry + exporter Jaeger / Sentry pour le front).
- Mettre en place des métriques de scraping (temps moyen, taux de succès) affichées dans le back-office futur.

## Livraison & automatisation

- Finaliser un pipeline CI/CD : lint + tests + build, publication des images Docker (backend/front) sur un registre partagé.
- Ajouter des templates d'issue/PR décrivant les conventions de design et de code.
- Préparer un environnement de staging (Docker Compose ou Kubernetes) pour valider les nouvelles intégrations avant production.
