import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import apiClient, { ApiError } from "@/lib/apiClient";

type RawGym = Record<string, unknown>;

async function loadLocalGymsFallback(): Promise<RawGym[] | null> {
  const baseDir = process.cwd();
  const candidatePaths = [
    path.join(baseDir, "data", "gyms-fallback.json"),
    path.join(baseDir, "data", "gyms_fallback.json"),
    path.join(baseDir, "src", "data", "gyms-fallback.json"),
    path.join(baseDir, "src", "data", "gyms_fallback.json"),
    path.join(baseDir, "..", "data", "gyms-fallback.json"),
    path.join(baseDir, "..", "data", "gyms_fallback.json"),
  ];

  for (const candidate of candidatePaths) {
    try {
      const contents = await fs.readFile(candidate, "utf-8");
      const parsed = JSON.parse(contents) as unknown;
      const gyms = flattenGyms(parsed);
      if (gyms.length > 0) {
        return gyms;
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code === "ENOENT") {
        continue;
      }
    }
  }

  return null;
}

function flattenGyms(input: unknown): RawGym[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is RawGym => Boolean(item) && typeof item === "object");
  }

  if (input && typeof input === "object") {
    const values = Object.values(input as Record<string, unknown>);
    const aggregated: RawGym[] = [];
    for (const value of values) {
      if (Array.isArray(value)) {
        aggregated.push(...value.filter((item): item is RawGym => Boolean(item) && typeof item === "object"));
      }
    }
    return aggregated;
  }

  return [];
}

function buildQuery(searchParams: URLSearchParams) {
  const forwarded = new URLSearchParams(searchParams);
  forwarded.delete("target");
  return forwarded.size > 0 ? forwarded : undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawTarget = url.searchParams.get("target")?.trim();

  if (!rawTarget) {
    return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
  }

  if (/^https?:\/\//i.test(rawTarget) || rawTarget.startsWith("//")) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const target = rawTarget.replace(/^\/+/, "");
  if (!target || target.startsWith("..")) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
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

      if (status === 404 && target === "gyms") {
        const fallbackGyms = await loadLocalGymsFallback();
        if (fallbackGyms) {
          return NextResponse.json(fallbackGyms);
        }
      }

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
