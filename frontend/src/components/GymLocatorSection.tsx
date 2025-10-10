"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { MapPin, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GymCard } from "@/components/GymCard";
import { useGyms } from "@/hooks/useGyms";
import type { GymLocation } from "@/lib/gymLocator";

type GeoStatus = "idle" | "pending" | "success" | "error";

const DISTANCE_DEFAULT = 10;
const LIMIT_DEFAULT = 6;
const LIMIT_EXPANDED = 24;

const DistanceBadge = ({ value, onReset }: { value: number; onReset: () => void }) => (
  <button
    type="button"
    onClick={onReset}
    className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-100"
  >
    Rayon : {value} km
    <span className="text-orange-400" aria-hidden="true">
      ×
    </span>
  </button>
);

const GeolocationStatus = ({ status, message }: { status: GeoStatus; message: string | null }) => {
  if (status === "idle" || (!message && status !== "pending")) {
    return null;
  }

  const tone =
    status === "error" ? "text-red-600" : status === "pending" ? "text-slate-500" : "text-emerald-600";

  return (
    <p className={`text-xs ${tone}`}>
      {status === "pending" ? "Géolocalisation en cours…" : message}
    </p>
  );
};

const emptyGyms: GymLocation[] = [];

export function GymLocatorSection() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [maxDistance, setMaxDistance] = useState(DISTANCE_DEFAULT);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      city: coordinates ? undefined : selectedCity,
      maxDistanceKm: maxDistance,
      lat: coordinates?.lat,
      lng: coordinates?.lng,
      limit: showAll ? LIMIT_EXPANDED : LIMIT_DEFAULT,
    }),
    [coordinates, maxDistance, selectedCity, showAll],
  );

  const { data, isPending, isFetching, error } = useGyms(filters);

  const gyms = data?.gyms ?? emptyGyms;
  const availableCities = data?.availableCities ?? [];
  const totalResults = data?.total ?? gyms.length;
  const canExpand = !showAll && totalResults > gyms.length;
  const isLoadingInitial = isPending && gyms.length === 0;
  const isLoadingMore = isFetching && gyms.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    setCoordinates(null);
    setGeoStatus("idle");
    setGeoMessage(null);
    setShowAll(false);
    setSelectedCity(trimmed.length > 0 ? trimmed : undefined);
  };

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCoordinates(null);
    setGeoStatus("idle");
    setGeoMessage(null);
    setShowAll(false);
    setSelectedCity(value.length > 0 ? value : undefined);
    setSearchInput(value);
  };

  const handleDistanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10);
    setMaxDistance(Number.isNaN(value) ? DISTANCE_DEFAULT : value);
    setShowAll(false);
  };

  const handleResetDistance = () => {
    setMaxDistance(DISTANCE_DEFAULT);
    setShowAll(false);
  };

  const handleUseLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("La géolocalisation n’est pas supportée sur cet appareil.");
      return;
    }

    setGeoStatus("pending");
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoStatus("success");
        setGeoMessage("Position détectée : résultats mis à jour.");
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSelectedCity(undefined);
        setSearchInput("");
        setShowAll(false);
      },
      (geoError) => {
        setGeoStatus("error");
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setGeoMessage("Accès à la localisation refusé.");
        } else {
          setGeoMessage("Impossible de récupérer votre position.");
        }
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-sm">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
          Nouveauté
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Trouvez votre salle de sport</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Visualisez les clubs Basic-Fit, Fitness Park, On Air, Neoness et autres enseignes près de chez vous. Comparez leurs
            abonnements mensuels et repérez les services inclus.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 md:grid-cols-[1.2fr,1fr,1fr,auto] md:items-end"
      >
        <div className="space-y-2">
          <label htmlFor="gym-search" className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Entrez votre ville
          </label>
          <Input
            id="gym-search"
            name="gym-search"
            type="search"
            autoComplete="address-level2"
            placeholder="Paris, Lyon, Marseille…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gym-city" className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Villes disponibles
          </label>
          <select
            id="gym-city"
            value={selectedCity ?? ""}
            onChange={handleCityChange}
            className="h-12 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <option value="">Toutes les villes</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="gym-distance" className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Rayon (km)
          </label>
          <input
            id="gym-distance"
            type="range"
            min={2}
            max={30}
            step={1}
            value={maxDistance}
            onChange={handleDistanceChange}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-orange-200 accent-orange-500"
          />
          <div className="flex items-center justify-between text-xs text-orange-600">
            <span>{maxDistance} km</span>
            {maxDistance !== DISTANCE_DEFAULT ? (
              <button
                type="button"
                onClick={handleResetDistance}
                className="text-orange-500 underline decoration-dotted underline-offset-4 hover:text-orange-600"
              >
                Réinitialiser
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" variant="primary" size="sm" className="h-12">
            Rechercher
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-12"
            onClick={handleUseLocation}
          >
            <MapPinned className="mr-2 h-4 w-4" aria-hidden="true" /> Utiliser ma position
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        {selectedCity ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-600">
            <MapPin className="h-3 w-3" aria-hidden="true" /> Ville : {selectedCity}
          </span>
        ) : null}
        {coordinates ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-600">
            <MapPinned className="h-3 w-3" aria-hidden="true" /> Position détectée
          </span>
        ) : null}
        {maxDistance !== DISTANCE_DEFAULT ? (
          <DistanceBadge value={maxDistance} onReset={handleResetDistance} />
        ) : null}
        <GeolocationStatus status={geoStatus} message={geoMessage} />
        {isLoadingMore ? (
          <span className="text-xs text-slate-500">Actualisation des résultats…</span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Impossible de charger les salles de sport pour le moment. Réessayez plus tard.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoadingInitial
          ? Array.from({ length: LIMIT_DEFAULT }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-3xl bg-orange-100/70" />
            ))
          : gyms.map((gym) => <GymCard key={gym.id} gym={gym} />)}
      </div>

      {gyms.length === 0 && !isPending ? (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-6 text-center text-sm text-orange-700">
          Aucune salle ne correspond à ces critères. Essayez un autre rayon ou une autre ville.
        </div>
      ) : null}

      {canExpand ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-12"
            onClick={() => setShowAll(true)}
          >
            Voir toutes les salles proches ({Math.max(totalResults - gyms.length, 0)})
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export default GymLocatorSection;
