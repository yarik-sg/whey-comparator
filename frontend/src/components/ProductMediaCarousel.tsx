"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface ProductMediaCarouselProps {
  images: Array<string | null | undefined>;
  alt: string;
  className?: string;
}

export function ProductMediaCarousel({ images, alt, className }: ProductMediaCarouselProps) {
  const normalizedImages = useMemo(() => {
    const unique = new Map<string, string>();
    images
      .map((image) => image?.trim())
      .filter((value): value is string => Boolean(value))
      .forEach((value) => {
        if (!unique.has(value)) {
          unique.set(value, value);
        }
      });

    if (unique.size === 0) {
      unique.set("/placeholder.png", "/placeholder.png");
    }

    return Array.from(unique.values());
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = normalizedImages[activeIndex] ?? normalizedImages[0];

  const goTo = (index: number) => {
    if (index < 0) {
      setActiveIndex(normalizedImages.length - 1);
    } else if (index >= normalizedImages.length) {
      setActiveIndex(0);
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative overflow-hidden rounded-3xl border border-accent/70 bg-background shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog images */}
        <img
          src={activeImage}
          alt={alt}
          className="h-80 w-full object-cover"
          loading="lazy"
        />
        {normalizedImages.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/90 text-muted shadow transition hover:bg-white"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/90 text-muted shadow transition hover:bg-white"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {normalizedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {normalizedImages.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={image}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border transition",
                  isActive
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-accent/70 hover:border-primary/30",
                )}
                aria-label={`Afficher l'image ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog images */}
                <img src={image} alt="" className="h-20 w-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

