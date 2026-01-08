# Rapport de build — FitIdion

## Contexte
- Dernière mise à jour : 8 janvier 2026
- Objectif : valider le build Next.js et FastAPI pour déploiement Vercel/Render.

## Résultats du build

### Frontend (Next.js)
| Commande | Résultat |
| --- | --- |
| `npm install --prefix frontend` | ✅ Succès |
| `npm run build --prefix frontend` | ✅ Succès (28 pages générées) |

### Backend (FastAPI)
| Commande | Résultat |
| --- | --- |
| `pip install -r requirements.txt` | ✅ Succès |
| `uvicorn main:app --port 8000` | ✅ Succès |

## Configuration de déploiement

### Vercel (Frontend)
- **Build Command** : `npm run build`
- **Output Directory** : `.next`
- **Install Command** : `npm ci`
- **Root Directory** : `frontend`
- **Variables d'environnement** :
  - `NEXT_PUBLIC_API_BASE_URL` : URL de l'API Render
  - `NEXT_PUBLIC_SITE_URL` : URL du site Vercel
  - `SERPAPI_KEY` : Clé API SerpAPI (optionnel)

### Render (Backend)
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Root Directory** : racine du repo
- **Variables d'environnement** :
  - `SERPAPI_KEY` : Clé API SerpAPI
  - `API_CACHE_TTL_SECONDS` : 120
  - `FORCE_IMAGE_HTTPS` : true

## Fichiers de configuration
- `render.yaml` : Blueprint Render pour le backend
- `frontend/vercel.json` : Configuration Vercel pour le frontend
- `frontend/.env.example` : Template des variables d'environnement

## Statut
- ✅ Build frontend validé
- ✅ Backend FastAPI fonctionnel
- ✅ Configurations de déploiement prêtes
