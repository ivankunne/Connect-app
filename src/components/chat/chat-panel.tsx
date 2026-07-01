"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Message, Author } from "@/lib/types";
import type { MessageCategory } from "@/lib/database.types";
import { MESSAGE_PAGE_SIZE, channelLabel } from "@/lib/constants";
import { UserAvatar } from "@/components/user-avatar";
import { MessageComposer } from "@/components/chat/message-composer";
import { messageTime, dayLabel } from "@/lib/time";
import { flagFor } from "@/lib/countries";
import { cn } from "@/lib/utils";

const AUTHOR_COLS = "id,name,avatar_url,current_country,home_country";
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function ChatPanel({
  communityId,
  channel,
  currentUserId,
  initialMessages,
}: {
  communityId: string;
  channel: MessageCategory;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialMessages.length >= MESSAGE_PAGE_SIZE);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const authorCache = useRef<Map<string, Author>>(new Map());

  // Seed the author cache from the server-provided initial messages.
  useEffect(() => {
    initialMessages.forEach((m) => m.author && authorCache.current.set(m.user_id, m.author));
  }, [initialMessages]);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Initial scroll to bottom.
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: new + deleted messages for this community, filtered to channel.
  useEffect(() => {
    const wasNearBottom = { current: true };
    const channelSub = supabase
      .channel(`chat:${communityId}:${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `community_id=eq.${communityId}` },
        async (payload) => {
          const row = payload.new as Message;
          if (row.category !== channel) return;
          wasNearBottom.current = isNearBottom();

          let author = authorCache.current.get(row.user_id) ?? null;
          if (!author) {
            const { data } = await supabase
              .from("profiles")
              .select(AUTHOR_COLS)
              .eq("id", row.user_id)
              .maybeSingle();
            if (data) {
              author = data as Author;
              authorCache.current.set(row.user_id, author);
            }
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, author }];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `community_id=eq.${communityId}` },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== oldId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [supabase, communityId, channel, isNearBottom]);

  // Auto-scroll on new message if the user was already at the bottom.
  const lastLen = useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastLen.current) {
      if (isNearBottom()) scrollToBottom("smooth");
      else requestAnimationFrame(() => setShowJump(true));
    }
    lastLen.current = messages.length;
  }, [messages.length, isNearBottom, scrollToBottom]);

  async function loadOlder() {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0].created_at;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;

    const { data } = await supabase
      .from("messages")
      .select(`*, author:profiles(${AUTHOR_COLS})`)
      .eq("community_id", communityId)
      .eq("category", channel)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(MESSAGE_PAGE_SIZE);

    const older = ((data ?? []) as unknown as Message[]).reverse();
    older.forEach((m) => m.author && authorCache.current.set(m.user_id, m.author));
    setHasMore(older.length >= MESSAGE_PAGE_SIZE);
    setMessages((prev) => [...older, ...prev]);
    setLoadingOlder(false);

    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  }

  async function handleSend(content: string) {
    const { error } = await supabase.from("messages").insert({
      community_id: communityId,
      user_id: currentUserId,
      category: channel,
      content,
    });
    if (error) {
      toast.error("Kunne ikke sende melding", { description: error.message });
    }
  }

  async function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast.error("Kunne ikke slette meldingen");
  }

  function onScroll() {
    if (!isNearBottom()) return;
    setShowJump(false);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end px-4 py-4 sm:px-6">
          {hasMore ? (
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="mx-auto mb-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {loadingOlder ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Last inn eldre meldinger
            </button>
          ) : (
            <ChannelIntro channel={channel} empty={messages.length === 0} />
          )}

          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const sameDay = prev && dayLabel(prev.created_at) === dayLabel(m.created_at);
            const grouped =
              prev &&
              prev.user_id === m.user_id &&
              new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS &&
              sameDay;
            return (
              <div key={m.id}>
                {!sameDay && <DayDivider label={dayLabel(m.created_at)} />}
                <MessageItem
                  message={m}
                  grouped={!!grouped}
                  own={m.user_id === currentUserId}
                  onDelete={() => handleDelete(m.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showJump && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              scrollToBottom("smooth");
              setShowJump(false);
            }}
            className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-lg"
          >
            <ArrowDown className="size-3.5" /> Nye meldinger
          </motion.button>
        )}
      </AnimatePresence>

      <MessageComposer onSend={handleSend} placeholder={`Melding i ${channelLabel(channel)}…`} />
    </div>
  );
}

function MessageItem({
  message,
  grouped,
  own,
  onDelete,
}: {
  message: Message;
  grouped: boolean;
  own: boolean;
  onDelete: () => void;
}) {
  const author = message.author;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("group flex gap-3 rounded-lg px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]", grouped ? "mt-0.5 py-0.5" : "mt-3 py-1")}
    >
      <div className="w-9 shrink-0">
        {!grouped && <UserAvatar name={author?.name} avatarUrl={author?.avatar_url} seed={message.user_id} />}
      </div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{author?.name || "Ukjent"}</span>
            {author?.home_country && (
              <span className="text-xs" title={author.home_country}>
                {flagFor(author.home_country)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{messageTime(message.created_at)}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-foreground/90">
            {message.content}
          </p>
          {own && (
            <button
              onClick={onDelete}
              className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              title="Slett melding"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="rounded-full bg-card px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground shadow-xs">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function ChannelIntro({ channel, empty }: { channel: MessageCategory; empty: boolean }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Velkommen til #{channelLabel(channel).toLowerCase()}</h2>
      <p className="text-sm text-muted-foreground">
        {empty
          ? "Vær den første som sier hei 👋 Meldingene her er starten på noe."
          : "Dette er starten på samtalen i denne kanalen."}
      </p>
    </div>
  );
}
