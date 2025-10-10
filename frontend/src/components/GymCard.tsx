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
    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500 shadow-sm ${className ?? ""}`}
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
    website,
  } = gym;

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
    <article className="group flex h-full flex-col justify-between rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconBadge>
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </IconBadge>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">{brand}</p>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-orange-400" aria-hidden="true" />
            <span>
              {address}
              <br />
              {postalCode} {city}
            </span>
          </p>
          {formattedDistance ? (
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-orange-400" aria-hidden="true" />
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
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600"
              >
                {amenity}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <footer className="mt-6 border-t border-orange-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
            <PiggyBank className="h-4 w-4 text-orange-500" aria-hidden="true" />
            {formattedPrice}
          </span>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 transition hover:text-orange-600"
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
