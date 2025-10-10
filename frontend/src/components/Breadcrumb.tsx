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
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <li className="inline-flex items-center gap-1 text-slate-600">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 transition hover:bg-orange-100 hover:text-orange-600"
          >
            <Home className="h-4 w-4" aria-hidden />
            Accueil
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-orange-500">
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-700">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
