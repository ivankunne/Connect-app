import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { sortCommunitiesForSidebar } from "@/lib/communities";
import type { CommunityWithCount } from "@/lib/types";
import { DirectoryList } from "@/components/community/directory-list";

export const metadata: Metadata = { title: "Utforsk fellesskap" };
export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: communities }, { data: myMemberships }] = await Promise.all([
    supabase.from("communities_with_counts").select("*").order("member_count", { ascending: false }).limit(200),
    supabase.from("memberships").select("community_id").eq("user_id", user!.id),
  ]);

  const memberIds = (myMemberships ?? []).map((m) => m.community_id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur sm:px-6">
        <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">Utforsk fellesskap</h1>
        <p className="text-xs text-muted-foreground">Finn og bli med i flere fellesskap</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <DirectoryList
          communities={sortCommunitiesForSidebar((communities ?? []) as CommunityWithCount[])}
          memberIds={memberIds}
          currentUserId={user!.id}
        />
      </div>
    </div>
  );
}
