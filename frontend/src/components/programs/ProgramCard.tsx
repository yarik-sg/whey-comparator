"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1f2937" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#gradient)" />
      <g fill="#F9FAFB" font-family="'Inter', 'Segoe UI', sans-serif" text-anchor="middle">
        <text x="50%" y="46%" font-size="48" font-weight="600">FitIdion</text>
        <text x="50%" y="60%" font-size="18" fill="#9CA3AF">Programme</text>
      </g>
    </svg>
  `);

export type Programme = {
  id: string;
  nom: string;
  objectif: string;
  niveau: string;
  duree_programme?: string;
  description?: string;
  image?: string | null;
  astuces?: string[];
  nutrition?: string[];
  exercices: Array<{
    nom: string;
    machine?: string;
    duree: string;
    series: string;
    repetitions: string;
    image?: string | null;
  }>;
};

interface ProgramCardProps {
  programme: Programme;
}

export function ProgramCard({ programme }: ProgramCardProps) {
  const coverImage = programme.image ?? DEFAULT_IMAGE;

  return (
    <Card className="flex h-full flex-col overflow-hidden border-none bg-[color:var(--accent)]/80 text-[color:var(--text)] shadow-soft">
      <div className="relative h-56 w-full">
        <Image
          src={coverImage}
          alt={`Illustration du programme ${programme.nom}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
      </div>

      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
            {programme.objectif}
          </Badge>
          <Badge className="rounded-full bg-primary/10 text-primary">
            {programme.niveau}
          </Badge>
          {programme.duree_programme ? (
            <Badge variant="muted" className="rounded-full bg-white/10 text-xs uppercase tracking-[0.2em] text-[color:var(--text)]/80">
              {programme.duree_programme}
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-2xl font-semibold">{programme.nom}</CardTitle>
        {programme.description ? (
          <p className="text-sm text-[color:var(--text)]/70">{programme.description}</p>
        ) : null}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]/60">
          Exercices clés
        </h3>
        <ul className="space-y-4">
          {programme.exercices.map((exercice) => {
            const exerciseImage = exercice.image ?? DEFAULT_IMAGE;

            return (
              <li key={`${programme.id}-${exercice.nom}`} className="flex gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/10">
                  <Image
                    src={exerciseImage}
                    alt={`Exercice ${exercice.nom}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 space-y-1 text-sm">
                  <p className="font-semibold text-[color:var(--text)]">{exercice.nom}</p>
                  {exercice.machine ? (
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--text)]/60">
                      Machine : {exercice.machine}
                    </p>
                  ) : null}
                  <p className="text-[color:var(--text)]/70">
                    Durée : {exercice.duree} • Séries : {exercice.series} • Répétitions : {exercice.repetitions}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {programme.astuces?.length ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]/60">
              Astuces & conseils
            </h3>
            <ul className="space-y-2 text-sm text-[color:var(--text)]/80">
              {programme.astuces.map((tip) => (
                <li key={`${programme.id}-${tip}`} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {programme.nutrition?.length ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]/60">
              Recommandations nutrition
            </h3>
            <ul className="space-y-2 text-sm text-[color:var(--text)]/80">
              {programme.nutrition.map((tip) => (
                <li key={`${programme.id}-nutrition-${tip}`} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="border-t border-white/10 py-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text)]/60">
          Programme signé FitIdion
        </p>
      </CardFooter>
    </Card>
  );
}
