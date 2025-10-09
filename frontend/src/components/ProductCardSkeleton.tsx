export function ProductCardSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative overflow-hidden rounded-3xl bg-slate-100">
        <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-slate-200" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="space-y-2 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
