import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className={className} aria-label="Fil d'ariane">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <li className="inline-flex items-center gap-1 text-muted">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full bg-accent/70 px-3 py-1 font-medium text-muted transition hover:bg-secondary/60 hover:text-primary"
          >
            <Home className="h-4 w-4" aria-hidden />
            Accueil
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted/70" aria-hidden />
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-muted">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
