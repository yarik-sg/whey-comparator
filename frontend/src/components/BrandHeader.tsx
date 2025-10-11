"use client";

import Link from "next/link";

export function BrandHeader() {
  return (
    <div className="hidden w-full bg-gradient-to-r from-primary via-primary to-secondary/80 text-sm text-white shadow-glow sm:block">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:flex-nowrap sm:px-6">
        <p className="font-medium tracking-tight">
          FitIdion — Plateforme du Fitness Intelligent pour comparer, suivre et optimiser vos achats sport.
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-white/25"
        >
          Découvrir les nouveautés
        </Link>
      </div>
    </div>
  );
}
