export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type QueryInput =
  | URLSearchParams
  | Record<string, QueryValue>;

type NextFetchOptions = {
  revalidate?: number;
  tags?: string[];
};

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "next"> {
  query?: QueryInput;
  body?: BodyInit | Record<string, unknown> | null;
  /**
   * When true the request will directly target the proxy endpoint instead of trying
   * to reach the upstream API. Useful when the browser already requires the proxy
   * (e.g. due to CORS) and we want the same behaviour on the server.
   */
  preferProxy?: boolean;
  /**
   * Controls whether the client can retry a failing direct request via the proxy.
   * API routes that already implement the proxy mechanism should disable this to
   * avoid infinite loops.
   */
  allowProxyFallback?: boolean;
  // Allow Next.js specific options on the init object without forcing the dependency
  next?: NextFetchOptions;
}

export interface ApiResponse<T> {
  data: T;
  response: Response;
}

const FALLBACK_BASE_URL = "http://localhost:8000";
const PROXY_PATH = "/api/proxy";

type ResolvedBaseUrl = {
  baseUrl: string | null;
  useProxy: boolean;
};

function resolveBaseUrl(): ResolvedBaseUrl {
  const isBrowser = typeof window !== "undefined";

  if (isBrowser) {
    const browserBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? null;

    if (browserBase) {
      return { baseUrl: browserBase, useProxy: false };
    }

    return { baseUrl: null, useProxy: true };
  }

  const serverBase =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    FALLBACK_BASE_URL;

  return { baseUrl: serverBase, useProxy: false };
}

function isURLSearchParams(value: QueryInput): value is URLSearchParams {
  return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}

function toURLSearchParams(query: QueryInput | undefined): URLSearchParams | undefined {
  if (!query) {
    return undefined;
  }

  if (isURLSearchParams(query)) {
    return query;
  }

  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(query)) {
    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => {
        if (value === undefined || value === null) {
          return;
        }
        params.append(key, String(value));
      });
    } else if (rawValue !== undefined && rawValue !== null) {
      params.append(key, String(rawValue));
    }
  }

  return params;
}

type RequestUrl = {
  url: string;
  usingProxy: boolean;
};

function buildProxyUrl(path: string, query?: QueryInput): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const pathUrl = new URL(normalizedPath, "http://placeholder");
  const proxyParams = new URLSearchParams();
  const combinedParams = toURLSearchParams(query);

  proxyParams.set(
    "target",
    pathUrl.pathname.startsWith("/")
      ? pathUrl.pathname.slice(1)
      : pathUrl.pathname,
  );

  pathUrl.searchParams.forEach((value, key) => {
    proxyParams.append(key, value);
  });

  combinedParams?.forEach((value, key) => {
    proxyParams.append(key, value);
  });

  const queryString = proxyParams.toString();
  return queryString ? `${PROXY_PATH}?${queryString}` : PROXY_PATH;
}

function buildDirectUrl(baseUrl: string, path: string, query?: QueryInput): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  const params = toURLSearchParams(query);
  if (params) {
    params.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

function resolveRequestUrls(
  path: string,
  query: QueryInput | undefined,
  preferProxy: boolean | undefined,
  allowProxyFallback: boolean,
): RequestUrl[] {
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    const existingParams = toURLSearchParams(query);
    if (existingParams) {
      existingParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    }
    return [{ url: url.toString(), usingProxy: false }];
  }

  const attempts: RequestUrl[] = [];

  const { baseUrl, useProxy } = resolveBaseUrl();
  if (preferProxy || useProxy || !baseUrl) {
    attempts.push({ url: buildProxyUrl(path, query), usingProxy: true });
    if (!preferProxy && !useProxy && baseUrl) {
      attempts.push({ url: buildDirectUrl(baseUrl, path, query), usingProxy: false });
    }
  } else {
    attempts.push({ url: buildDirectUrl(baseUrl, path, query), usingProxy: false });
    if (allowProxyFallback) {
      attempts.push({ url: buildProxyUrl(path, query), usingProxy: true });
    }
  }

  return attempts;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  const { query, headers, body, next, preferProxy, allowProxyFallback = true, ...init } = options;
  const urls = resolveRequestUrls(path, query, preferProxy, allowProxyFallback);

  const finalHeaders = new Headers(headers ?? {});
  let finalBody = body ?? null;

  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    finalBody = JSON.stringify(body);
    if (!finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
  }

  let lastError: unknown;

  for (const { url, usingProxy } of urls) {
    try {
      const response = await fetch(url, {
        ...init,
        next,
        headers: finalHeaders,
        body: finalBody as BodyInit | null,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      const data =
        contentType.includes("application/json")
          ? ((await response.json()) as T)
          : ((await response.text()) as unknown as T);

      return { data, response };
    } catch (error) {
      lastError = error;
      if (usingProxy || !allowProxyFallback) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("API request failed and no fallback succeeded");
}

export const apiClient = {
  async get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { data } = await apiRequest<T>(path, { ...options, method: "GET" });
    return data;
  },
  async post<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { data } = await apiRequest<T>(path, { ...options, method: "POST" });
    return data;
  },
  async put<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { data } = await apiRequest<T>(path, { ...options, method: "PUT" });
    return data;
  },
  async patch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { data } = await apiRequest<T>(path, { ...options, method: "PATCH" });
    return data;
  },
  async delete<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { data } = await apiRequest<T>(path, { ...options, method: "DELETE" });
    return data;
  },
};

export default apiClient;
