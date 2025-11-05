"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Gym = {
  name: string;
  link: string;
  brand: string;
};

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);

  useEffect(() => {
    fetch("/api/proxy?target=gyms&limit=12")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGyms(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load gyms", error);
      });
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
          {gyms.map((gym) => (
            <Card key={`${gym.name}-${gym.brand}`} className="group h-full">
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[color:var(--text)]">{gym.name}</h2>
                  <Badge variant="outline" className="text-xs font-medium">
                    Réseau
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  Sélectionnée pour sa qualité d&apos;accompagnement et son matériel premium.
                </p>
                <div className="mt-auto flex items-center justify-between text-sm text-muted">
                  <span className="inline-flex items-center gap-2 font-medium text-primary">
                    <MapPin className="h-4 w-4" aria-hidden />
                    {gym.brand}
                  </span>
                  <a
                    href={gym.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary transition hover:text-[color:var(--primary-strong)]"
                  >
                    Voir la salle
                  </a>
                </div>
              </div>
            </Card>
          ))}
          {gyms.length === 0 && (
            <Card className="col-span-full text-center text-sm text-muted">
              Chargement des salles en cours…
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
