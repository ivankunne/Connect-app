"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

interface MentionUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

export function MessageComposer({
  onSend,
  onType,
  placeholder = "Skriv en melding…",
  communityId,
  currentUserId,
}: {
  onSend: (content: string, imageUrl?: string | null) => Promise<void> | void;
  onType?: () => void;
  placeholder?: string;
  communityId?: string;
  currentUserId?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mentions, setMentions] = useState<MentionUser[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  // @mention autocomplete: look at the word being typed.
  async function maybeMention(text: string) {
    if (!communityId) return;
    const match = /(?:^|\s)@(\w{1,})$/.exec(text.slice(0, ref.current?.selectionStart ?? text.length));
    if (!match) {
      setMentions([]);
      return;
    }
    const q = match[1].toLowerCase();
    const { data } = await supabase
      .from("memberships")
      .select("user:profiles(id,name,avatar_url)")
      .eq("community_id", communityId)
      .limit(50);
    const people = ((data ?? []).map((r: Record<string, unknown>) => r.user).filter(Boolean) as MentionUser[])
      .filter((u) => u.name.toLowerCase().includes(q))
      .slice(0, 5);
    setMentions(people);
  }

  function pickMention(u: MentionUser) {
    const firstName = u.name.split(" ")[0];
    setValue((v) => v.replace(/@(\w*)$/, `@${firstName} `));
    setMentions([]);
    ref.current?.focus();
  }

  async function handleFile(file: File) {
    if (!currentUserId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${currentUserId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat").upload(path, file, { upsert: true });
      if (error) throw error;
      setImage(supabase.storage.from("chat").getPublicUrl(path).data.publicUrl);
    } catch {
      toast.error("Kunne ikke laste opp bildet");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const content = value.trim();
    if ((!content && !image) || sending) return;
    setSending(true);
    const img = image;
    setValue("");
    setImage(null);
    if (ref.current) ref.current.style.height = "auto";
    await onSend(content, img);
    setSending(false);
    ref.current?.focus();
  }

  return (
    <div className="relative shrink-0 border-t border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
      {mentions.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-60 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg sm:left-6">
          {mentions.map((u) => (
            <button
              key={u.id}
              onClick={() => pickMention(u)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary"
            >
              <UserAvatar name={u.name} avatarUrl={u.avatar_url} seed={u.id} className="size-6" />
              {u.name}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        {image && (
          <div className="relative mb-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Vedlegg" className="max-h-32 rounded-lg border border-border" />
            <button
              onClick={() => setImage(null)}
              className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-1.5 pl-1.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
          {currentUserId && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Legg ved bilde"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </>
          )}
          <textarea
            ref={ref}
            value={value}
            rows={1}
            onChange={(e) => {
              setValue(e.target.value);
              grow();
              onType?.();
              maybeMention(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && mentions.length === 0) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[0.95rem] outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={submit}
            disabled={(!value.trim() && !image) || sending}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-40",
            )}
            aria-label="Send"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
