"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const GymsMap = dynamic(() => import("@/components/GymsMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-80 w-full animate-pulse rounded-3xl border border-accent/60 bg-accent/40"
      aria-label="Chargement de la carte des salles"
    />
  ),
});
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Gym = {
  id: string;
  name: string;
  brand: string;
  city?: string;
  address?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  monthly_price?: number;
  currency?: string;
  amenities?: string[];
  website?: string;
  distanceKm?: number;
};

type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

const CACHE_KEY = "fitidion:gym-directory:v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Bordeaux",
  "Toulouse",
  "Lille",
  "Nice",
  "Nantes",
];

const FALLBACK_CITY_SET = new Set(FALLBACK_CITIES.map((city) => city.toLowerCase()));

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeGym(record: Record<string, unknown>): Gym | null {
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const brand = typeof record.brand === "string" ? record.brand.trim() : "";
  if (!name || !brand) {
    return null;
  }

  const id =
    typeof record.id === "string" && record.id.trim()
      ? record.id
      : `${brand.replace(/\s+/g, "-")}-${name.replace(/\s+/g, "-")}`.toLowerCase();

  const latitude = toNumber(record.latitude);
  const longitude = toNumber(record.longitude);
  const distanceKmRaw =
    (record as Record<string, unknown>)["distance_km"] ?? (record as Record<string, unknown>)["distanceKm"];
  const distanceKm = toNumber(distanceKmRaw);
  const monthlyPrice = toNumber(record.monthly_price);

  const amenities = Array.isArray(record.amenities)
    ? (record.amenities.filter((item) => typeof item === "string") as string[])
    : undefined;

  return {
    id,
    name,
    brand,
    city: typeof record.city === "string" ? record.city : undefined,
    address: typeof record.address === "string" ? record.address : undefined,
    postal_code: typeof record.postal_code === "string" ? record.postal_code : undefined,
    latitude: typeof latitude === "number" ? latitude : undefined,
    longitude: typeof longitude === "number" ? longitude : undefined,
    monthly_price: typeof monthlyPrice === "number" ? monthlyPrice : undefined,
    currency: typeof record.currency === "string" ? record.currency : undefined,
    amenities,
    website: typeof record.website === "string" ? record.website : undefined,
    distanceKm: typeof distanceKm === "number" ? distanceKm : undefined,
  } satisfies Gym;
}

function readCachedGyms(): Gym[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { timestamp?: number; data?: unknown };
    if (typeof parsed.timestamp !== "number" || !Array.isArray(parsed.data)) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }

    const normalized = parsed.data
      .map((item) => (item && typeof item === "object" ? normalizeGym(item as Record<string, unknown>) : null))
      .filter((item): item is Gym => Boolean(item));

    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function writeGymsCache(gyms: Gym[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload = {
      timestamp: Date.now(),
      data: gyms,
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Silently ignore storage errors (quota, privacy mode, ...).
  }
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c + Number.EPSILON) * 10) / 10;
}

function formatPrice(price?: number, currency?: string): string | null {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return null;
  }
  const normalized = currency?.toUpperCase() === "EUR" || !currency ? "€" : currency;
  return `${price.toFixed(2)} ${normalized}`;
}

function formatDistance(distance?: number): string | null {
  if (typeof distance !== "number" || Number.isNaN(distance)) {
    return null;
  }
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [visibleGyms, setVisibleGyms] = useState<Gym[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "pending" | "granted" | "denied" | "unavailable" | "error"
  >("idle");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isUsingFallbackCities, setIsUsingFallbackCities] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cached = readCachedGyms();
    if (cached && isMounted) {
      setGyms(cached);
    }

    const loadGyms = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch("/api/proxy?target=gyms&limit=48", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load gyms: ${response.status}`);
        }

        const payload = await response.json();
        const list: unknown = Array.isArray(payload)
          ? payload
          : (payload as { gyms?: unknown }).gyms;

        if (!Array.isArray(list)) {
          throw new Error("Invalid gyms payload");
        }

        const normalized = list
          .map((item) => (item && typeof item === "object" ? normalizeGym(item as Record<string, unknown>) : null))
          .filter((item): item is Gym => Boolean(item));

        if (isMounted) {
          setGyms(normalized);
          writeGymsCache(normalized);
        }
      } catch {
        if (isMounted) {
          setHasError(!cached || cached.length === 0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGyms();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      setLocationMessage(
        "Votre navigateur ne supporte pas la géolocalisation. Nous affichons les principales villes partenaires.",
      );
      setIsUsingFallbackCities(true);
      return;
    }

    setLocationStatus("pending");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("granted");
        setLocationMessage(null);
        setIsUsingFallbackCities(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
          setLocationMessage(
            "Autorisez la localisation pour voir les clubs à proximité. En attendant, voici les plus grandes villes.",
          );
        } else {
          setLocationStatus("error");
          setLocationMessage(
            "Nous n'avons pas pu déterminer votre position. Voici les salles des principales métropoles.",
          );
        }
        setIsUsingFallbackCities(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    if (gyms.length === 0) {
      setVisibleGyms([]);
      return;
    }

    const fallbackRequested =
      !userLocation && ["denied", "unavailable", "error"].includes(locationStatus);

    const enriched = gyms.map((gym) => {
      let distance = gym.distanceKm;
      if (userLocation && typeof gym.latitude === "number" && typeof gym.longitude === "number") {
        distance = computeDistanceKm(userLocation.lat, userLocation.lng, gym.latitude, gym.longitude);
      }

      return { ...gym, distanceKm: distance } satisfies Gym;
    });

    let filtered = enriched;
    let fallbackApplied = false;

    if (fallbackRequested) {
      const majorCities = enriched.filter((gym) =>
        gym.city ? FALLBACK_CITY_SET.has(gym.city.toLowerCase()) : false,
      );
      if (majorCities.length > 0) {
        filtered = majorCities;
        fallbackApplied = true;
      }
    }

    filtered.sort((a, b) => {
      const distanceA = typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
      const distanceB = typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;

      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }

      const cityCompare = (a.city ?? "").localeCompare(b.city ?? "", "fr", { sensitivity: "base" });
      if (cityCompare !== 0) {
        return cityCompare;
      }

      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });

    setIsUsingFallbackCities(fallbackApplied || (fallbackRequested && !fallbackApplied));
    setVisibleGyms(filtered);
  }, [gyms, userLocation, locationStatus]);

  const mapGyms = useMemo(
    () =>
      visibleGyms
        .filter((gym) => typeof gym.latitude === "number" && typeof gym.longitude === "number")
        .slice(0, 60),
    [visibleGyms],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,232,209,0.42),_transparent_65%)]"
        aria-hidden
      />

      <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6">
        <div className="space-y-4 text-center">
          <Badge variant="secondary" size="md" className="mx-auto tracking-[0.32em] uppercase text-[0.68rem]">
            Guide des salles
          </Badge>
          <h1 className="text-4xl font-bold text-[color:var(--text)] sm:text-5xl">
            Salles de sport en France
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted">
            Découvrez les réseaux partenaires FitIdion : comparez les salles autour de vous et rejoignez l&apos;univers qui
            correspond à vos objectifs.
          </p>
          {locationMessage ? (
            <p className="mx-auto max-w-2xl text-sm text-muted">
              {locationMessage}
              {isUsingFallbackCities ? ` (${FALLBACK_CITIES.join(", ")})` : ""}
            </p>
          ) : null}
        </div>

        {mapGyms.length > 0 ? (
          <GymsMap gyms={mapGyms} userLocation={userLocation} />
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGyms.map((gym) => {
            const priceLabel = formatPrice(gym.monthly_price, gym.currency);
            const amenities = Array.isArray(gym.amenities) ? gym.amenities.slice(0, 3) : [];
            const distanceLabel = formatDistance(gym.distanceKm);
            const locationParts = [
              gym.address,
              [gym.postal_code, gym.city].filter(Boolean).join(" "),
              distanceLabel ? `À ${distanceLabel}` : null,
            ].filter(Boolean);
            const location = locationParts.join(" · ");

            return (
              <Card key={gym.id ?? `${gym.name}-${gym.brand}`} className="group h-full p-6">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[color:var(--text)]">{gym.name}</h2>
                      {location ? (
                        <p className="mt-1 inline-flex flex-wrap items-center gap-2 text-sm text-muted">
                          <MapPin className="h-4 w-4" aria-hidden />
                          <span>{location}</span>
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {gym.brand}
                    </Badge>
                  </div>

                  {amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((item) => (
                        <Badge key={`${gym.id}-${item}`} variant="secondary" className="bg-muted/50 text-xs font-medium">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Services premium, coaching et matériel dernière génération.</p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-4 text-sm">
                    {priceLabel ? (
                      <span className="font-semibold text-primary">Abonnement dès {priceLabel} / mois</span>
                    ) : (
                      <span className="text-muted">Tarifs disponibles auprès du club.</span>
                    )}
                    {gym.website ? (
                      <a
                        href={gym.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary transition hover:text-[color:var(--primary-strong)]"
                      >
                        Voir la salle
                      </a>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}

          {visibleGyms.length === 0 && !isLoading && !hasError && (
            <Card className="col-span-full text-center text-sm text-muted">Aucune salle partenaire trouvée.</Card>
          )}
          {isLoading && (
            <Card className="col-span-full text-center text-sm text-muted">Chargement des salles en cours…</Card>
          )}
          {hasError && !isLoading && (
            <Card className="col-span-full text-center text-sm text-red-500">
              Impossible de charger les salles pour le moment.
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
