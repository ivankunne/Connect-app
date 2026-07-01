import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getBlockedIds, getCurrentUser, getMyCommunities, getMyProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isMessageCategory, MESSAGE_PAGE_SIZE, type AppView } from "@/lib/constants";
import type { Author, Message, EventWithMeta, PostWithMeta } from "@/lib/types";
import { CommunityHeader } from "@/components/community/community-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { EventsPanel } from "@/components/events/events-panel";
import { FeedList } from "@/components/feed/feed-list";
import { ContextPanel } from "@/components/community/context-panel";
import { JoinCommunity } from "@/components/community/join-community";

const AUTHOR = "author:profiles(id,name,avatar_url,current_country,home_country)";
const REACTIONS = "reactions:message_reactions(emoji,user_id)";

type SP = Promise<{ view?: string; channel?: string }>;

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ communityId: string }>;
  searchParams: SP;
}) {
  const { communityId } = await params;
  const sp = await searchParams;
  const view: AppView = sp.view === "events" || sp.view === "feed" ? sp.view : "chat";
  const channel = isMessageCategory(sp.channel) ? sp.channel : "general";

  const user = await getCurrentUser();
  if (!user) notFound();

  const supabase = await createClient();

  // Fetch ONLY the active view's data, and run everything the page needs in a
  // SINGLE parallel batch instead of a sequential chain (one network round-trip
  // instead of ~5 — critical when Vercel and Supabase are in different regions).
  const viewDataQuery =
    view === "chat"
      ? supabase
          .from("messages")
          .select(`*, ${AUTHOR}, ${REACTIONS}`)
          .eq("community_id", communityId)
          .eq("category", channel)
          .order("created_at", { ascending: false })
          .limit(MESSAGE_PAGE_SIZE)
      : view === "events"
        ? supabase
            .from("events")
            .select(`*, ${AUTHOR}, attendees:event_attendees(user_id)`)
            .eq("community_id", communityId)
            .order("datetime", { ascending: true })
        : supabase
            .from("posts")
            .select(`*, ${AUTHOR}`)
            .eq("community_id", communityId)
            .order("created_at", { ascending: false })
            .limit(30);

  const [communityRes, membershipRes, myCommunities, viewRes, blockedIds, profile] = await Promise.all([
    supabase.from("communities_with_counts").select("*").eq("id", communityId).maybeSingle(),
    supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .maybeSingle(),
    getMyCommunities(),
    viewDataQuery,
    getBlockedIds(),
    getMyProfile(),
  ]);

  const community = communityRes.data;
  if (!community) notFound();
  if (!membershipRes.data) return <JoinCommunity community={community} />;
  if (!profile) redirect("/login");

  const blocked = new Set(blockedIds);

  let initialMessages: Message[] = [];
  let events: EventWithMeta[] = [];
  let posts: PostWithMeta[] = [];

  if (view === "chat") {
    initialMessages = ((viewRes.data ?? []) as unknown as Message[])
      .filter((m) => !blocked.has(m.user_id))
      .reverse();
  } else if (view === "events") {
    events = ((viewRes.data ?? []) as Record<string, unknown>[]).map((e) => {
      const attendees = (e.attendees as { user_id: string }[]) ?? [];
      return {
        ...(e as unknown as EventWithMeta),
        attendee_count: attendees.length,
        is_going: attendees.some((a) => a.user_id === user.id),
      };
    });
  } else {
    posts = ((viewRes.data ?? []) as unknown as PostWithMeta[]).filter((p) => !blocked.has(p.user_id));
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_336px]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <CommunityHeader community={community} view={view} channel={channel} />
        <div className="min-h-0 flex-1">
          {view === "chat" && (
            <ChatPanel
              key={`${communityId}:${channel}`}
              communityId={communityId}
              channel={channel}
              currentUser={profile as Author}
              initialMessages={initialMessages}
              blockedIds={blockedIds}
            />
          )}
          {view === "events" && (
            <EventsPanel
              communityId={communityId}
              currentUserId={user.id}
              events={events}
            />
          )}
          {view === "feed" && (
            <FeedList
              scope="community"
              communityId={communityId}
              currentUserId={user.id}
              initialPosts={posts}
              canPost
            />
          )}
        </div>
      </div>
      <Suspense fallback={<ContextPanelSkeleton />}>
        <ContextPanel community={community} myCommunities={myCommunities} currentUserId={user.id} />
      </Suspense>
    </div>
  );
}

function ContextPanelSkeleton() {
  return (
    <aside className="hidden w-[336px] shrink-0 border-l border-border bg-background xl:block">
      <div className="space-y-4 p-5">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-14 animate-pulse rounded-xl bg-muted" />
        <div className="h-14 animate-pulse rounded-xl bg-muted" />
      </div>
    </aside>
  );
}
