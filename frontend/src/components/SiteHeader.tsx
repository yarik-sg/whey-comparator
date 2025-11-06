"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Flame, Menu, Sparkles, X } from "lucide-react";

import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Produits", href: "/products" },
  { label: "Programmes", href: "/programmes" },
  { label: "Équipements", href: "/equipements" },
  { label: "Salles", href: "/gyms" },
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Favoris", href: "/favoris" },
  { label: "Analyse", href: "/analyse" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-accent/60 bg-background/95 text-dark shadow-neo backdrop-blur-md transition-colors duration-200 dark:border-accent-d/40 dark:bg-dark/90 dark:text-[var(--text)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-3 text-lg font-semibold text-dark transition hover:text-primary dark:text-[var(--text)]"
          onClick={closeMenu}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-neo transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
            <Flame className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col text-base font-semibold leading-tight sm:text-lg">
            FitIdion
            <span className="text-xs font-medium uppercase tracking-[0.4em] text-muted">
              La plateforme du Fitness Intelligent
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
                  "rounded-full px-4 py-2 transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "hover:bg-accent hover:text-primary",
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
          <Link href="/comparateur" className={cn(buttonClassName({ size: "sm" }), "hidden md:inline-flex")}> 
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
          className="border-t border-accent/50 bg-background/95 px-4 py-4 text-dark backdrop-blur-md md:hidden dark:border-accent-d/40 dark:bg-dark/95 dark:text-[var(--text)]"
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
                      "flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-primary",
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
