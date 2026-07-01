import type { Metadata } from "next";
import { getCurrentUser, getMyCommunities } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { PostWithMeta } from "@/lib/types";
import { FeedList } from "@/components/feed/feed-list";

export const metadata: Metadata = { title: "Feed" };
export const dynamic = "force-dynamic";

// Aggregated, strictly chronological feed across ALL of the user's communities
// (spec §6). Realtime updates as new posts arrive in any of them.
export default async function FeedPage() {
  const user = await getCurrentUser();
  const communities = await getMyCommunities();
  const ids = communities.map((c) => c.id);

  const supabase = await createClient();
  const { data } = ids.length
    ? await supabase
        .from("posts")
        .select("*, author:profiles(id,name,avatar_url,current_country,home_country), community:communities(id,name,type)")
        .in("community_id", ids)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] };

  const posts = (data ?? []) as unknown as PostWithMeta[];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur sm:px-6">
        <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">Feed</h1>
        <p className="text-xs text-muted-foreground">
          Det siste fra alle fellesskapene dine
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <FeedList
          scope="all"
          currentUserId={user!.id}
          initialPosts={posts}
          allowedCommunityIds={ids}
        />
      </div>
    </div>
  );
}
