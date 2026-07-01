"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag, Loader2, MapPin, MessageCircle, UserRound } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { flagFor } from "@/lib/countries";

type MiniProfile = Pick<
  Profile,
  "id" | "name" | "avatar_url" | "home_country" | "current_country" | "city" | "languages" | "interests"
>;

/**
 * Wrap any trigger (avatar, name) to open a card with the person's details and
 * quick actions: start a private chat, or open their full profile.
 */
export function ProfilePopover({
  userId,
  currentUserId,
  children,
}: {
  userId: string;
  currentUserId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<MiniProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const isSelf = userId === currentUserId;

  async function load(open: boolean) {
    if (!open || profile || loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id,name,avatar_url,home_country,current_country,city,languages,interests")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data as MiniProfile);
    setLoading(false);
  }

  async function block() {
    const supabase = createClient();
    const { error } = await supabase.from("blocks").insert({ blocker_id: currentUserId, blocked_id: userId });
    if (error) return toast.error("Kunne ikke blokkere");
    toast.success("Bruker blokkert", { description: "Du ser ikke lenger meldingene deres." });
    router.refresh();
  }

  async function report() {
    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .insert({ reporter_id: currentUserId, target_type: "user", target_id: userId });
    if (error) return toast.error("Kunne ikke sende rapport");
    toast.success("Takk for rapporten", { description: "Vi ser på den så snart vi kan." });
  }

  return (
    <Popover onOpenChange={load}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start">
        {loading || !profile ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div>
            {/* Banner */}
            <div className="h-16 rounded-t-2xl bg-gradient-to-r from-primary/80 to-accent/70" />
            <div className="px-4 pb-4">
              <div className="-mt-8 flex items-end justify-between">
                <UserAvatar
                  name={profile.name}
                  avatarUrl={profile.avatar_url}
                  seed={profile.id}
                  className="size-16 text-lg ring-4 ring-popover"
                />
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-[-0.01em]">
                {profile.name}
              </h3>
              <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {profile.home_country && (
                  <p>
                    {flagFor(profile.home_country)} Fra {profile.home_country}
                  </p>
                )}
                {(profile.city || profile.current_country) && (
                  <p className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    Bor i {profile.city || profile.current_country}
                  </p>
                )}
              </div>

              {(profile.languages?.length > 0 || profile.interests?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {profile.languages?.slice(0, 3).map((l) => (
                    <Badge key={l} variant="secondary">{l}</Badge>
                  ))}
                  {profile.interests?.slice(0, 2).map((i) => (
                    <Badge key={i} variant="accent">{i}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {isSelf ? (
                  <Button variant="secondary" className="flex-1" onClick={() => router.push("/app/profile")}>
                    <UserRound className="size-4" /> Din profil
                  </Button>
                ) : (
                  <>
                    <Button className="flex-1" onClick={() => router.push(`/app/dm/${profile.id}`)}>
                      <MessageCircle className="size-4" /> Send melding
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => router.push(`/app/u/${profile.id}`)} aria-label="Se full profil">
                      <UserRound className="size-4" />
                    </Button>
                  </>
                )}
              </div>

              {!isSelf && (
                <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
                  <button onClick={block} className="inline-flex items-center gap-1 hover:text-destructive">
                    <Ban className="size-3.5" /> Blokker
                  </button>
                  <button onClick={report} className="inline-flex items-center gap-1 hover:text-foreground">
                    <Flag className="size-3.5" /> Rapporter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
