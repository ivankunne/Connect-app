import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Author } from "@/lib/types";
import type { Database } from "@/lib/database.types";
import { DmThread } from "@/components/dm/dm-thread";
import { ProfilePopover } from "@/components/profile/profile-popover";
import { UserAvatar } from "@/components/user-avatar";
import { flagFor } from "@/lib/countries";

type DM = Database["public"]["Tables"]["direct_messages"]["Row"];

export const dynamic = "force-dynamic";

export default async function DmPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const me = await getCurrentUser();
  if (!me) notFound();
  if (me.id === userId) redirect("/app/messages");

  const supabase = await createClient();

  const [{ data: partner }, { data: msgs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,name,avatar_url,home_country,current_country")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${me.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${me.id})`,
      )
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  if (!partner) notFound();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-5">
        <Link
          href="/app/messages"
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Tilbake til meldinger"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <ProfilePopover userId={partner.id} currentUserId={me.id}>
          <button className="flex items-center gap-2.5 rounded-lg outline-none">
            <UserAvatar name={partner.name} avatarUrl={partner.avatar_url} seed={partner.id} />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-semibold tracking-[-0.01em]">{partner.name}</span>
                {partner.home_country && <span className="text-xs">{flagFor(partner.home_country)}</span>}
              </div>
              <span className="text-xs text-muted-foreground">Privat samtale</span>
            </div>
          </button>
        </ProfilePopover>
      </header>
      <div className="min-h-0 flex-1">
        <DmThread currentUserId={me.id} partner={partner as Author} initialMessages={(msgs ?? []) as DM[]} />
      </div>
    </div>
  );
}
