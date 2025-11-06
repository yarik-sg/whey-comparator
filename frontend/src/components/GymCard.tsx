"use client";

import { memo, useMemo, type MouseEvent, type ReactNode } from "react";
import { ArrowRight, Clock3, ExternalLink, Heart, MapPin, PiggyBank } from "lucide-react";

import type { GymLocation } from "@/lib/gymLocator";
import { isGymFavorite, useFavoritesStore } from "@/store/favoritesStore";
import { useAnalytics } from "@/hooks/useAnalytics";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const distanceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "decimal",
  maximumFractionDigits: 1,
});

export interface GymCardProps {
  gym: GymLocation;
  href?: string | null;
}

const IconBadge = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary shadow-sm ${className ?? ""}`}
  >
    {children}
  </span>
);

export const GymCard = memo(function GymCard({ gym, href = null }: GymCardProps) {
  const {
    name,
    brand,
    address,
    postalCode,
    city,
    monthlyPrice,
    currency,
    distanceKm,
    travelTime,
    amenities,
    website: websiteFromApi,
    link,
  } = gym;

  const website = websiteFromApi ?? link ?? null;
  const detailsUrl = href ?? website ?? link ?? null;
  const isExternalLink = typeof detailsUrl === "string" && /^https?:/i.test(detailsUrl);
  const ctaLabel = detailsUrl ? (isExternalLink ? "Voir le site" : "Voir la fiche") : null;

  const formattedPrice = useMemo(() => {
    if (typeof monthlyPrice === "number" && Number.isFinite(monthlyPrice)) {
      const formatted = priceFormatter.format(monthlyPrice);
      return currency === "EUR" ? `${formatted}/mois` : `${formatted} ${currency}/mois`;
    }

    return "Tarif sur demande";
  }, [currency, monthlyPrice]);

  const formattedDistance = useMemo(() => {
    if (typeof distanceKm === "number" && Number.isFinite(distanceKm)) {
      return `${distanceFormatter.format(distanceKm)} km`;
    }

    return null;
  }, [distanceKm]);

  const topAmenities = useMemo(() => amenities.slice(0, 3), [amenities]);

  const favoriteId = gym.id;
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = isGymFavorite(favorites, favoriteId);
  const { trackButtonClick } = useAnalytics();

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite({
      type: "gym",
      id: favoriteId,
      gym,
    });

    trackButtonClick({
      action: "favorite",
      label: name,
      context: favoriteId,
      metadata: {
        city,
        brand,
        isFavorite: !isFavorite,
      },
    });
  };

  return (
    <article className="group relative flex h-full flex-col justify-between rounded-3xl border border-accent/70 bg-background/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isFavorite}
        className={`absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/60 bg-background/95 text-muted shadow-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-accent-d/40 dark:bg-[var(--background)]/80 ${isFavorite ? "text-primary" : ""}`}
      >
        <Heart
          className="h-5 w-5"
          aria-hidden
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconBadge>
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </IconBadge>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{brand}</p>
            <h3 className="text-lg font-semibold text-dark">{name}</h3>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-primary/80" aria-hidden="true" />
            <span>
              {address}
              <br />
              {postalCode} {city}
            </span>
          </p>
          {formattedDistance ? (
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary/80" aria-hidden="true" />
              <span>
                {formattedDistance}
                {travelTime ? ` · ${travelTime}` : ""}
              </span>
            </p>
          ) : null}
        </div>

        {topAmenities.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {topAmenities.map((amenity) => (
              <li
                key={amenity}
                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary"
              >
                {amenity}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <footer className="mt-6 border-t border-accent/70 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-dark">
            <PiggyBank className="h-4 w-4 text-primary" aria-hidden="true" />
            {formattedPrice}
          </span>
          {detailsUrl && ctaLabel ? (
            <a
              href={detailsUrl}
              target={isExternalLink ? "_blank" : undefined}
              rel={isExternalLink ? "noreferrer" : undefined}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary"
            >
              {ctaLabel}
              {isExternalLink ? (
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </a>
          ) : null}
        </div>
      </footer>
    </article>
  );
});

GymCard.displayName = "GymCard";
