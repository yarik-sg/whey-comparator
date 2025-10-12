import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type ProductImageProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: ReactNode;
  fallbackLabel?: string;
};

const baseContainerClasses = 'relative overflow-hidden bg-neutral-800/40';
const fallbackClasses = 'text-lg font-semibold uppercase tracking-wide text-white';

const fallbackGradients = [
  'from-primary-500 via-primary-400 to-primary-600',
  'from-secondary-400 via-secondary-300 to-secondary-500',
  'from-neutral-800 via-neutral-700 to-neutral-900',
  'from-accent-400 via-accent-500 to-accent-600',
  'from-gold-400 via-gold-300 to-gold-500',
  'from-alert-400 via-alert-500 to-alert-600',
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
