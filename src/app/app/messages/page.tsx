import Link from "next/link";
import type { Metadata } from "next";
import { MailQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/user-avatar";
import { relativeTime } from "@/lib/time";
import { flagFor } from "@/lib/countries";

export const metadata: Metadata = { title: "Meldinger" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: threads } = await supabase.rpc("get_dm_threads");
  const partnerIds = (threads ?? []).map((t) => t.partner_id);

  const profiles = partnerIds.length
    ? (await supabase.from("profiles").select("id,name,avatar_url,home_country").in("id", partnerIds)).data ?? []
    : [];
  const byId = new Map(profiles.map((p) => [p.id, p]));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur sm:px-6">
        <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">Meldinger</h1>
        <p className="text-xs text-muted-foreground">Dine private samtaler</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          {(threads ?? []).length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MailQuestion className="size-6" />
              </div>
              <h3 className="font-semibold">Ingen meldinger ennå</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Trykk på noen i en chat for å åpne profilen deres og starte en privat samtale.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {(threads ?? []).map((t) => {
                const p = byId.get(t.partner_id);
                return (
                  <Link
                    key={t.partner_id}
                    href={`/app/dm/${t.partner_id}`}
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary"
                  >
                    <UserAvatar name={p?.name} avatarUrl={p?.avatar_url} seed={t.partner_id} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{p?.name || "Ukjent"}</span>
                        {p?.home_country && <span className="text-xs">{flagFor(p.home_country)}</span>}
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {relativeTime(t.last_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm ${t.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {t.last_content}
                        </p>
                        {t.unread > 0 && (
                          <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                            {t.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
