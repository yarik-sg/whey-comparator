"use client";

import Link from "next/link";

export function BrandHeader() {
  return (
    <div className="hidden w-full border-b border-accent/60 bg-background py-2 text-sm text-text shadow-neo dark:border-accent-d/40 dark:bg-[var(--background)] dark:text-[var(--text-2)] sm:block">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <p className="flex items-center gap-2 font-medium">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
            🏋️
          </span>
          FitIdion — La plateforme du Fitness Intelligent.
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-neo transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
        >
          Découvrir les nouveautés
        </Link>
      </div>
    </div>
  );
}
