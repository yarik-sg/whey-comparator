import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { useGyms } from '../hooks/useGyms';
import type { GymLocation } from '../lib/gymLocator';
import { GymCard } from './GymCard';

const DistanceBadge = ({ value, onReset }: { value: number; onReset: () => void }) => (
  <button
    type="button"
    onClick={onReset}
    className="inline-flex items-center gap-2 rounded-full border border-secondary-300/70 bg-secondary-100/80 px-3 py-1 text-xs font-medium text-neutral-900 transition hover:bg-secondary-200/80"
  >
    Rayon : {value} km
    <span className="text-secondary-500">×</span>
  </button>
);

const GeolocationStatus = ({ status, message }: { status: string; message: string | null }) => {
  if (status === 'idle' || (!message && status !== 'pending')) {
    return null;
  }

  const tone = status === 'error' ? 'text-alert-400' : status === 'pending' ? 'text-neutral-300' : 'text-accent-300';

  return (
    <p className={`text-xs ${tone}`}>
      {status === 'pending' ? 'Géolocalisation en cours…' : message}
    </p>
  );
};

const limitForDisplay = 6;
const expandedLimit = 24;

const emptyState: GymLocation[] = [];

export const GymLocatorSection = () => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [maxDistance, setMaxDistance] = useState(10);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      city: coordinates ? undefined : selectedCity,
      maxDistanceKm: maxDistance,
      lat: coordinates?.lat,
      lng: coordinates?.lng,
      limit: showAll ? expandedLimit : limitForDisplay,
    }),
    [coordinates, maxDistance, selectedCity, showAll],
  );

  const { data, isLoading, isFetching, error, refetch } = useGyms(filters);

  const gyms = data?.gyms ?? emptyState;
  const availableCities = data?.availableCities ?? [];
  const totalResults = data?.total ?? gyms.length;
  const canExpand = !showAll && totalResults > limitForDisplay;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    setCoordinates(null);
    setGeoStatus('idle');
    setGeoMessage(null);
    setShowAll(false);
    setSelectedCity(trimmed.length > 0 ? trimmed : undefined);
    void refetch();
  };

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCoordinates(null);
    setGeoStatus('idle');
    setGeoMessage(null);
    setShowAll(false);
    setSelectedCity(value.length > 0 ? value : undefined);
    setSearchInput(value);
  };

  const handleDistanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10);
    setMaxDistance(Number.isNaN(value) ? maxDistance : value);
    setShowAll(false);
  };

  const handleResetDistance = () => {
    setMaxDistance(10);
    setShowAll(false);
  };

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      setGeoMessage('La géolocalisation n’est pas supportée sur cet appareil.');
      return;
    }

    setGeoStatus('pending');
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoStatus('success');
        setGeoMessage('Position détectée : résultats mis à jour.');
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSelectedCity(undefined);
        setSearchInput('');
        setShowAll(false);
      },
      (geoError) => {
        setGeoStatus('error');
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setGeoMessage('Accès à la localisation refusé.');
        } else {
          setGeoMessage('Impossible de récupérer votre position.');
        }
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  const visibleGyms = showAll ? gyms : gyms.slice(0, limitForDisplay);

  return (
    <section className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-aurora-soft">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary-200/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-900 shadow-aurora-soft">
          Nouveauté
        </span>
        <h2 className="text-2xl font-semibold text-white">Trouvez votre salle de sport</h2>
        <p className="max-w-3xl text-sm text-neutral-300">
          Visualisez les clubs Basic-Fit, Fitness Park, On Air, Neoness et autres enseignes près de chez vous. Comparez leurs
          abonnements mensuels et repérez les services inclus.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="gym-city" className="text-xs font-semibold uppercase tracking-wide text-secondary-300">
            Entrez votre ville
          </label>
          <input
            id="gym-city"
            name="gym-city"
            type="search"
            autoComplete="address-level2"
            placeholder="Paris, Lyon, Marseille…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="gym-city-select" className="text-xs font-semibold uppercase tracking-wide text-secondary-300">
            Villes disponibles
          </label>
          <select
            id="gym-city-select"
            value={selectedCity ?? ''}
            onChange={handleCityChange}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200/60"
          >
            <option value="">Toutes les villes</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="gym-distance" className="text-xs font-semibold uppercase tracking-wide text-secondary-300">
            Rayon (km)
          </label>
          <input
            id="gym-distance"
            type="range"
            min="2"
            max="30"
            step="1"
            value={maxDistance}
            onChange={handleDistanceChange}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-primary-500"
          />
          <div className="flex items-center justify-between text-xs text-secondary-300">
            <span>{maxDistance} km</span>
            <button
              type="button"
              onClick={handleResetDistance}
              className="text-secondary-300 underline decoration-dotted underline-offset-4 hover:text-secondary-200"
            >
              Réinitialiser
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-flame-gradient px-4 py-2 text-sm font-semibold text-white shadow-aurora-soft transition hover:brightness-110"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={handleUseLocation}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-primary-400 hover:text-white"
          >
            Utiliser ma position
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        {selectedCity ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary-300/70 bg-secondary-100/80 px-3 py-1 text-xs font-medium text-neutral-900">
            Ville : {selectedCity}
          </span>
        ) : null}
        {coordinates ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary-300/70 bg-secondary-100/80 px-3 py-1 text-xs font-medium text-neutral-900">
            Position détectée
          </span>
        ) : null}
        {maxDistance !== 10 ? <DistanceBadge value={maxDistance} onReset={handleResetDistance} /> : null}
        <GeolocationStatus status={geoStatus} message={geoMessage} />
      </div>

      {error ? (
        <div className="rounded-xl border border-alert-400/70 bg-alert-500/10 p-4 text-sm text-alert-300">
          Impossible de charger les salles de sport pour le moment. Réessayez plus tard.
        </div>
      ) : null}

      {(isLoading || isFetching) && gyms.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-center text-sm font-medium text-neutral-200">
          Chargement des salles…
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(isLoading || isFetching) && gyms.length === 0
          ? Array.from({ length: limitForDisplay }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl bg-neutral-800/60" />
            ))
          : visibleGyms.map((gym) => <GymCard key={gym.id} gym={gym} />)}
      </div>

      {gyms.length === 0 && !isLoading && !isFetching ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 text-center text-sm text-neutral-200">
          Aucune salle trouvée
        </div>
      ) : null}

      {canExpand ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mx-auto flex items-center gap-2 rounded-full border border-secondary-300/70 bg-secondary-100/80 px-5 py-2 text-sm font-semibold text-neutral-900 shadow-aurora-soft transition hover:bg-secondary-200/80"
        >
          Voir toutes les salles proches ({Math.max(totalResults - visibleGyms.length, 0)})
        </button>
      ) : null}
    </section>
  );
};
