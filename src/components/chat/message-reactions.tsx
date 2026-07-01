"use client";

import { SmilePlus } from "lucide-react";
import type { Reaction } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🙏", "🔥", "👀", "😮"];

export function MessageReactions({
  reactions,
  currentUserId,
  onToggle,
}: {
  reactions: Reaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}) {
  const groups = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const g = groups.get(r.emoji) ?? { count: 0, mine: false };
    g.count += 1;
    if (r.user_id === currentUserId) g.mine = true;
    groups.set(r.emoji, g);
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {[...groups.entries()].map(([emoji, g]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
            g.mine ? "border-primary/40 bg-primary/12 text-primary" : "border-border bg-card hover:bg-secondary",
          )}
        >
          <span>{emoji}</span>
          <span className="font-medium">{g.count}</span>
        </button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-opacity hover:bg-secondary hover:text-foreground",
              groups.size === 0 && "opacity-0 group-hover:opacity-100",
            )}
            aria-label="Legg til reaksjon"
          >
            <SmilePlus className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-1.5">
          <div className="flex gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => onToggle(e)}
                className="flex size-8 items-center justify-center rounded-lg text-lg transition-transform hover:scale-125 hover:bg-secondary"
              >
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
