const unique = <T,>(values: T[]): T[] => {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (value == null) {
      continue;
    }
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
};

const sanitizeBase = (value: string): string => {
  if (!value) {
    return '';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const resolveConfiguredBase = (): string | null => {
  try {
    const meta = import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    };
    const candidate = meta.env?.VITE_API_BASE_URL;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  } catch (error) {
    console.warn('Unable to read VITE_API_BASE_URL from import.meta', error);
  }
  return null;
};

const resolveDevApiBase = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const url = new URL(window.location.href);
    if (!url.port) {
      return null;
    }

    const numericPort = Number.parseInt(url.port, 10);
    if (Number.isNaN(numericPort)) {
      return null;
    }

    if (numericPort === 3000 || numericPort === 5173) {
      return `${url.protocol}//${url.hostname}:8000`;
    }

    return null;
  } catch (error) {
    console.warn('Unable to derive API base URL from window.location', error);
    return null;
  }
};

const candidateBases = (): string[] => {
  const bases: string[] = [];
  const configured = resolveConfiguredBase();
  if (configured) {
    bases.push(configured);
  }

  const devBase = resolveDevApiBase();
  if (devBase) {
    bases.push(devBase);
  }

  bases.push('/api');
  bases.push('');

  return unique(bases.map(sanitizeBase));
};

export const buildApiUrl = (path: string, base?: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const prefix = sanitizeBase(base ?? candidateBases()[0] ?? '');
  return `${prefix}${normalizedPath}`;
};

export const fetchFromApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const bases = candidateBases();
  const errors: unknown[] = [];

  for (const base of bases) {
    const url = `${base}${normalizedPath}`;
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        errors.push(new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`));
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      errors.push(error);
      continue;
    }
  }

  console.error('All API base URL candidates failed', { normalizedPath, errors });
  throw errors[errors.length - 1] ?? new Error('Unable to reach API');
};
