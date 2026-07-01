export default function Loading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 sm:px-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-5 h-11 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <div className="size-11 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
