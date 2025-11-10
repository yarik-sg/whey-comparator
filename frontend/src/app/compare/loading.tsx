export default function LoadingComparePage() {
  return (
    <main className="min-h-screen bg-[color:var(--accent)] pb-24 pt-16 text-[color:var(--text)]">
      <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
        <header className="space-y-3 text-center">
          <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-[color:var(--border-soft)]/60" />
          <div className="mx-auto h-8 w-3/4 max-w-xl animate-pulse rounded-full bg-[color:var(--border-soft)]/70" />
          <div className="mx-auto h-4 w-2/3 max-w-lg animate-pulse rounded-full bg-[color:var(--border-soft)]/50" />
        </header>

        <section className="grid gap-8 lg:grid-cols-[320px,1fr]">
          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
            <div className="mb-6 h-72 w-full animate-pulse rounded-2xl bg-[color:var(--border-soft)]/40" />
            <div className="space-y-4">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[color:var(--border-soft)]/60" />
              <div className="h-6 w-full animate-pulse rounded-full bg-[color:var(--border-soft)]/70" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-[color:var(--border-soft)]/50" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-[color:var(--border-soft)]/40" />
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
            <div className="h-6 w-1/3 animate-pulse rounded-full bg-[color:var(--border-soft)]/60" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-[color:var(--border-soft)]/50" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--border-soft)]/60 bg-[color:var(--surface-strong)]/60 p-4"
                >
                  <div className="h-4 w-28 animate-pulse rounded-full bg-[color:var(--border-soft)]/60" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-[color:var(--border-soft)]/60" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-[color:var(--border-soft)]/40" />
                  <div className="h-4 w-20 animate-pulse rounded-full bg-[color:var(--border-soft)]/50" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
