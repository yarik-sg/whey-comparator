import { NextResponse } from "next/server";

import {
  searchProducts,
  fetchSerpApi,
  mergeAndCleanResults,
} from "@/lib/productAggregator";

const DEFAULT_LIMIT = 24;

function parseLimit(value: string | null): number {
  if (!value) {
    return DEFAULT_LIMIT;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, 60);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = parseLimit(searchParams.get("limit"));

  if (!query) {
    return NextResponse.json({ products: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  let aggregated: Array<Record<string, unknown>> = [];
  let aggregatorError: unknown = null;

  if (typeof searchProducts === "function") {
    try {
      aggregated = await searchProducts(query, { limit });
    } catch (error) {
      aggregatorError = error;
    }
  }

  if (!aggregated || aggregated.length === 0) {
    try {
      aggregated = await fetchSerpApi(query, { limit });
    } catch (error) {
      aggregatorError = error;
      aggregated = [];
    }
  }

  if ((!aggregated || aggregated.length === 0) && aggregatorError) {
    const message = aggregatorError instanceof Error ? aggregatorError.message : "Recherche indisponible";
    return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const cleaned = Array.isArray(aggregated) ? mergeAndCleanResults(aggregated) : [];
  const limited = cleaned.slice(0, limit);

  return NextResponse.json(
    { products: limited },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
