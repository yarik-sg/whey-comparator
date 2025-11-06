"use client";

import { useEffect, useRef } from "react";

type Coordinates = {
  lat: number;
  lng: number;
};

type GymMarker = {
  id: string;
  name: string;
  brand?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  website?: string;
  distanceKm?: number;
};

type GymsMapProps = {
  gyms: GymMarker[];
  userLocation?: Coordinates | null;
};

// Minimal Leaflet typing to avoid shipping the full dependency in the bundle.
type LeafletMapInstance = {
  remove: () => void;
  setView: (target: any, zoom?: number) => void;
  fitBounds: (bounds: any, options?: any) => void;
  invalidateSize: () => void;
};

type LeafletMarkerInstance = {
  remove: () => void;
  bindPopup: (content: string, options?: any) => void;
};

type LeafletCircleMarkerInstance = LeafletMarkerInstance;

type LeafletLayer<T> = T & { addTo: (map: LeafletMapInstance) => T };

type LeafletModule = {
  map: (container: HTMLElement, options?: any) => LeafletMapInstance;
  tileLayer: (url: string, options?: any) => LeafletLayer<any>;
  marker: (coordinates: [number, number], options?: any) => LeafletLayer<LeafletMarkerInstance>;
  circleMarker: (
    coordinates: [number, number],
    options?: any,
  ) => LeafletLayer<LeafletCircleMarkerInstance>;
  latLng: (lat: number, lng: number) => any;
  latLngBounds: (latLngs: any[]) => any;
};

declare global {
  interface Window {
    L?: LeafletModule;
  }
}

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

const loaderState: { promise: Promise<LeafletModule> | null } = { promise: null };

function ensureLeafletStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.querySelector('link[data-leaflet="true"]')) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_URL;
  link.dataset.leaflet = "true";
  document.head.appendChild(link);
}

async function loadLeaflet(): Promise<LeafletModule> {
  if (typeof window === "undefined") {
    throw new Error("Leaflet is only available in the browser");
  }

  if (window.L) {
    return window.L as LeafletModule;
  }

  if (!loaderState.promise) {
    loaderState.promise = new Promise<LeafletModule>((resolve, reject) => {
      ensureLeafletStyles();

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.L) {
            resolve(window.L as LeafletModule);
          } else {
            reject(new Error("Leaflet failed to initialise"));
          }
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("Unable to load Leaflet"));
        });
        return;
      }

      const script = document.createElement("script");
      script.src = LEAFLET_JS_URL;
      script.async = true;
      script.dataset.leaflet = "true";
      script.onload = () => {
        if (window.L) {
          resolve(window.L as LeafletModule);
        } else {
          reject(new Error("Leaflet failed to initialise"));
        }
      };
      script.onerror = () => {
        reject(new Error("Unable to load Leaflet"));
      };
      document.body.appendChild(script);
    }).catch((error) => {
      loaderState.promise = null;
      throw error;
    });
  }

  return loaderState.promise;
}

const FRANCE_CENTER: Coordinates = { lat: 46.2276, lng: 2.2137 };

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function GymsMap({ gyms, userLocation }: GymsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markersRef = useRef<LeafletMarkerInstance[]>([]);
  const userMarkerRef = useRef<LeafletCircleMarkerInstance | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadLeaflet()
      .then((L) => {
        if (!isMounted || !containerRef.current) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current, {
            center: userLocation ? [userLocation.lat, userLocation.lng] : [FRANCE_CENTER.lat, FRANCE_CENTER.lng],
            zoom: userLocation ? 12 : 5,
            zoomControl: true,
          });

          L.tileLayer(TILE_LAYER_URL, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 19,
          }).addTo(mapRef.current);

          setTimeout(() => {
            mapRef.current?.invalidateSize();
          }, 0);
        }

        updateMarkers(L);
        fitBounds(L);
      })
      .catch(() => {
        // The map is optional – silently ignore loading failures.
      });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms, userLocation?.lat, userLocation?.lng]);

  function updateMarkers(L: LeafletModule) {
    if (!mapRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    const validGyms = gyms.filter(
      (gym) => typeof gym.latitude === "number" && typeof gym.longitude === "number",
    );

    for (const gym of validGyms) {
      const marker = L.marker([gym.latitude as number, gym.longitude as number]).addTo(
        mapRef.current!,
      );
      const parts = [
        gym.address,
        gym.city,
        typeof gym.distanceKm === "number"
          ? `${gym.distanceKm.toFixed(1)} km`
          : undefined,
      ].filter(Boolean);

      const description = parts.length > 0 ? `<p class="mt-1 text-sm">${parts.join(" · ")}</p>` : "";
      const link =
        gym.website && typeof gym.website === "string"
          ? `<p class="mt-2"><a href="${gym.website}" target="_blank" rel="noopener noreferrer">Voir la salle</a></p>`
          : "";

      marker.bindPopup(
        `<div class="text-left"><h3 class="font-semibold">${gym.name}</h3><p class="text-xs text-muted-foreground">${
          gym.brand ?? ""
        }</p>${description}${link}</div>`,
        {
          closeButton: true,
        },
      );
      markersRef.current.push(marker);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && mapRef.current) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.7,
        weight: 2,
      }).addTo(mapRef.current);
      userMarkerRef.current.bindPopup("Vous êtes ici");
    }
  }

  function fitBounds(L: LeafletModule) {
    if (!mapRef.current) {
      return;
    }

    const points: Array<ReturnType<LeafletModule["latLng"]>> = [];
    const validGyms = gyms.filter(
      (gym) => typeof gym.latitude === "number" && typeof gym.longitude === "number",
    );

    for (const gym of validGyms) {
      points.push(L.latLng(gym.latitude as number, gym.longitude as number));
    }

    if (userLocation) {
      points.push(L.latLng(userLocation.lat, userLocation.lng));
    }

    if (points.length === 0) {
      mapRef.current.setView([FRANCE_CENTER.lat, FRANCE_CENTER.lng], 5);
      return;
    }

    if (points.length === 1) {
      mapRef.current.setView(points[0], userLocation ? 13 : 12);
      return;
    }

    const bounds = L.latLngBounds(points);
    mapRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-muted/20"
    />
  );
}
