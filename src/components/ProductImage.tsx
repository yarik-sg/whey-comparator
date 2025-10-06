import type { ReactNode } from 'react';

type ProductImageProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: ReactNode;
};

const baseContainerClasses = 'relative overflow-hidden bg-slate-100';
const fallbackClasses = 'flex h-full w-full items-center justify-center text-xl text-slate-400';

export function ProductImage({ imageUrl, alt, className = '', fallbackIcon = '📦' }: ProductImageProps) {
  const containerClasses = [baseContainerClasses, className].filter(Boolean).join(' ').trim();

  if (imageUrl && imageUrl.length > 0) {
    return (
      <div className={containerClasses}>
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={fallbackClasses} aria-hidden>
        {fallbackIcon}
      </div>
      <span className="sr-only">{alt}</span>
    </div>
  );
}
