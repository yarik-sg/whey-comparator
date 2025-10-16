# Design guidelines FitIdion

Ces recommandations alignent la charte FitIdion avec la structure du code (voir `frontend/src/app/globals.css` et `frontend/src/styles/fitidion-theme.css`). Elles guident la construction des composants présents dans `frontend/src/components` et `frontend/src/components/ui`.

## Palette

| Usage | Couleur | Token CSS | Emplacement |
|-------|---------|-----------|-------------|
| Fond clair | `#F9FAFB` | `--fitidion-light` | `globals.css` → `:root {}` |
| Texte principal | `#111827` | `--fitidion-dark` | `globals.css` & `fitidion-theme.css` |
| Accent primaire | `#FF6600` | `--fitidion-orange` | Utilisé par `button.tsx` (`variant="primary"`) |
| Accent secondaire | `#FDDC8E` | `--fitidion-gold` | Ombres vitrées (cards, CTA) |
| Fond sombre | `#050915` | `data-theme="dark"` | Appliqué via `ThemeProvider.tsx` |

- Les gradients sont déclarés dans `globals.css` (`.bg-fitidion-hero`, `.bg-fitidion-radial`).
- Les surfaces vitrées utilisent `background: rgba(255, 255, 255, 0.85)` + `backdrop-filter: blur(18px)` (voir `fitidion-theme.css`).
- Les ombres `shadow-glass` et `shadow-glow` sont injectées via `tailwind.config.ts` (tokens `boxShadow`).

## Typographie

- **Sans principale** : Poppins (chargée dans `src/app/layout.tsx` via `next/font`).
- **Sans de lecture** : Inter (également dans `layout.tsx`).
- Titres : `text-4xl` desktop (`HeroSection.tsx`), `text-3xl` mobile.
- Sous-titres : `text-xl` avec `font-semibold`.
- Labels & métadonnées : uppercase, `tracking-[0.3em]`, `text-xs` (ex. `StatsSection.tsx`).

## Composants

- **Boutons (`components/ui/button.tsx`)** : variantes `primary` (fond orange), `secondary` (orange 10 %), `ghost` (surfaces vitrées). Toujours `rounded-full` + `shadow-glow`.
- **Inputs (`components/ui/input.tsx`)** : `border-white/50`, focus `ring-2 ring-fitidion-orange/40`.
- **Cartes (`components/ui/card.tsx`)** : `rounded-3xl`, `border-white/20`, transition `hover:shadow-fitidion`.
- **Checkbox/slider** : suivre les classes définies dans `checkbox.tsx` et `slider.tsx` (handles arrondis, accent orange).
- **Sections marketing** : `HeroSection.tsx`, `DealsShowcase.tsx`, `GymLocatorSection.tsx` utilisent Framer Motion (`initial`, `animate`) et doivent rester cohérentes (durée 0.4 s, easing `easeOut`).

## Layout

- Conteneurs : `max-w-6xl` (`page.tsx`) pour la landing, `max-w-5xl` sur les pages listées (`catalogue/page.tsx`, `comparison/page.tsx`).
- Sections majeures : `py-20` → `py-24` avec dégradés légers (`bg-fitidion-radial`) séparant les blocs.
- Hero : gradient `bg-fitidion-hero`, halos radiaux (`after:blur-3xl`), CTA duo (`CompareLinkButton.tsx`, `CreatePriceAlert.tsx`).
- Grilles : `md:grid-cols-2` pour comparaisons, `lg:grid-cols-4` pour statistiques (`StatsSection.tsx`).

## Motion & interaction

- Transitions 200-250 ms (`transition-all`) pour les cartes (`ProductCard.tsx`, `ProgramCard.tsx`).
- Framer Motion (`HeroSection.tsx`, `TestimonialsSection.tsx`) : pattern `initial={{ opacity: 0, y: 32 }}` → `animate={{ opacity: 1, y: 0 }}`.
- Focus visibles systématiques (`focus-visible:ring-2`) grâce à `fitidion-theme.css`.
- Skeletons (`ProductCardSkeleton.tsx`) en `bg-fitidion-orange/10` + `animate-pulse`.

## Contenu & ton

- Positionner FitIdion comme copilote intelligent (`HeroSection.tsx`, `WhyChooseUsSection.tsx`).
- CTA dynamiques : « Lancer FitIdion », « Activer mon alerte », « Ajouter au comparateur » (voir `PriceAlertForm.tsx`, `CompareLinkButton.tsx`).
- Mettre en avant chiffres clés (ex. `StatsSection.tsx` → +900 produits, 70 marques, actualisation 24/7).
- Pour la section « Pourquoi FitIdion » : maximum 4 piliers, format icône (`lucide-react`), titre court, paragraphe ≤ 2 lignes.

---

Respecter ces principes garantit une identité FitIdion homogène entre le frontend (`frontend/`), les docs (`docs/`) et la communication marketing.
