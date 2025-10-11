export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-secondary/60 bg-white p-4 shadow-sm">
      <div className="h-48 w-full rounded-xl bg-accent/60" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-accent/60" />
        <div className="h-4 w-1/2 rounded-full bg-accent/60" />
      </div>
      <div className="mt-6 space-y-3 rounded-2xl border border-secondary/60 bg-accent p-4">
        <div className="h-3 w-16 rounded-full bg-accent/60" />
        <div className="h-6 w-28 rounded-full bg-accent/60" />
        <div className="h-4 w-20 rounded-full bg-accent/60" />
      </div>
      <div className="mt-4 h-10 rounded-full bg-accent/60" />
    </div>
  );
}
