"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Gym = {
  id: string;
  name: string;
  brand: string;
  city?: string;
  address?: string;
  postal_code?: string;
  monthly_price?: number;
  currency?: string;
  amenities?: string[];
  website?: string;
};

function formatPrice(price?: number, currency?: string): string | null {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return null;
  }
  const normalized = currency?.toUpperCase() === "EUR" || !currency ? "€" : currency;
  return `${price.toFixed(2)} ${normalized}`;
}

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadGyms = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch("/api/proxy?target=gyms&limit=24", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load gyms: ${response.status}`);
        }

        const payload = await response.json();
        const list: unknown = Array.isArray(payload) ? payload : (payload as { gyms?: unknown }).gyms;

        if (isMounted && Array.isArray(list)) {
          const normalized: Gym[] = list
            .map((item) => {
              if (!item || typeof item !== "object") {
                return null;
              }

              const record = item as Record<string, unknown>;
              const name = typeof record.name === "string" ? record.name : null;
              const brand = typeof record.brand === "string" ? record.brand : null;
              if (!name || !brand) {
                return null;
              }

              const id =
                typeof record.id === "string"
                  ? record.id
                  : `${brand.replace(/\s+/g, "-")}-${name.replace(/\s+/g, "-")}`.toLowerCase();

              const monthlyPriceRaw = record.monthly_price;
              const monthlyPrice =
                typeof monthlyPriceRaw === "number"
                  ? monthlyPriceRaw
                  : typeof monthlyPriceRaw === "string"
                  ? Number.parseFloat(monthlyPriceRaw)
                  : undefined;

              const amenities = Array.isArray(record.amenities)
                ? (record.amenities.filter((entry) => typeof entry === "string") as string[])
                : undefined;

              return {
                id,
                name,
                brand,
                city: typeof record.city === "string" ? record.city : undefined,
                address: typeof record.address === "string" ? record.address : undefined,
                postal_code: typeof record.postal_code === "string" ? record.postal_code : undefined,
                monthly_price: Number.isFinite(monthlyPrice) ? (monthlyPrice as number) : undefined,
                currency: typeof record.currency === "string" ? record.currency : undefined,
                amenities,
                website: typeof record.website === "string" ? record.website : undefined,
              } satisfies Gym;
            })
            .filter((item): item is Gym => Boolean(item));

          setGyms(normalized);
        }
      } catch (error) {
        console.error("Failed to load gyms", error);
        if (isMounted) {
          setHasError(true);
          setGyms([]);
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,232,209,0.42),_transparent_65%)]" aria-hidden />

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
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gyms.map((gym) => {
            const priceLabel = formatPrice(gym.monthly_price, gym.currency);
            const amenities = Array.isArray(gym.amenities) ? gym.amenities.slice(0, 3) : [];
            const location = [gym.address, [gym.postal_code, gym.city].filter(Boolean).join(" ")]
              .filter(Boolean)
              .join(" · ");

            return (
              <Card key={gym.id ?? `${gym.name}-${gym.brand}`} className="group h-full p-6">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[color:var(--text)]">{gym.name}</h2>
                      {location ? (
                        <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted">
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

          {gyms.length === 0 && !isLoading && !hasError && (
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
