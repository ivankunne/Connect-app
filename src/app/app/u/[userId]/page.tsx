import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { CommunityAvatar } from "@/components/community-avatar";
import { flagFor } from "@/lib/countries";
import type { Community } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const me = await getCurrentUser();
  if (me && me.id === userId) {
    const { redirect } = await import("next/navigation");
    redirect("/app/profile");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) notFound();

  // Communities we both belong to (visible to me via RLS).
  const { data: theirMemberships } = await supabase
    .from("memberships")
    .select("community_id")
    .eq("user_id", userId);
  const theirIds = (theirMemberships ?? []).map((m) => m.community_id);

  let shared: Community[] = [];
  if (theirIds.length) {
    const { data } = await supabase.from("communities").select("*").in("id", theirIds);
    shared = (data ?? []) as Community[];
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <Link href="/app/search" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tilbake
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar name={profile.name} avatarUrl={profile.avatar_url} seed={profile.id} className="size-20 text-xl" />
          <div>
            <h1 className="text-xl font-semibold">{profile.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{flagFor(profile.home_country)} fra {profile.home_country}</span>
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> Bor i {profile.city}, {profile.current_country}
            </p>
          </div>
        </div>

        {profile.languages.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Språk</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.languages.map((l) => (
                <Badge key={l} variant="secondary">{l}</Badge>
              ))}
            </div>
          </div>
        )}

        {profile.interests.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interesser</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => (
                <Badge key={i} variant="accent">{i}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {shared.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Felles fellesskap
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {shared.map((c) => (
              <Link
                key={c.id}
                href={`/app/c/${c.id}?view=chat&channel=general`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar">
                  <CommunityAvatar community={c} className="size-8 text-base" />
                </span>
                <span className="truncate text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
