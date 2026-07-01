"use client";

import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageComposer({
  onSend,
  placeholder = "Skriv en melding…",
}: {
  onSend: (content: string) => Promise<void> | void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function submit() {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
    await onSend(content);
    setSending(false);
    ref.current?.focus();
  }

  return (
    <div className="shrink-0 border-t border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-1.5 pl-3 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
        <textarea
          ref={ref}
          value={value}
          rows={1}
          onChange={(e) => {
            setValue(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={submit}
          disabled={!value.trim() || sending}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-40",
          )}
          aria-label="Send"
        >
          <SendHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}
