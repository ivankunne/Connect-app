"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Author, EventWithMeta } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { MessageComposer } from "@/components/chat/message-composer";
import { Badge } from "@/components/ui/badge";
import { eventDateTime, relativeTime } from "@/lib/time";
import { flagFor } from "@/lib/countries";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: Author | null;
}

const AUTHOR_COLS = "id,name,avatar_url,current_country,home_country";

export function EventDetailDialog({
  event,
  currentUserId,
  open,
  onOpenChange,
}: {
  event: EventWithMeta;
  currentUserId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [attendees, setAttendees] = useState<Author[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    (async () => {
      const [{ data: att }, { data: cmt }] = await Promise.all([
        supabase
          .from("event_attendees")
          .select(`user:profiles(${AUTHOR_COLS})`)
          .eq("event_id", event.id)
          .eq("status", "going"),
        supabase
          .from("event_comments")
          .select(`*, author:profiles(${AUTHOR_COLS})`)
          .eq("event_id", event.id)
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setAttendees(((att ?? []).map((r: Record<string, unknown>) => r.user).filter(Boolean)) as Author[]);
      setComments((cmt ?? []) as unknown as Comment[]);
    })();

    const sub = supabase
      .channel(`event:${event.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_comments", filter: `event_id=eq.${event.id}` },
        async (payload) => {
          const row = payload.new as Comment;
          const { data } = await supabase.from("profiles").select(AUTHOR_COLS).eq("id", row.user_id).maybeSingle();
          setComments((prev) =>
            prev.some((c) => c.id === row.id) ? prev : [...prev, { ...row, author: (data as Author) ?? null }],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(sub);
    };
  }, [open, event.id, supabase]);

  async function sendComment(content: string) {
    const { error } = await supabase
      .from("event_comments")
      .insert({ event_id: event.id, user_id: currentUserId, content });
    if (error) toast.error("Kunne ikke sende kommentar");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="gap-3 p-6 pb-4">
          <DialogTitle className="pr-6 text-xl">{event.title}</DialogTitle>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span className="capitalize">{eventDateTime(event.datetime)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                {event.location}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {attendees.length} deltar
              {event.max_attendees ? ` · maks ${event.max_attendees}` : ""}
            </div>
          </div>
          {event.description && (
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{event.description}</p>
          )}
          {attendees.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {attendees.slice(0, 12).map((a) => (
                <span key={a.id} className="flex items-center gap-1 rounded-full bg-secondary py-0.5 pl-0.5 pr-2 text-xs">
                  <UserAvatar name={a.name} avatarUrl={a.avatar_url} seed={a.id} className="size-5" />
                  {a.name.split(" ")[0]}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="border-t border-border bg-surface">
          <div className="flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-muted-foreground">
            <Badge variant="muted">Samtale</Badge>
            {comments.length} kommentarer
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto px-6 pb-3 scrollbar-thin">
            {comments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Ingen kommentarer ennå. Start praten!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <UserAvatar name={c.author?.name} avatarUrl={c.author?.avatar_url} seed={c.user_id} className="size-7" />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium">{c.author?.name || "Ukjent"}</span>
                      {c.author?.home_country && <span className="text-xs">{flagFor(c.author.home_country)}</span>}
                      <span className="text-[0.7rem] text-muted-foreground">{relativeTime(c.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <MessageComposer onSend={sendComment} placeholder="Skriv en kommentar…" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
