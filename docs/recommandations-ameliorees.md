# Recommandations stratégiques FitIdion

Objectif : dépasser les comparateurs historiques en combinant intelligence des données,
expérience utilisateur premium et confiance.

## 1. Fiabilité & performance
- **Cache & résilience** : activer Redis pour `/products`, `/comparison`, `/alerts` et conserver le
  dernier snapshot sain en cas de panne scraping.
- **Pipelines scraping** : orchestrer la collecte via Celery (priorisation par popularité, monitoring
  Prometheus, alerts Slack quand un marchand décroche).
- **Alertes industrialisées** : stocker les seuils dans Postgres, traiter via worker (envoi email/sms),
  exposer historique des notifications dans `/alerts`.

## 2. Expérience FitIdion
- **Badge dynamique** sur les fiches produit (« -12 % vs 30 jours », « Prix stable ») pour donner du contexte.
- **Comparateur augmenté** : section « Palmarès FitIdion » (meilleur prix, score nutrition, fiabilité
  vendeur) + export partageable.
- **Catalogue mémorisé** : conserver filtres/sélections en localStorage et proposer un bouton « Copier mon setup FitIdion ».
- **Guides FitIdion** : ajouter sur la landing des guides rapides (formats Whey, usage créatine, etc.) en carrousel.

## 3. Data & différenciation
- **Score FitIdion** : calculer un indicateur synthétique (nutrition, transparence, avis) et l'afficher
  dans le comparateur + fiches.
- **Analyse livraison** : stocker frais d'expédition + délais estimés, proposer un graphe comparatif.
- **Avis agrégés** : combiner avis SerpAPI/Amazon et mettre en avant top positif/négatif.
- **Flux de données** : afficher clairement l'heure de dernière collecte par source, statut (OK, retard, en
  échec) et prochain refresh.

## 4. KPI & succès
- SLA API > 99 % grâce au cache/fallback.
- Temps de réponse `/products` < 500 ms p95.
- +20 % de clics vers le comparateur après introduction du palmarès FitIdion.
- ≥30 % des utilisateurs d’alertes reviennent via un email FitIdion.
- Adoption du mode sombre > 40 % (cible noctambules / crossfit).

---

🎯 *FitIdion doit être perçu comme un copilote fitness fiable, inspirant et obsédé par la donnée.*
