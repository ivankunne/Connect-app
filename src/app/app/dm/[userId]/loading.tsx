export default function Loading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 py-3 sm:px-5">
        <div className="size-9 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1 space-y-3 bg-surface p-6">
        {[["start", "60%"], ["end", "45%"], ["start", "70%"], ["end", "35%"]].map(([side, w], i) => (
          <div key={i} className={`flex ${side === "end" ? "justify-end" : "justify-start"}`}>
            <div className="h-10 animate-pulse rounded-2xl bg-muted" style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  );
}
