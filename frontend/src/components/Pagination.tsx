"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const goToPage = (target: number) => {
    if (disabled) {
      return;
    }
    const clamped = Math.min(Math.max(target, 1), totalPages);
    if (clamped !== page) {
      onPageChange(clamped);
    }
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:flex-row sm:justify-between"
    >
      <p>
        Page <strong>{page}</strong> sur <strong>{totalPages || 1}</strong>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrev || disabled}
          className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={!hasNext || disabled}
          className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </nav>
  );
}
