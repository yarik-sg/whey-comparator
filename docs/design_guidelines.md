# Design guidelines FitIdion

Ces recommandations encadrent l'identité visuelle FitIdion (palette, typographie, motions,
composants UI) afin d'assurer une expérience cohérente entre catalogue, comparateur et
communication marketing.

## Palette

| Usage                 | Couleur                          | Token CSS                  |
|-----------------------|----------------------------------|----------------------------|
| Fond clair            | `#F9FAFB`                        | `--fitidion-light`         |
| Texte principal       | `#111827`                        | `--fitidion-dark`          |
| Accent primaire       | `#FF6600`                        | `--fitidion-orange`        |
| Accent secondaire     | `#FDDC8E`                        | `--fitidion-gold`          |
| Fond sombre           | `#050915`                        | `data-theme="dark"`        |

- Utiliser des gradients combinant orange/or et des halos doux (`bg-fitidion-radial`).
- Les overlays vitrées appliquent `background: rgba(255,255,255,0.8)` + `backdrop-filter: blur(18px)`.
- Les cartes « analytics » et CTA utilisent les ombres `shadow-glass` / `shadow-glow` définies dans
  `globals.css`.

## Typographie

- **Sans principale** : Poppins (via `next/font`) — titres, CTA, badges.
- **Sans de lecture** : Inter — paragraphes, textes longs.
- Titles : `text-4xl` sur desktop (Hero), `text-3xl` sur mobile. Sous-titres `text-xl`.
- Labels & métadonnées : uppercase `tracking-[0.3em]`, `text-xs`.
- Toujours utiliser `font-semibold` minimum pour les CTA.

## Composants

- **Boutons** : arrondis (`btn-pill`), variantes `primary` (orange plein), `secondary`
  (orange 10%), `outline` (surfaces vitrées). Ombres `shadow-glow`.
- **Inputs** : bordures translucides `border-white/50`, focus `ring-fitidion-orange/40`.
- **Cartes** : `card-surface` + `rounded-3xl`, transitions `hover:shadow-fitidion`.
- **Badges** : `bg-fitidion-orange/10` + texte orange, uppercase pour les labels.
- **Mode sombre** : classes Tailwind automatiques (`dark:*`).

## Layout

- Conteneurs centraux `max-w-6xl` (landing) ou `max-w-5xl` (pages listées).
- Sections majeures : `py-20` à `py-24`, séparées par légers dégradés.
- Héros : gradient `bg-fitidion-hero`, halos radiaux, call-to-action en duo.
- Grilles : `md:grid-cols-2` pour les comparaisons, `lg:grid-cols-4` pour les stats.

## Motion & interaction

- Transitions 200-250ms (`transition-all`), `scale-105` léger sur hover pour cartes.
- Framer Motion : fade/slide (`initial { opacity: 0, y: 32 }`).
- Focus visible obligatoire (`focus-visible:ring-2` + `ring-offset-fitidion-light`).
- Micro-interactions : shimmer sur skeletons, `animate-pulse` en orange clair.

## Contenu & ton

- Positionner FitIdion comme copilote intelligent (lexique : « analyse », « suivi », « alerte »).
- CTA dynamiques (« Lancer FitIdion », « Suivre cette marque », « Activer mon alerte »).
- Mettre en avant chiffres clés (+900 produits, 70 marques, actualisation 24/7).
- Pour la section « Pourquoi FitIdion » : 3 ou 4 piliers maximum, chacun structuré en icône +
  titre court + paragraphe 2 lignes.

Respecter ces principes garantit une identité FitIdion homogène quelle que soit la surface
(frontend, docs, slides, emails).
