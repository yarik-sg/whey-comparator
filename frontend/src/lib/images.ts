const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

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
  const encoded = encodeURIComponent(url);
  return `/api/image-proxy?url=${encoded}`;
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
