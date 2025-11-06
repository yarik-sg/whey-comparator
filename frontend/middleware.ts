import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_ANALYTICS_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_ANALYTICS_PASSWORD;

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Analytics"',
    },
  });
}

function decodeBasicToken(token: string): { username: string; password: string } | null {
  try {
    const decoded = atob(token);
    const separator = decoded.indexOf(":");

    if (separator === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin/analytics")) {
    return NextResponse.next();
  }

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  const token = authorizationHeader.slice(6);
  const credentials = decodeBasicToken(token);

  if (!credentials) {
    return unauthorized();
  }

  if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/admin/analytics", "/admin/analytics/:path*"],
};
