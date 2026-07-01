import Link from "next/link";
import { ArrowUpRight, CalendarDays, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CommunityWithCount, Author } from "@/lib/types";
import { broaderSuggestion } from "@/lib/communities";
import { QUIET_THRESHOLD } from "@/lib/constants";
import { UserAvatar } from "@/components/user-avatar";
import { CommunityAvatar } from "@/components/community-avatar";
import { eventDateShort } from "@/lib/time";

export async function ContextPanel({
  community,
  myCommunities,
  currentUserId,
}: {
  community: CommunityWithCount;
  myCommunities: CommunityWithCount[];
  currentUserId: string;
}) {
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const [{ data: memberRows }, { data: events }] = await Promise.all([
    supabase
      .from("memberships")
      .select("user:profiles(id,name,avatar_url,home_country)")
      .eq("community_id", community.id)
      .limit(14),
    supabase
      .from("events")
      .select("id,title,datetime")
      .eq("community_id", community.id)
      .gte("datetime", nowIso)
      .order("datetime", { ascending: true })
      .limit(3),
  ]);

  const members = ((memberRows ?? []).map((r: Record<string, unknown>) => r.user).filter(Boolean)) as Author[];
  const quiet = community.member_count < QUIET_THRESHOLD && community.type !== "global";
  const suggestion = quiet ? broaderSuggestion(community, myCommunities) : null;

  return (
    <aside className="hidden min-h-0 w-[336px] shrink-0 overflow-y-auto border-l border-border bg-background scrollbar-thin xl:block">
      <div className="space-y-5 p-5">
        {/* About */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-xl">
              {community.type === "global" ? "🌍" : <CommunityAvatarGlyph community={community} />}
            </span>
            <div>
              <h2 className="font-semibold leading-tight">{community.name}</h2>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" /> {community.member_count} medlemmer
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{communityBlurb(community)}</p>
        </section>

        {/* Quiet-community nudge (empty-state system §7) */}
        {quiet && (
          <section className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Sparkles className="size-4" /> Det er stille her – foreløpig
            </div>
            <p className="text-sm text-muted-foreground">
              Dette fellesskapet er nytt. {suggestion ? "Mens det vokser, finner du flere folk her:" : "Vær den som starter praten – flere kommer til."}
            </p>
            {suggestion && (
              <Link
                href={`/app/c/${suggestion.id}?view=chat&channel=general`}
                className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
              >
                <span className="flex items-center gap-2">
                  <CommunityAvatarGlyph community={suggestion} />
                  {suggestion.name}
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            )}
          </section>
        )}

        {/* Upcoming events */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kommende arrangementer
            </h3>
            <Link href={`/app/c/${community.id}?view=events`} className="text-xs text-primary hover:underline">
              Alle
            </Link>
          </div>
          {events && events.length > 0 ? (
            <div className="space-y-2">
              {events.map((e) => {
                const d = eventDateShort(e.datetime);
                return (
                  <Link
                    key={e.id}
                    href={`/app/c/${community.id}?view=events`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-sm font-bold leading-none">{d.day}</span>
                      <span className="text-[0.6rem] uppercase">{d.month}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">kl. {d.time}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              <CalendarDays className="mx-auto mb-1 size-4" />
              Ingen planlagte arrangementer
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Medlemmer
          </h3>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <Link key={m.id} href={m.id === currentUserId ? "/app/profile" : `/app/u/${m.id}`} title={m.name}>
                <UserAvatar name={m.name} avatarUrl={m.avatar_url} seed={m.id} className="size-9 ring-2 ring-background transition-transform hover:scale-110" />
              </Link>
            ))}
            {community.member_count > members.length && (
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                +{community.member_count - members.length}
              </span>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}

function CommunityAvatarGlyph({ community }: { community: CommunityWithCount }) {
  return <CommunityAvatar community={community} className="size-7 bg-transparent text-base shadow-none" />;
}

function communityBlurb(c: CommunityWithCount): string {
  switch (c.type) {
    case "global":
      return "Hele HomeLink samlet på ett sted. Si hei til folk fra hele verden.";
    case "country":
      return `Alle som bor i ${c.country}. Del erfaringer om livet her.`;
    case "city":
      return `Naboer i ${c.city}. Finn lokale tips, folk og arrangementer.`;
    case "diaspora":
      return `Folk med røtter i ${c.home_country} som bor i ${c.country}. Ditt folk, litt nærmere.`;
    case "hybrid":
      return `${c.home_country}-fellesskapet i ${c.city}. Så lokalt og hjemlig som det blir.`;
    default:
      return "Et fellesskap på HomeLink.";
  }
}
