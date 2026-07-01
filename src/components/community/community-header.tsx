"use client";

import Link from "next/link";
import { CalendarDays, MessagesSquare, Newspaper } from "lucide-react";
import type { CommunityWithCount } from "@/lib/types";
import type { MessageCategory } from "@/lib/database.types";
import type { AppView } from "@/lib/constants";
import { CHANNELS } from "@/lib/constants";
import { communityGlyph } from "@/components/community-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VIEWS: { key: AppView; label: string; icon: typeof MessagesSquare }[] = [
  { key: "chat", label: "Chat", icon: MessagesSquare },
  { key: "events", label: "Arrangementer", icon: CalendarDays },
  { key: "feed", label: "Feed", icon: Newspaper },
];

const TYPE_BADGE: Record<string, string> = {
  hybrid: "Ditt folk i byen",
  diaspora: "Diaspora",
  city: "By",
  country: "Land",
  global: "Global",
};

export function CommunityHeader({
  community,
  view,
  channel,
}: {
  community: CommunityWithCount;
  view: AppView;
  channel: MessageCategory;
}) {
  const base = `/app/c/${community.id}`;
  return (
    <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-lg">
          {community.type === "global" ? "🌍" : communityGlyph(community)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight">{community.name}</h1>
            <Badge variant="muted" className="hidden sm:inline-flex">
              {TYPE_BADGE[community.type]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {community.member_count} {community.member_count === 1 ? "medlem" : "medlemmer"}
          </p>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-muted p-1">
          {VIEWS.map((v) => {
            const active = v.key === view;
            const href = v.key === "chat" ? `${base}?view=chat&channel=general` : `${base}?view=${v.key}`;
            return (
              <Link
                key={v.key}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="size-4" />
                <span className="hidden sm:inline">{v.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {view === "chat" && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 no-scrollbar sm:px-5">
          {CHANNELS.map((ch) => {
            const active = ch.key === channel;
            return (
              <Link
                key={ch.key}
                href={`${base}?view=chat&channel=${ch.key}`}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <ch.icon className="size-3.5" />
                {ch.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
