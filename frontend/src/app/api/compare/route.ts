import { NextRequest, NextResponse } from "next/server";

import { getProductData } from "@/lib/productFetcher";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const image = searchParams.get("img")?.trim() ?? null;
  const brand = searchParams.get("brand")?.trim() ?? null;
  const description = searchParams.get("description")?.trim()
    ?? searchParams.get("desc")?.trim()
    ?? null;

  if (!query) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  try {
    const data = await getProductData(query, { image, brand, description });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("compareRoute.error", error);
    return NextResponse.json(
      { error: "Impossible de comparer ce produit pour le moment." },
      { status: 502 },
    );
  }
}
