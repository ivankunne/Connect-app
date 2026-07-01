import { notFound } from "next/navigation";
import { getCurrentUser, getMyCommunities } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isMessageCategory, MESSAGE_PAGE_SIZE, type AppView } from "@/lib/constants";
import type { Message, EventWithMeta, PostWithMeta } from "@/lib/types";
import { CommunityHeader } from "@/components/community/community-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { EventsPanel } from "@/components/events/events-panel";
import { FeedList } from "@/components/feed/feed-list";
import { ContextPanel } from "@/components/community/context-panel";
import { JoinCommunity } from "@/components/community/join-community";

const AUTHOR = "author:profiles(id,name,avatar_url,current_country,home_country)";

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

  const { data: community } = await supabase
    .from("communities_with_counts")
    .select("*")
    .eq("id", communityId)
    .maybeSingle();

  if (!community) notFound();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("community_id", communityId)
    .maybeSingle();

  if (!membership) {
    return <JoinCommunity community={community} />;
  }

  const myCommunities = await getMyCommunities();

  // Fetch ONLY the data the active view needs (spec §9 performance rule).
  let initialMessages: Message[] = [];
  let events: EventWithMeta[] = [];
  let posts: PostWithMeta[] = [];

  if (view === "chat") {
    const { data } = await supabase
      .from("messages")
      .select(`*, ${AUTHOR}`)
      .eq("community_id", communityId)
      .eq("category", channel)
      .order("created_at", { ascending: false })
      .limit(MESSAGE_PAGE_SIZE);
    initialMessages = ((data ?? []) as unknown as Message[]).reverse();
  } else if (view === "events") {
    const { data } = await supabase
      .from("events")
      .select(`*, ${AUTHOR}, attendees:event_attendees(user_id)`)
      .eq("community_id", communityId)
      .order("datetime", { ascending: true });
    events = (data ?? []).map((e: Record<string, unknown>) => {
      const attendees = (e.attendees as { user_id: string }[]) ?? [];
      return {
        ...(e as unknown as EventWithMeta),
        attendee_count: attendees.length,
        is_going: attendees.some((a) => a.user_id === user.id),
      };
    });
  } else {
    const { data } = await supabase
      .from("posts")
      .select(`*, ${AUTHOR}`)
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(30);
    posts = (data ?? []) as unknown as PostWithMeta[];
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
              currentUserId={user.id}
              initialMessages={initialMessages}
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
      <ContextPanel community={community} myCommunities={myCommunities} currentUserId={user.id} />
    </div>
  );
}
