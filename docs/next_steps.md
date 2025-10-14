# Roadmap FitIdion

## 1. Données & intelligence produit
- Industrialiser les scrapers partenaires (Basic-Fit déployé, étendre à Amazon/MyProtein avec persistance).
- Ajouter le score FitIdion (ratio protéines/prix, label clean, avis moyenne pondérée).
- Enrichir l'historique prix (sources multiples, alertes « plus bas historique », export CSV).
- Synchroniser les alertes prix avec une plateforme d’emailing (Resend/Brevo) + préférences utilisateur.

## 2. Expérience utilisateur
- Sauvegarde de comparaisons et alertes dans un compte FitIdion (SSO léger ou magic link).
- Étendre la page Programmes : filtres objectifs/niveau, favoris, intégration contenus vidéo.
- Version mobile optimisée du Gym Locator (swipe cards, carte Mapbox, actions rapides).

## 3. Observabilité & fiabilité
- Tests end-to-end (Playwright) couvrant comparateur, alertes, programmes et catalogue.
- Instrumentation OpenTelemetry (API + frontend) + export Sentry / Prometheus.
- Tableau de bord de scraping (temps moyen, taux de succès, anomalies par marchand + Basic-Fit healthcheck).

## 4. Livraison continue
- Pipeline CI/CD : lint + tests + build + publication images Docker FitIdion.
- Préparation d’un environnement staging (Docker Compose prod-like ou Kubernetes) avec seeds.
- Templates PR/Issues alignés sur la charte FitIdion (résumé, tests, capture UI).

## 5. Assets brand
- Remplacer les placeholders texte `FitIdionLogoDark.txt`, `FitIdionLogoLight.txt` et `favicon.txt`
  par les fichiers binaires correspondants (`.svg` / `.ico`) directement depuis GitHub une fois la PR fusionnée.
- Mettre à jour `frontend/public/manifest.json` avec les chemins d’icônes finaux après l’upload.

---

🗺️ *L’objectif : faire de FitIdion le copilote fitness de référence en combinant data, design et automation.*
