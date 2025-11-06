import { getFallbackProductSummaries } from "@/lib/fallbackCatalogue";
import type { ProductSummary } from "@/types/api";

export interface ProgramInteraction {
  id: string;
  objectif?: string | null;
  focus?: string | null;
}

export interface RecommendationContext {
  favoriteProducts?: ProductSummary[];
  priceTrackedProducts?: ProductSummary[];
  consultedPrograms?: ProgramInteraction[];
}

export interface RecommendationOptions {
  limit?: number;
  candidateProducts?: ProductSummary[];
  popularProducts?: ProductSummary[];
}

export interface RecommendationResult {
  items: ProductSummary[];
  usedFallback: boolean;
}

const DEFAULT_LIMIT = 6;

const PROGRAM_CATEGORY_HINTS: Record<string, string[]> = {
  "prise de masse": ["whey-protein", "mass-gainer", "casein"],
  "sèche": ["fat-burner", "bcaa", "isolate"],
  "full body": ["bcaa", "pre-workout", "multivitamin"],
};

interface PreferenceProfile {
  brandWeights: Map<string, number>;
  categoryWeights: Map<string, number>;
  hasInteractions: boolean;
}

function normalizeText(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.toLowerCase();
}

function addWeight(target: Map<string, number>, key: string | null | undefined, weight: number) {
  const normalized = normalizeText(key);
  if (!normalized || !Number.isFinite(weight) || weight <= 0) {
    return;
  }

  target.set(normalized, (target.get(normalized) ?? 0) + weight);
}

function buildPreferenceProfile(context: RecommendationContext): PreferenceProfile {
  const brandWeights = new Map<string, number>();
  const categoryWeights = new Map<string, number>();

  context.favoriteProducts?.forEach((product) => {
    addWeight(brandWeights, product.brand, 3);
    addWeight(categoryWeights, product.category, 3);
  });

  context.priceTrackedProducts?.forEach((product) => {
    addWeight(brandWeights, product.brand, 2);
    addWeight(categoryWeights, product.category, 2);
  });

  context.consultedPrograms?.forEach((program) => {
    const normalizedObjective = normalizeText(program.objectif ?? program.focus ?? null);
    if (!normalizedObjective) {
      return;
    }

    const hintedCategories = PROGRAM_CATEGORY_HINTS[normalizedObjective];
    if (!hintedCategories) {
      return;
    }

    hintedCategories.forEach((category) => addWeight(categoryWeights, category, 1));
  });

  const hasInteractions =
    brandWeights.size > 0 || categoryWeights.size > 0 || (context.consultedPrograms?.length ?? 0) > 0;

  return {
    brandWeights,
    categoryWeights,
    hasInteractions,
  };
}

function getProductKey(product: ProductSummary): string {
  const identifiers: Array<string | number | undefined | null> = [
    product.id,
    product.product_id,
    product.bestDeal?.productId,
    product.name,
  ];

  for (const identifier of identifiers) {
    if (identifier === undefined || identifier === null) {
      continue;
    }

    return String(identifier);
  }

  return `${product.brand ?? "produit"}-${product.name}`;
}

function getMaxValue(weights: Map<string, number>): number {
  let max = 0;
  weights.forEach((value) => {
    if (value > max) {
      max = value;
    }
  });
  return max;
}

function computeScore(
  product: ProductSummary,
  brandWeights: Map<string, number>,
  categoryWeights: Map<string, number>,
): { score: number; matchesPreference: boolean } {
  const normalizedBrand = normalizeText(product.brand);
  const normalizedCategory = normalizeText(product.category);

  const rawBrandWeight = normalizedBrand ? brandWeights.get(normalizedBrand) ?? 0 : 0;
  const rawCategoryWeight = normalizedCategory ? categoryWeights.get(normalizedCategory) ?? 0 : 0;

  const maxBrand = getMaxValue(brandWeights) || 1;
  const maxCategory = getMaxValue(categoryWeights) || 1;

  const brandScore = maxBrand > 0 ? (rawBrandWeight / maxBrand) * 0.6 : 0;
  const categoryScore = maxCategory > 0 ? (rawCategoryWeight / maxCategory) * 0.3 : 0;

  let ratingScore = 0;
  if (typeof product.rating === "number" && Number.isFinite(product.rating)) {
    const normalizedRating = Math.max(0, Math.min(product.rating, 5));
    ratingScore = (normalizedRating / 5) * 0.08;
  }

  let discountScore = 0;
  if (typeof product.discount === "number" && Number.isFinite(product.discount) && product.discount > 0) {
    discountScore = 0.02;
  }

  const score = brandScore + categoryScore + ratingScore + discountScore;
  const matchesPreference = rawBrandWeight > 0 || rawCategoryWeight > 0;

  return { score, matchesPreference };
}

function rankProducts(
  candidates: ProductSummary[],
  preferences: PreferenceProfile,
  excluded: Set<string>,
  limit: number,
): ProductSummary[] {
  const { brandWeights, categoryWeights, hasInteractions } = preferences;
  const seen = new Set<string>();
  const scored: Array<{ product: ProductSummary; score: number }> = [];

  candidates.forEach((product) => {
    const key = getProductKey(product);
    if (seen.has(key) || excluded.has(key)) {
      return;
    }

    const { score, matchesPreference } = computeScore(product, brandWeights, categoryWeights);

    if (hasInteractions && !matchesPreference) {
      return;
    }

    seen.add(key);
    scored.push({ product, score });
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const brandA = normalizeText(a.product.brand) ?? "";
    const brandB = normalizeText(b.product.brand) ?? "";
    if (brandA !== brandB) {
      return brandA.localeCompare(brandB, "fr", { sensitivity: "base" });
    }

    return a.product.name.localeCompare(b.product.name, "fr", { sensitivity: "base" });
  });

  return scored.slice(0, limit).map((entry) => entry.product);
}

function selectPopular(
  pool: ProductSummary[],
  excluded: Set<string>,
  limit: number,
): ProductSummary[] {
  const seen = new Set<string>();
  const sorted = pool
    .slice()
    .sort((a, b) => {
      const ratingA = typeof a.rating === "number" ? a.rating : 0;
      const ratingB = typeof b.rating === "number" ? b.rating : 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }

      const offersA = typeof a.offersCount === "number" ? a.offersCount : 0;
      const offersB = typeof b.offersCount === "number" ? b.offersCount : 0;
      if (offersB !== offersA) {
        return offersB - offersA;
      }

      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });

  const result: ProductSummary[] = [];

  for (const product of sorted) {
    const key = getProductKey(product);
    if (excluded.has(key) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(product);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function resolvePool(
  provided: ProductSummary[] | undefined,
  fallbackCount: number,
): ProductSummary[] {
  if (provided && provided.length > 0) {
    return provided;
  }

  return getFallbackProductSummaries(fallbackCount);
}

function buildExclusionSet(context: RecommendationContext): Set<string> {
  const excluded = new Set<string>();

  context.favoriteProducts?.forEach((product) => {
    excluded.add(getProductKey(product));
  });

  context.priceTrackedProducts?.forEach((product) => {
    excluded.add(getProductKey(product));
  });

  return excluded;
}

export function generateProductRecommendations(
  context: RecommendationContext,
  options?: RecommendationOptions,
): RecommendationResult {
  const limit = Math.max(1, options?.limit ?? DEFAULT_LIMIT);
  const fallbackPoolSize = limit * 4;

  const candidateProducts = resolvePool(options?.candidateProducts, fallbackPoolSize);
  const popularProducts = resolvePool(options?.popularProducts, fallbackPoolSize);

  const preferences = buildPreferenceProfile(context);
  const excluded = buildExclusionSet(context);

  const personalized = rankProducts(candidateProducts, preferences, excluded, limit);

  if (preferences.hasInteractions && personalized.length > 0) {
    return { items: personalized, usedFallback: false };
  }

  const popular = selectPopular(popularProducts, excluded, limit);
  return { items: popular, usedFallback: true };
}

