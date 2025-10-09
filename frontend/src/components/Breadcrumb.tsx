import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={className} aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="inline-flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />}
              {isLast ? (
                <span className="font-medium text-slate-700">{item.label}</span>
              ) : (
                <Link href={item.href} className="transition hover:text-orange-500">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
