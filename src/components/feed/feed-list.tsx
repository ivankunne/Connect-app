"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Author, PostWithMeta, Community } from "@/lib/types";
import { UserAvatar } from "@/components/user-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/time";
import { flagFor } from "@/lib/countries";

const AUTHOR_COLS = "id,name,avatar_url,current_country,home_country";

export function FeedList({
  scope,
  communityId,
  currentUserId,
  initialPosts,
  canPost = false,
  allowedCommunityIds,
}: {
  scope: "community" | "all";
  communityId?: string;
  currentUserId: string;
  initialPosts: PostWithMeta[];
  canPost?: boolean;
  allowedCommunityIds?: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<PostWithMeta[]>(initialPosts);

  useEffect(() => {
    const allowed = new Set(allowedCommunityIds ?? (communityId ? [communityId] : []));
    const sub = supabase
      .channel(`feed:${scope}:${communityId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const row = payload.new as PostWithMeta;
          if (scope === "community" && row.community_id !== communityId) return;
          if (scope === "all" && allowed.size > 0 && !allowed.has(row.community_id)) return;

          const [{ data: author }, community] =
            scope === "all"
              ? await Promise.all([
                  supabase.from("profiles").select(AUTHOR_COLS).eq("id", row.user_id).maybeSingle(),
                  supabase.from("communities").select("id,name,type").eq("id", row.community_id).maybeSingle(),
                ])
              : [await supabase.from("profiles").select(AUTHOR_COLS).eq("id", row.user_id).maybeSingle(), { data: null }];

          setPosts((prev) =>
            prev.some((p) => p.id === row.id)
              ? prev
              : [
                  {
                    ...row,
                    author: (author as Author) ?? null,
                    community: (community?.data as Pick<Community, "id" | "name" | "type">) ?? null,
                  },
                  ...prev,
                ],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setPosts((prev) => prev.filter((p) => p.id !== oldId));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [supabase, scope, communityId, allowedCommunityIds]);

  async function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error("Kunne ikke slette innlegget");
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {canPost && communityId && (
          <PostComposer communityId={communityId} currentUserId={currentUserId} />
        )}

        {posts.length === 0 ? (
          <EmptyFeed canPost={canPost} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  showCommunity={scope === "all"}
                  own={p.user_id === currentUserId}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function PostComposer({ communityId, currentUserId }: { communityId: string; currentUserId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit() {
    if (!content.trim() || posting) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({
      community_id: communityId,
      user_id: currentUserId,
      title: title.trim() || null,
      content: content.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error("Kunne ikke publisere", { description: error.message });
      return;
    }
    setTitle("");
    setContent("");
  }

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tittel (valgfritt)"
        className="mb-2 border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Del noe med fellesskapet…"
        rows={3}
        className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} disabled={!content.trim() || posting}>
          {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Publiser
        </Button>
      </div>
    </div>
  );
}

function PostCard({
  post,
  showCommunity,
  own,
  onDelete,
}: {
  post: PostWithMeta;
  showCommunity: boolean;
  own: boolean;
  onDelete: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <UserAvatar name={post.author?.name} avatarUrl={post.author?.avatar_url} seed={post.user_id} className="size-9" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{post.author?.name || "Ukjent"}</span>
            {post.author?.home_country && <span className="text-xs">{flagFor(post.author.home_country)}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{relativeTime(post.created_at)}</span>
            {showCommunity && post.community && (
              <>
                <span>·</span>
                <Link href={`/app/c/${post.community.id}?view=feed`}>
                  <Badge variant="muted" className="hover:bg-secondary">
                    {post.community.name}
                  </Badge>
                </Link>
              </>
            )}
          </div>
        </div>
        {own && (
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            title="Slett"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      {post.title && <h3 className="mt-3 font-semibold leading-snug">{post.title}</h3>}
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
        {post.content}
      </p>
    </motion.article>
  );
}

function EmptyFeed({ canPost }: { canPost: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">📝</div>
      <h3 className="font-semibold">Ingen innlegg ennå</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {canPost
          ? "Del et tips, et spørsmål eller bare et hei. Innlegget ditt starter feeden."
          : "Når folk i fellesskapene dine deler noe, dukker det opp her."}
      </p>
    </div>
  );
}
