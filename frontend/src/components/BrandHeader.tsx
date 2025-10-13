"use client";

import Link from "next/link";

export function BrandHeader() {
  return (
    <div className="hidden w-full bg-gradient-to-r from-fitidion-orange/90 via-fitidion-orange to-fitidion-gold/90 text-sm text-white shadow-glow sm:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
        <p className="font-medium tracking-tight">
          FitIdion · La plateforme du fitness intelligent pour suivre, comparer et optimiser vos achats sport.
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
