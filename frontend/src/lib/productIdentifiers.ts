import type { DealItem, ProductSummary } from "@/types/api";

export type ProductIdentifierValue = string | number | null | undefined;
export type ProductIdentifierCandidate =
  | ProductIdentifierValue
  | ProductIdentifierValue[]
  | null
  | undefined;

export function normalizeProductIdentifier(
  value: ProductIdentifierValue,
): string | null {
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return String(value);
    }
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
}

export function resolveProductIdentifier(
  ...candidates: ProductIdentifierCandidate[]
): string | null {
  const queue: ProductIdentifierCandidate[] = [...candidates];

  while (queue.length > 0) {
    const candidate = queue.shift();

    if (Array.isArray(candidate)) {
      queue.unshift(...candidate);
      continue;
    }

    const normalized = normalizeProductIdentifier(candidate ?? null);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function getCanonicalProductId(
  product: ProductSummary | null | undefined,
  options?: {
    offers?: Array<DealItem | null | undefined> | null;
    fallback?: ProductIdentifierValue;
  },
): string | null {
  const offerCandidates: ProductIdentifierValue[] = [];

  if (Array.isArray(options?.offers)) {
    for (const offer of options.offers) {
      if (!offer) {
        continue;
      }
      offerCandidates.push(offer.productId ?? null);
      offerCandidates.push(offer.id ?? null);
    }
  }

  return resolveProductIdentifier(
    product?.product_id,
    product?.bestDeal?.productId,
    product?.bestDeal?.id,
    offerCandidates,
    product?.id,
    options?.fallback ?? null,
  );
}

export function parseNumericIdentifier(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!/^[-+]?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
