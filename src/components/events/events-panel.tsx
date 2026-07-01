"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { EventWithMeta } from "@/lib/types";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventDetailDialog } from "@/components/events/event-detail-dialog";
import { Button } from "@/components/ui/button";
import { eventDateShort, eventDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export function EventsPanel({
  communityId,
  currentUserId,
  events: initial,
}: {
  communityId: string;
  currentUserId: string;
  events: EventWithMeta[];
}) {
  const supabase = createClient();
  const [events, setEvents] = useState(initial);
  const [detail, setDetail] = useState<EventWithMeta | null>(null);

  const [now] = useState(() => Date.now());
  const { upcoming, past } = useMemo(() => {
    const up: EventWithMeta[] = [];
    const pa: EventWithMeta[] = [];
    for (const e of events) (new Date(e.datetime).getTime() >= now ? up : pa).push(e);
    return { upcoming: up, past: pa.reverse() };
  }, [events, now]);

  async function toggleRsvp(ev: EventWithMeta) {
    const going = ev.is_going;
    // Optimistic update.
    setEvents((prev) =>
      prev.map((e) =>
        e.id === ev.id
          ? { ...e, is_going: !going, attendee_count: (e.attendee_count ?? 0) + (going ? -1 : 1) }
          : e,
      ),
    );

    if (going) {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", ev.id)
        .eq("user_id", currentUserId);
      if (error) toast.error("Kunne ikke oppdatere");
    } else {
      const { error } = await supabase
        .from("event_attendees")
        .upsert({ event_id: ev.id, user_id: currentUserId, status: "going" }, { onConflict: "event_id,user_id" });
      if (error) toast.error("Kunne ikke oppdatere");
      else toast.success("Du deltar 🎉");
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Arrangementer</h2>
            <p className="text-sm text-muted-foreground">Møt folk fra fellesskapet ansikt til ansikt.</p>
          </div>
          <CreateEventDialog communityId={communityId} currentUserId={currentUserId} />
        </div>

        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyEvents communityId={communityId} currentUserId={currentUserId} />
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} onRsvp={() => toggleRsvp(e)} onOpen={() => setDetail(e)} />
            ))}
            {past.length > 0 && (
              <>
                <div className="pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tidligere
                </div>
                {past.map((e) => (
                  <EventCard key={e.id} event={e} past onRsvp={() => toggleRsvp(e)} onOpen={() => setDetail(e)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {detail && (
        <EventDetailDialog
          event={detail}
          currentUserId={currentUserId}
          open={!!detail}
          onOpenChange={(v) => !v && setDetail(null)}
        />
      )}
    </div>
  );
}

function EventCard({
  event,
  past,
  onRsvp,
  onOpen,
}: {
  event: EventWithMeta;
  past?: boolean;
  onRsvp: () => void;
  onOpen: () => void;
}) {
  const d = eventDateShort(event.datetime);
  const full =
    event.max_attendees != null && (event.attendee_count ?? 0) >= event.max_attendees && !event.is_going;

  return (
    <div
      className={cn(
        "group flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        past && "opacity-70",
      )}
    >
      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
        <span className="text-lg font-bold leading-none">{d.day}</span>
        <span className="text-xs uppercase">{d.month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <button onClick={onOpen} className="text-left">
          <h3 className="font-semibold leading-tight hover:text-primary">{event.title}</h3>
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 capitalize">
            <CalendarDays className="size-3.5" /> {eventDateTime(event.datetime)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {event.attendee_count ?? 0} deltar
          </span>
        </div>
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{event.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          {!past && (
            <Button
              size="sm"
              variant={event.is_going ? "secondary" : "default"}
              onClick={onRsvp}
              disabled={full}
            >
              {event.is_going ? (
                <>
                  <Check className="size-4" /> Du deltar
                </>
              ) : full ? (
                "Fullt"
              ) : (
                "Delta"
              )}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onOpen}>
            Se detaljer
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyEvents({ communityId, currentUserId }: { communityId: string; currentUserId: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">📅</div>
      <h3 className="font-semibold">Ingen arrangementer ennå</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Vær den som starter noe. Et første møte er ofte begynnelsen på et fellesskap.
      </p>
      <div className="mt-4">
        <CreateEventDialog communityId={communityId} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
