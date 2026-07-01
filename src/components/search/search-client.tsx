"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, Search as SearchIcon, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Community, EventWithMeta, Profile } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { CommunityAvatar } from "@/components/community-avatar";
import { eventDateTime } from "@/lib/time";
import { flagFor } from "@/lib/countries";

type Results = {
  users: Pick<Profile, "id" | "name" | "avatar_url" | "home_country" | "current_country" | "city">[];
  communities: (Community & { member_count?: number })[];
  events: (EventWithMeta & { community?: { id: string; name: string } | null })[];
};

const EMPTY: Results = { users: [], communities: [], events: [] };

export function SearchClient() {
  const supabase = useMemo(() => createClient(), []);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    const like = `%${term}%`;
    const delay = term.length < 2 ? 0 : 250;
    const handle = setTimeout(async () => {
      if (term.length < 2) {
        setResults(EMPTY);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [users, communities, events] = await Promise.all([
        supabase.from("profiles").select("id,name,avatar_url,home_country,current_country,city").ilike("name", like).limit(8),
        supabase.from("communities_with_counts").select("*").ilike("name", like).limit(8),
        supabase
          .from("events")
          .select("id,title,datetime,location,community:communities(id,name)")
          .ilike("title", like)
          .order("datetime", { ascending: true })
          .limit(8),
      ]);
      setResults({
        users: (users.data ?? []) as Results["users"],
        communities: (communities.data ?? []) as Results["communities"],
        events: (events.data ?? []) as unknown as Results["events"],
      });
      setLoading(false);
    }, delay);
    return () => clearTimeout(handle);
  }, [q, supabase]);

  const hasResults =
    results.users.length + results.communities.length + results.events.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søk etter folk, fellesskap eller arrangementer…"
          className="h-12 pl-10 text-base"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {q.trim().length < 2 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Skriv minst to tegn for å søke.</p>
      ) : !hasResults && !loading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Ingen treff på «{q}».</p>
      ) : (
        <div className="mt-6 space-y-6">
          {results.communities.length > 0 && (
            <Section title="Fellesskap">
              {results.communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/c/${c.id}?view=chat&channel=general`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar">
                    <CommunityAvatar community={c} className="size-9 text-lg" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.member_count ?? 0} medlemmer</p>
                  </div>
                </Link>
              ))}
            </Section>
          )}

          {results.users.length > 0 && (
            <Section title="Folk">
              {results.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/app/u/${u.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <UserAvatar name={u.name} avatarUrl={u.avatar_url} seed={u.id} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {flagFor(u.home_country)} {u.home_country} · bor i {u.city || u.current_country}
                    </p>
                  </div>
                </Link>
              ))}
            </Section>
          )}

          {results.events.length > 0 && (
            <Section title="Arrangementer">
              {results.events.map((e) => (
                <Link
                  key={e.id}
                  href={e.community ? `/app/c/${e.community.id}?view=events` : "#"}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="truncate text-xs capitalize text-muted-foreground">{eventDateTime(e.datetime)}</p>
                  </div>
                  {e.community && <Badge variant="muted">{e.community.name}</Badge>}
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Users className="size-3.5" /> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
