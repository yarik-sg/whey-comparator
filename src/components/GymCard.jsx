import { memo, useMemo } from 'react';

const IconWrapper = ({ children, className = '' }) => (
  <span
    className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100/80 text-neutral-900 shadow-aurora-soft ${className}`}
  >
    {children}
  </span>
);

const buildIconClassName = (base, extra) => {
  if (extra && extra.length > 0) {
    return `${base} ${extra}`;
  }
  return base;
};

const MapPinIcon = ({ className }) => (
  <svg
    className={buildIconClassName('h-5 w-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 21c4-4.2 6-7.1 6-10a6 6 0 10-12 0c0 2.9 2 5.8 6 10z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const EuroIcon = ({ className }) => (
  <svg className={buildIconClassName('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19 7.5a6 6 0 00-4.8-2.5c-3.7 0-6.2 3-6.2 6.9s2.5 6.9 6.2 6.9A6 6 0 0019 16"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6 10h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M6 14h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const LinkIcon = ({ className }) => (
  <svg className={buildIconClassName('h-4 w-4', className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.5 9.5l4-4m0 0h-3.6m3.6 0v3.6M10 6.5H9A4.5 4.5 0 004.5 11v4.5A4.5 4.5 0 009 20h4.5A4.5 4.5 0 0018 15.5V14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={buildIconClassName('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8.5V12l2.2 2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const distanceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'decimal',
  maximumFractionDigits: 1,
});

export const GymCard = memo(function GymCard({ gym }) {
  const {
    name,
    brand,
    address,
    postalCode,
    city,
    monthlyPrice,
    distanceKm,
    travelTime,
    amenities = [],
    website: websiteFromApi,
    link,
  } = gym;

  const website = websiteFromApi ?? link ?? null;

  const formattedPrice = useMemo(() => {
    if (typeof monthlyPrice === 'number' && Number.isFinite(monthlyPrice)) {
      return `${priceFormatter.format(monthlyPrice)}/mois`;
    }
    return 'Tarif sur demande';
  }, [monthlyPrice]);

  const formattedDistance = useMemo(() => {
    if (typeof distanceKm === 'number' && Number.isFinite(distanceKm)) {
      return `${distanceFormatter.format(distanceKm)} km`;
    }
    return null;
  }, [distanceKm]);

  const topAmenities = useMemo(() => amenities.slice(0, 3), [amenities]);

  return (
    <article className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-aurora-soft transition hover:-translate-y-1 hover:border-secondary-300/60">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconWrapper>
            <MapPinIcon />
          </IconWrapper>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-300">{brand}</p>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
          </div>
        </div>

        <div className="space-y-2 text-sm text-neutral-300">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-secondary-300" />
            <span>
              {address}
              <br />
              {postalCode} {city}
            </span>
          </div>

          {formattedDistance ? (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-secondary-300" />
              <span>
                {formattedDistance}
                {travelTime ? ` • ${travelTime}` : ''}
              </span>
            </div>
          ) : null}
        </div>

        {topAmenities.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {topAmenities.map((amenity) => (
              <li
                key={amenity}
                className="rounded-full bg-secondary-100/80 px-3 py-1 text-xs font-medium text-neutral-900"
              >
                {amenity}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-neutral-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-200">
            <EuroIcon className="text-secondary-300" />
            {formattedPrice}
          </span>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-200 transition hover:text-white"
            >
              Site web
              <LinkIcon />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
});
