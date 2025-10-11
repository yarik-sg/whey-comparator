"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { MapPin, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GymCard } from "@/components/GymCard";
import type { GymLocatorResponse, GymLocation } from "@/lib/gymLocator";
import { fetchGymsFromApi } from "@/lib/gymLocator";

type GeoStatus = "idle" | "pending" | "success" | "error";

const DISTANCE_DEFAULT = 10;
const LIMIT_DEFAULT = 6;
const LIMIT_EXPANDED = 24;

const DistanceBadge = ({ value, onReset }: { value: number; onReset: () => void }) => (
  <button
    type="button"
    onClick={onReset}
    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-fitidion-orange transition hover:border-white/40 hover:bg-white/20"
  >
    Rayon : {value} km
    <span className="text-fitidion-orange" aria-hidden="true">
      ×
    </span>
  </button>
);

const GeolocationStatus = ({ status, message }: { status: GeoStatus; message: string | null }) => {
  if (status === "idle" || (!message && status !== "pending")) {
    return null;
  }

  const tone =
    status === "error"
      ? "text-red-400"
      : status === "pending"
        ? "text-slate-300"
        : "text-emerald-300";

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
  const [response, setResponse] = useState<GymLocatorResponse | null>(null);
  const responseRef = useRef<GymLocatorResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;

    const loadGyms = async () => {
      setErrorMessage(null);

      const hasExistingGyms = (responseRef.current?.gyms?.length ?? 0) > 0;

      if (!hasExistingGyms) {
        setIsLoadingInitial(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = await fetchGymsFromApi(filters, { signal: controller?.signal });

        if (cancelled) {
          return;
        }

        responseRef.current = result;
        setResponse(result);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        const errorInstance = fetchError instanceof Error ? fetchError : undefined;
        if (errorInstance?.name === "AbortError") {
          return;
        }

        globalThis.console?.error?.("Unable to fetch gyms", fetchError);
        setErrorMessage("Impossible de charger les salles de sport pour le moment. Réessayez plus tard.");

        if (!hasExistingGyms) {
          responseRef.current = null;
          setResponse(null);
        }
      } finally {
        if (cancelled) {
          return;
        }

        setIsLoadingInitial(false);
        setIsRefreshing(false);
      }
    };

    loadGyms().catch((reason) => {
      globalThis.console?.error?.("Unhandled gym fetch error", reason);
    });

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [filters]);

  const gyms = response?.gyms ?? emptyGyms;
  const availableCities = response?.availableCities ?? [];
  const totalResults = response?.total ?? gyms.length;
  const canExpand = !showAll && totalResults > gyms.length;
  const isLoadingMore = isRefreshing && gyms.length > 0;

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
    <section className="relative mx-auto w-full max-w-6xl space-y-8 overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/80 p-10 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,102,0,0.12),transparent_60%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_20%,rgba(253,220,142,0.12),transparent_55%)]" aria-hidden />
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-fitidion-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-fitidion-orange">
          Nouveauté
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-fitidion-dark dark:text-white">Trouvez votre salle de sport</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Visualisez les clubs Basic-Fit, Fitness Park, On Air, Neoness et autres enseignes près de chez vous. Comparez leurs
            abonnements mensuels et repérez les services inclus.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-white/15 bg-white/40 p-4 backdrop-blur md:grid-cols-[1.2fr,1fr,1fr,auto] md:items-end dark:border-white/10 dark:bg-white/5"
      >
        <div className="space-y-2">
          <label htmlFor="gym-search" className="text-xs font-semibold uppercase tracking-[0.4em] text-fitidion-orange">
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
          <label htmlFor="gym-city" className="text-xs font-semibold uppercase tracking-[0.4em] text-fitidion-orange">
            Villes disponibles
          </label>
          <select
            id="gym-city"
            value={selectedCity ?? ""}
            onChange={handleCityChange}
            className="h-12 w-full rounded-2xl border border-white/20 bg-white/70 px-3 text-sm text-slate-700 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fitidion-orange/40 dark:border-white/10 dark:bg-white/10 dark:text-white"
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
          <label htmlFor="gym-distance" className="text-xs font-semibold uppercase tracking-[0.4em] text-fitidion-orange">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/40 accent-fitidion-orange"
          />
          <div className="flex items-center justify-between text-xs text-fitidion-orange">
            <span>{maxDistance} km</span>
            {maxDistance !== DISTANCE_DEFAULT ? (
              <button
                type="button"
                onClick={handleResetDistance}
                className="text-fitidion-orange underline decoration-dotted underline-offset-4 hover:text-fitidion-gold"
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
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-fitidion-orange">
            <MapPin className="h-3 w-3" aria-hidden="true" /> Ville : {selectedCity}
          </span>
        ) : null}
        {coordinates ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-fitidion-orange">
            <MapPinned className="h-3 w-3" aria-hidden="true" /> Position détectée
          </span>
        ) : null}
        {maxDistance !== DISTANCE_DEFAULT ? (
          <DistanceBadge value={maxDistance} onReset={handleResetDistance} />
        ) : null}
        <GeolocationStatus status={geoStatus} message={geoMessage} />
        {isLoadingMore ? (
          <span className="text-xs text-slate-400">Actualisation des résultats…</span>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200/60 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {isLoadingInitial ? (
        <div className="rounded-2xl border border-white/15 bg-white/20 p-4 text-center text-sm font-medium text-fitidion-orange">
          Chargement des salles…
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoadingInitial
          ? Array.from({ length: LIMIT_DEFAULT }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/10" />
            ))
          : gyms.map((gym) => <GymCard key={gym.id} gym={gym} />)}
      </div>

      {gyms.length === 0 && !isLoadingInitial && !isRefreshing ? (
        <div className="rounded-2xl border border-white/15 bg-white/15 p-6 text-center text-sm text-fitidion-orange">
          Aucune salle trouvée
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
