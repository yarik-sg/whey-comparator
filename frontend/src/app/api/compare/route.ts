import { NextRequest, NextResponse } from "next/server";

import { getProductData } from "@/lib/productFetcher";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get("id")?.trim();

  if (!rawId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const query = url.searchParams.get("q")?.trim();

  try {
    const product = await getProductData(rawId, { query: query ?? undefined });
    return NextResponse.json(product);
  } catch (error) {
    console.error("compareRoute.get", error);
    return NextResponse.json({ error: "Failed to retrieve product data" }, { status: 500 });
  }
}
