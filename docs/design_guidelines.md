# Design guidelines — Thème Whey Comparator

Ces directives résument les choix graphiques appliqués à la refonte UI (thème lumineux, nouvelles sections marketing, comparateur modernisé).

## Palette & couleurs

- **Fond principal** : `#f8fafc` (`--background`), utilisé pour les pages et les sections neutres.
- **Texte principal** : `#0f172a` (`--foreground`), garantit une lisibilité élevée sur fond clair.
- **Accent primaire** : `#f97316` (`--accent`) et sa déclinaison douce `#f59e0b` (`--accent-soft`) pour CTA, badges et highlights.
- **Dégradés** : sections héro utilisent un gradient `from-orange-50 via-white to-white` complété d'auras `bg-orange-200/30`.
- **État focus** : anneaux Tailwind `ring-orange-200` / `ring-orange-300` pour cohérence avec l'accent.

## Typographie

- **Police de base** : Inter (`--font-inter`), taille confortable (`text-base`), line-height généreuse pour la lecture des paragraphes.
- **Police display** : Poppins (`--font-poppins`, graisses 400 à 700) pour titres et accroches.
- **Hiérarchie** : titres en `text-4xl`+ sur desktop, `text-3xl` sur mobile ; sous-titres `text-lg`/`text-xl`, métadonnées `text-xs` uppercase.

## Layout & grille

- **Largeurs** : conteneurs centrés `max-w-5xl` / `max-w-7xl` selon les sections, marges latérales `px-4` → `px-8`.
- **Sections** : espacement vertical généreux (`py-20` à `py-24`) pour rythmer la landing (Hero, catégories, deals, stats, partenaires, pourquoi nous, alertes prix).
- **Cartes** : coins arrondis (`rounded-3xl`/`rounded-2xl`), ombres légères (`shadow-xl shadow-orange-100/60`) et effets de blur pour la profondeur.
- **Formulaires** : inputs arrondis (`rounded-full`), bordures translucides (`border-orange-200/70`), CTA plein en accent et variantes ghost/outlines.

## Iconographie & visuels

- **Icônes** : pack `lucide-react` (stroke 1.5), taille standard `h-5 w-5`.
- **Logos partenaires** : alignement horizontal, teintes neutralisées (`opacity-80`) pour ne pas voler la vedette au contenu.
- **Graphiques** : `recharts` avec couleurs alignées sur la palette (accent pour la série principale, gris/bleu pour les références).

## Motion & interactions

- **Framer Motion** : fade-in + translate Y (`initial { opacity: 0, y: 32 }`) pour les sections critiques (Hero, stats) afin de donner du rythme.
- **Hover states** : transitions douces (`transition` Tailwind) sur boutons, cartes et badges (changement de couleur + légère élévation).
- **Focus visible** : `focus-visible:outline-none` couplé à `focus-visible:ring-2` sur boutons/inputs pour accessibilité.

## Bonnes pratiques de contenu

- **Messages clés** : insistence sur la proposition de valeur (comparateur intelligent, suivi des prix 24/7, +900 produits).
- **CTA** : verbes d'action (« Lancer le comparateur », « Voir les promotions », « Activer les alertes ») placés en paires pour orienter l'utilisateur.
- **Section « Pourquoi nous »** : 3 à 4 piliers maximum, chacun avec icône, titre court, paragraphe concis.
- **Formulaire d'alertes** : validations claires, feedback via aria-live, possibilité d'expliquer l'avantage (notifications prix personnalisées).

Respecter ces lignes directrices garantit la cohérence du nouveau thème et facilite l'intégration de futures sections.
