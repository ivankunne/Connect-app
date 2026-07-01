"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { CommunityWithCount } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CommunityAvatar } from "@/components/community-avatar";

/** Shown when the user views a community they're not a member of (e.g. from search). */
export function JoinCommunity({ community }: { community: CommunityWithCount }) {
  const router = useRouter();
  const supabase = createClient();
  const [joining, setJoining] = useState(false);

  async function join() {
    setJoining(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("memberships")
      .upsert(
        { community_id: community.id, user_id: user.id, source: "manual" },
        { onConflict: "user_id,community_id" },
      );
    if (error) {
      toast.error("Kunne ikke bli med", { description: error.message });
      setJoining(false);
      return;
    }
    router.refresh();
    router.push(`/app/c/${community.id}?view=chat&channel=general`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-dots p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-sidebar">
          <CommunityAvatar community={community} className="size-12 text-3xl" />
        </div>
        <h1 className="text-xl font-semibold">{community.name}</h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Users className="size-4" /> {community.member_count} medlemmer
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Bli med for å se samtalen, arrangementer og innlegg i dette fellesskapet.
        </p>
        <Button className="mt-6 w-full" size="lg" onClick={join} disabled={joining}>
          {joining && <Loader2 className="size-4 animate-spin" />}
          Bli med i fellesskapet
        </Button>
      </div>
    </div>
  );
}
