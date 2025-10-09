import { NextRequest, NextResponse } from "next/server";

import apiClient, { ApiError } from "@/lib/apiClient";

function buildQuery(searchParams: URLSearchParams) {
  const forwarded = new URLSearchParams(searchParams);
  forwarded.delete("target");
  return forwarded.size > 0 ? forwarded : undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const target = url.searchParams.get("target");

  if (!target) {
    return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
  }

  try {
    const data = await apiClient.get(`/${target}`, {
      query: buildQuery(url.searchParams),
      headers: {
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? undefined,
      },
      cache: "no-store",
      allowProxyFallback: false,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status ?? 502;

      if (error.body) {
        try {
          const parsed = JSON.parse(error.body);
          return NextResponse.json(parsed, { status });
        } catch {
          return NextResponse.json({ error: error.body }, { status });
        }
      }

      return NextResponse.json({ error: error.message }, { status });
    }

    const message =
      error instanceof Error ? error.message : "Unable to proxy request";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
