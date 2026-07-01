export default function Loading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 sm:px-6">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-3 px-4 py-6 sm:px-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 animate-pulse rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
