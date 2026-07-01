"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { CommunityWithCount } from "@/lib/types";
import { CommunityAvatar } from "@/components/community-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPE_LABEL: Record<string, string> = {
  hybrid: "Ditt folk i byen",
  diaspora: "Diaspora",
  city: "By",
  country: "Land",
  global: "Global",
};

export function DirectoryList({
  communities,
  memberIds,
  currentUserId,
}: {
  communities: CommunityWithCount[];
  memberIds: string[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [joined, setJoined] = useState<Set<string>>(new Set(memberIds));
  const [pending, setPending] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return communities.filter((c) => !term || c.name.toLowerCase().includes(term));
  }, [communities, q]);

  async function join(id: string) {
    setPending(id);
    const { error } = await supabase
      .from("memberships")
      .upsert({ community_id: id, user_id: currentUserId, source: "manual" }, { onConflict: "user_id,community_id" });
    setPending(null);
    if (error) return toast.error("Kunne ikke bli med", { description: error.message });
    setJoined((prev) => new Set(prev).add(id));
    toast.success("Du er med! 🎉");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søk i fellesskap…"
          className="h-11 pl-10"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((c) => {
          const isMember = joined.has(c.id);
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar">
                <CommunityAvatar community={c} className="size-9 text-lg" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABEL[c.type]} · {c.member_count} medlemmer
                </p>
              </div>
              {isMember ? (
                <Button size="sm" variant="secondary" onClick={() => router.push(`/app/c/${c.id}?view=chat&channel=general`)}>
                  Åpne
                </Button>
              ) : (
                <Button size="sm" onClick={() => join(c.id)} disabled={pending === c.id}>
                  {pending === c.id ? <Loader2 className="size-4 animate-spin" /> : "Bli med"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Ingen fellesskap matcher «{q}».</p>
      )}
    </div>
  );
}
