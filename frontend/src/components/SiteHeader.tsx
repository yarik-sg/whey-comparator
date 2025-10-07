"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";

import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Produits", href: "/products" },
  { label: "Comparateur", href: "/comparison" },
  { label: "Catalogue", href: "/catalogue" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-slate-900"
          onClick={closeMenu}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold sm:text-lg">
            Sport Comparator
          </span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 transition",
                  isActive
                    ? "bg-orange-100 text-orange-600"
                    : "hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/comparison"
            className={`${buttonClassName({ size: "sm" })} hidden shadow-sm md:inline-flex`}
          >
            Lancer une comparaison
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
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3 transition",
                      isActive ? "bg-orange-50 text-orange-600" : "hover:bg-slate-100",
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
