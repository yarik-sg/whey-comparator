"use client";

import { memo, useMemo } from "react";
import { Clock3, ExternalLink, MapPin, PiggyBank } from "lucide-react";

import type { GymLocation } from "@/lib/gymLocator";

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
}

const IconBadge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary shadow-sm ${className ?? ""}`}
  >
    {children}
  </span>
);

export const GymCard = memo(function GymCard({ gym }: GymCardProps) {
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

  return (
    <article className="group flex h-full flex-col justify-between rounded-3xl border border-secondary/60 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
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

      <footer className="mt-6 border-t border-secondary/60 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-dark">
            <PiggyBank className="h-4 w-4 text-primary" aria-hidden="true" />
            {formattedPrice}
          </span>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary"
            >
              Voir le site
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </footer>
    </article>
  );
});

GymCard.displayName = "GymCard";
