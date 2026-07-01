// Shown instantly on navigation (and as the prefetch boundary) so switching
// community / channel / view feels immediate even while data loads.
export default function Loading() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_336px]">
      <div className="flex min-h-0 min-w-0 flex-col">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {[16, 20, 14, 12].map((w, i) => (
              <div key={i} className="h-7 animate-pulse rounded-full bg-muted" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 space-y-5 bg-surface p-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mx-auto flex max-w-3xl gap-3">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="hidden w-[336px] shrink-0 border-l border-border bg-background xl:block">
        <div className="space-y-4 p-5">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-14 animate-pulse rounded-xl bg-muted" />
          <div className="h-14 animate-pulse rounded-xl bg-muted" />
        </div>
      </aside>
    </div>
  );
}
