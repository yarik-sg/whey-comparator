const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;
const DEFAULT_PROXY_PATH = "/api/image-proxy";

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, unknown>;
};

function pickString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
}

function getProcessEnv(): Record<string, unknown> | null {
  const globalProcess =
    typeof globalThis !== "undefined"
      ? (globalThis as { process?: { env?: Record<string, unknown> } }).process
      : undefined;

  if (globalProcess && typeof globalProcess.env === "object" && globalProcess.env !== null) {
    return globalProcess.env;
  }

  return null;
}

function isNextEnvironment(): boolean {
  const processEnv = getProcessEnv();

  if (processEnv) {
    if ("NEXT_RUNTIME" in processEnv) {
      return true;
    }

    if ("__NEXT_PRIVATE_PREBUNDLED_REACT" in processEnv) {
      return true;
    }
  }

  if (typeof window !== "undefined" && typeof window === "object") {
    return "__NEXT_DATA__" in window;
  }

  return false;
}

function getImportMetaEnv(): Record<string, unknown> | null {
  try {
    if (typeof import.meta === "undefined") {
      return null;
    }

    const meta = import.meta as ImportMetaWithEnv;
    if (meta && typeof meta.env === "object" && meta.env !== null) {
      return meta.env;
    }
  } catch {
    // Ignore environments where import.meta is not supported
  }

  return null;
}

function resolveProxyBase(): string | null {
  const importMetaEnv = getImportMetaEnv();
  const processEnv = getProcessEnv();

  const viteProxy = pickString(
    importMetaEnv?.["VITE_IMAGE_PROXY_URL"],
    importMetaEnv?.["VITE_PUBLIC_IMAGE_PROXY_URL"],
  );

  if (viteProxy) {
    return viteProxy;
  }

  const envProxy = pickString(
    processEnv?.["NEXT_PUBLIC_IMAGE_PROXY_URL"],
    processEnv?.["IMAGE_PROXY_URL"],
  );

  if (envProxy) {
    return envProxy;
  }

  if (isNextEnvironment()) {
    return DEFAULT_PROXY_PATH;
  }

  return null;
}

function ensureProtocol(url: string): string {
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  return url;
}

function needsProxy(url: string): boolean {
  if (!HTTP_PROTOCOL_REGEX.test(url)) {
    return false;
  }

  return url.toLowerCase().startsWith("http://");
}

function buildProxyUrl(url: string): string {
  const proxyBase = resolveProxyBase();

  if (!proxyBase) {
    return url;
  }

  const encoded = encodeURIComponent(url);
  const hasQuery = proxyBase.includes("?");
  const separator = hasQuery && !proxyBase.endsWith("?") ? "&" : "?";

  if (HTTP_PROTOCOL_REGEX.test(proxyBase) || proxyBase.startsWith("//")) {
    const normalized = proxyBase.endsWith("/") && !proxyBase.includes("?")
      ? proxyBase.slice(0, -1)
      : proxyBase;
    return `${normalized}${separator}url=${encoded}`;
  }

  const trimmed = proxyBase.replace(/^\/+|\/+$/g, "");
  const prefixed = trimmed.length > 0 ? `/${trimmed}` : DEFAULT_PROXY_PATH;

  return `${prefixed}${separator}url=${encoded}`;
}

export function buildDisplayImageUrl(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (trimmed.startsWith("/api/image-proxy")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const withProtocol = ensureProtocol(trimmed);

  if (needsProxy(withProtocol)) {
    return buildProxyUrl(withProtocol);
  }

  return withProtocol;
}
