export default function Loading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 sm:px-6">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-1 px-4 py-4 sm:px-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="size-11 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
