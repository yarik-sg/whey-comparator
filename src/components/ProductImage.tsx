import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type ProductImageProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: ReactNode;
  fallbackLabel?: string;
};

const baseContainerClasses = 'relative overflow-hidden bg-slate-100';
const fallbackClasses = 'text-lg font-semibold uppercase tracking-wide text-white';

const fallbackGradients = [
  'from-primary-500 via-primary-500/95 to-primary-600',
  'from-emerald-500 via-emerald-500/95 to-emerald-600',
  'from-indigo-500 via-indigo-500/95 to-indigo-600',
  'from-amber-500 via-amber-500/95 to-amber-600',
  'from-rose-500 via-rose-500/95 to-rose-600',
  'from-sky-500 via-sky-500/95 to-sky-600',
];

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
};

const getInitials = (label: string) => {
  const words = label
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return '??';
  }

  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }

  return (words[0]![0]! + words[1]![0]!).toUpperCase();
};

export function ProductImage({
  imageUrl,
  alt,
  className = '',
  fallbackIcon,
  fallbackLabel,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  const containerClasses = useMemo(
    () =>
      [baseContainerClasses, className]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    [className],
  );

  const labelForFallback = fallbackLabel?.trim() || alt;

  const gradientClass = useMemo(() => {
    const gradientIndex = Math.abs(hashString(labelForFallback)) % fallbackGradients.length;
    return fallbackGradients[gradientIndex] ?? fallbackGradients[0]!;
  }, [labelForFallback]);

  const shouldShowImage = Boolean(imageUrl && imageUrl.length > 0 && !hasError);

  if (shouldShowImage) {
    return (
      <div className={containerClasses}>
        <img
          src={imageUrl as string}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}
        aria-hidden
      >
        {fallbackIcon ? (
          <span className="text-2xl text-white/90">{fallbackIcon}</span>
        ) : (
          <span className={fallbackClasses}>{getInitials(labelForFallback)}</span>
        )}
      </div>
      <span className="sr-only">{alt}</span>
    </div>
  );
}
