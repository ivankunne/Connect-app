import type { Metadata } from "next";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = { title: "Søk" };
export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur sm:px-6">
        <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">Søk</h1>
        <p className="text-xs text-muted-foreground">Finn folk, fellesskap og arrangementer</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <SearchClient />
      </div>
    </div>
  );
}
