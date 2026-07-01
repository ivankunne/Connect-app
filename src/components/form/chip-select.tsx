"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95",
              active
                ? "border-primary bg-primary/12 text-primary"
                : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-secondary",
            )}
          >
            {active && <Check className="size-3.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
