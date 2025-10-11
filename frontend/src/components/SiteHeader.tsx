"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Flame, Menu, Sparkles, X } from "lucide-react";

import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Plateforme", href: "/" },
  { label: "Comparateur", href: "/comparateur" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Analyses", href: "/products" },
  { label: "Alertes", href: "/alerts" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-xl transition dark:border-white/10 dark:bg-slate-900/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-3 text-lg font-semibold text-slate-900 transition hover:text-fitidion-orange dark:text-white"
          onClick={closeMenu}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fitidion-orange via-fitidion-orange to-fitidion-gold text-white shadow-glow transition group-hover:shadow-fitidion">
            <Flame className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col text-base font-semibold leading-tight sm:text-lg">
            FitIdion
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted">
              Fitness intelligent
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium text-muted md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 transition",
                  isActive
                    ? "bg-fitidion-orange/10 text-fitidion-orange"
                    : "hover:bg-fitidion-orange/5 hover:text-fitidion-orange",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          <Link
            href="/comparateur"
            className={cn(
              buttonClassName({ size: "sm" }),
              "hidden rounded-full bg-fitidion-orange px-6 text-white shadow-glow transition hover:bg-fitidion-orange/90 md:inline-flex",
            )}
          >
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            Lancer FitIdion
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <span className="sr-only">Basculer la navigation</span>
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          className="border-t border-white/30 bg-white/90 px-4 py-4 backdrop-blur md:hidden dark:border-white/10 dark:bg-slate-900/90"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Thème</p>
            <ThemeToggle />
          </div>
          <ul className="flex flex-col gap-2 text-sm font-medium text-muted">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3 transition",
                      isActive
                        ? "bg-fitidion-orange/10 text-fitidion-orange"
                        : "hover:bg-fitidion-orange/5 hover:text-fitidion-orange",
                    )}
                  >
                    <span>{item.label}</span>
                    {isActive && <span aria-hidden>•</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
