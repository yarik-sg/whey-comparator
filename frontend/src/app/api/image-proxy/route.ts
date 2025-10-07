import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DEFAULT_CACHE_CONTROL = "public, max-age=900, stale-while-revalidate=86400";
const USER_AGENT =
  "SportComparatorImageProxy/1.0 (+https://github.com/openai-workflows)";

export const runtime = "nodejs";

function parseTargetUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch (error) {
    try {
      return new URL(decodeURIComponent(rawUrl));
    } catch {
      return null;
    }
  }
}

export async function GET(request: NextRequest) {
  const targetParam = request.nextUrl.searchParams.get("url");

  if (!targetParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const target = parseTargetUrl(targetParam);
  if (!target || !ALLOWED_PROTOCOLS.has(target.protocol)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(target.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: `Upstream image request failed (${upstreamResponse.status})` },
        { status: 502 },
      );
    }

    const headers = new Headers();
    const contentType = upstreamResponse.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const cacheControl = upstreamResponse.headers.get("cache-control");
    headers.set("Cache-Control", cacheControl ?? DEFAULT_CACHE_CONTROL);

    return new NextResponse(upstreamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch remote image";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
