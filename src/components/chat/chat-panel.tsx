"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Loader2, MessagesSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Message, Author, Reaction } from "@/lib/types";
import type { MessageCategory } from "@/lib/database.types";
import { CHANNELS, MESSAGE_PAGE_SIZE, channelLabel } from "@/lib/constants";
import { UserAvatar } from "@/components/user-avatar";
import { ProfilePopover } from "@/components/profile/profile-popover";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageReactions } from "@/components/chat/message-reactions";
import { messageTime, dayLabel } from "@/lib/time";
import { flagFor } from "@/lib/countries";
import { cn } from "@/lib/utils";

const AUTHOR_COLS = "id,name,avatar_url,current_country,home_country";
const REACTIONS = "reactions:message_reactions(emoji,user_id)";
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function ChatPanel({
  communityId,
  channel,
  currentUser,
  initialMessages,
  blockedIds = [],
}: {
  communityId: string;
  channel: MessageCategory;
  currentUser: Author;
  initialMessages: Message[];
  blockedIds?: string[];
}) {
  const currentUserId = currentUser.id;
  const supabase = useMemo(() => createClient(), []);
  const blocked = useMemo(() => new Set(blockedIds), [blockedIds]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialMessages.length >= MESSAGE_PAGE_SIZE);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [typing, setTyping] = useState<Record<string, string>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const authorCache = useRef<Map<string, Author>>(new Map());
  const lastTypingSent = useRef(0);

  useEffect(() => {
    initialMessages.forEach((m) => m.author && authorCache.current.set(m.user_id, m.author));
    authorCache.current.set(currentUserId, currentUser);
  }, [initialMessages, currentUser, currentUserId]);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
    // Mark this community as read when opened.
    supabase.rpc("mark_community_read", { target_community: communityId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: messages, reactions, and typing broadcasts.
  useEffect(() => {
    const ch = supabase
      .channel(`chat:${communityId}:${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `community_id=eq.${communityId}` },
        async (payload) => {
          const row = payload.new as Message;
          if (row.category !== channel) return;
          if (row.user_id === currentUserId) return; // our own are added optimistically
          if (blocked.has(row.user_id)) return;

          let author = authorCache.current.get(row.user_id) ?? null;
          if (!author) {
            const { data } = await supabase.from("profiles").select(AUTHOR_COLS).eq("id", row.user_id).maybeSingle();
            if (data) {
              author = data as Author;
              authorCache.current.set(row.user_id, author);
            }
          }
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, { ...row, author, reactions: [] }],
          );
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" }, (payload) => {
        const r = payload.new as Reaction & { message_id: string };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === r.message_id
              ? {
                  ...m,
                  reactions: (m.reactions ?? []).some((x) => x.user_id === r.user_id && x.emoji === r.emoji)
                    ? m.reactions
                    : [...(m.reactions ?? []), { emoji: r.emoji, user_id: r.user_id }],
                }
              : m,
          ),
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" }, (payload) => {
        const r = payload.old as { message_id: string; user_id: string; emoji: string };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === r.message_id
              ? { ...m, reactions: (m.reactions ?? []).filter((x) => !(x.user_id === r.user_id && x.emoji === r.emoji)) }
              : m,
          ),
        );
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId, name } = payload as { userId: string; name: string };
        if (userId === currentUserId) return;
        setTyping((prev) => ({ ...prev, [userId]: name }));
        setTimeout(() => setTyping((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        }), 3500);
      })
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, communityId, channel, currentUserId, blocked]);

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
      .select(`*, author:profiles(${AUTHOR_COLS}), ${REACTIONS}`)
      .eq("community_id", communityId)
      .eq("category", channel)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(MESSAGE_PAGE_SIZE);

    const older = ((data ?? []) as unknown as Message[])
      .filter((m) => !blocked.has(m.user_id))
      .reverse();
    older.forEach((m) => m.author && authorCache.current.set(m.user_id, m.author));
    setHasMore(older.length >= MESSAGE_PAGE_SIZE);
    setMessages((prev) => [...older, ...prev]);
    setLoadingOlder(false);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  }

  async function handleSend(content: string, imageUrl?: string | null) {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Message = {
      id: tempId,
      community_id: communityId,
      user_id: currentUserId,
      category: channel,
      content,
      image_url: imageUrl ?? null,
      created_at: new Date().toISOString(),
      author: currentUser,
      reactions: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    const { data, error } = await supabase
      .from("messages")
      .insert({ community_id: communityId, user_id: currentUserId, category: channel, content, image_url: imageUrl ?? null })
      .select("*")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Kunne ikke sende melding", { description: error.message });
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...(data as Message), author: currentUser, reactions: [] } : m)));
  }

  function handleType() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, name: currentUser.name },
    });
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || messageId.startsWith("temp-")) return;
    const mine = (msg.reactions ?? []).some((r) => r.user_id === currentUserId && r.emoji === emoji);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: mine
                ? (m.reactions ?? []).filter((r) => !(r.user_id === currentUserId && r.emoji === emoji))
                : [...(m.reactions ?? []), { emoji, user_id: currentUserId }],
            }
          : m,
      ),
    );

    if (mine) {
      await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji);
    } else {
      await supabase.from("message_reactions").insert({ message_id: messageId, user_id: currentUserId, emoji });
    }
  }

  async function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast.error("Kunne ikke slette meldingen");
  }

  function onScroll() {
    if (isNearBottom()) setShowJump(false);
  }

  const typingNames = Object.values(typing);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface">
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && !hasMore ? (
          <EmptyChat channel={channel} />
        ) : (
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
              <ChannelIntro channel={channel} />
            )}

            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const sameDay = prev && dayLabel(prev.created_at) === dayLabel(m.created_at);
              const grouped =
                prev &&
                prev.user_id === m.user_id &&
                new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS &&
                sameDay &&
                !m.image_url;
              return (
                <div key={m.id}>
                  {!sameDay && <DayDivider label={dayLabel(m.created_at)} />}
                  <MessageItem
                    message={m}
                    grouped={!!grouped}
                    own={m.user_id === currentUserId}
                    currentUserId={currentUserId}
                    onDelete={() => handleDelete(m.id)}
                    onToggleReaction={(emoji) => toggleReaction(m.id, emoji)}
                  />
                </div>
              );
            })}
          </div>
        )}
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

      {typingNames.length > 0 && (
        <div className="px-5 pb-1 text-xs italic text-muted-foreground sm:px-6">
          {typingNames.length === 1 ? `${typingNames[0]} skriver…` : `${typingNames.length} personer skriver…`}
        </div>
      )}

      <MessageComposer
        onSend={handleSend}
        onType={handleType}
        communityId={communityId}
        currentUserId={currentUserId}
        placeholder={`Melding i ${channelLabel(channel)}…`}
      />
    </div>
  );
}

function renderContent(text: string) {
  // Highlight @mentions.
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="rounded bg-primary/12 px-0.5 font-medium text-primary">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function MessageItem({
  message,
  grouped,
  own,
  currentUserId,
  onDelete,
  onToggleReaction,
}: {
  message: Message;
  grouped: boolean;
  own: boolean;
  currentUserId: string;
  onDelete: () => void;
  onToggleReaction: (emoji: string) => void;
}) {
  const author = message.author;
  const pending = message.id.startsWith("temp-");
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group flex gap-3 rounded-lg px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
        grouped ? "mt-0.5 py-0.5" : "mt-3 py-1",
        pending && "opacity-60",
      )}
    >
      <div className="w-9 shrink-0">
        {!grouped && (
          <ProfilePopover userId={message.user_id} currentUserId={currentUserId}>
            <button className="rounded-full outline-none ring-primary/40 transition hover:opacity-80 focus-visible:ring-2">
              <UserAvatar name={author?.name} avatarUrl={author?.avatar_url} seed={message.user_id} />
            </button>
          </ProfilePopover>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-baseline gap-2">
            <ProfilePopover userId={message.user_id} currentUserId={currentUserId}>
              <button className="text-sm font-semibold outline-none hover:underline focus-visible:underline">
                {author?.name || "Ukjent"}
              </button>
            </ProfilePopover>
            {author?.home_country && (
              <span className="text-xs" title={author.home_country}>
                {flagFor(author.home_country)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{messageTime(message.created_at)}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {message.content && (
              <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-foreground/90">
                {renderContent(message.content)}
              </p>
            )}
            {message.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.image_url}
                alt="Delt bilde"
                className="mt-1.5 max-h-72 rounded-xl border border-border object-cover"
                loading="lazy"
              />
            )}
            {!pending && (
              <MessageReactions
                reactions={message.reactions ?? []}
                currentUserId={currentUserId}
                onToggle={onToggleReaction}
              />
            )}
          </div>
          {own && !pending && (
            <button
              onClick={onDelete}
              className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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

function ChannelIntro({ channel }: { channel: MessageCategory }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">
        Velkommen til #{channelLabel(channel).toLowerCase()}
      </h2>
      <p className="text-sm text-muted-foreground">Dette er starten på samtalen i denne kanalen.</p>
    </div>
  );
}

const STARTERS = ["Hei alle sammen! 👋", "Noen tips til en som nettopp har flyttet hit?", "Er det noen her i kveld?"];

function EmptyChat({ channel }: { channel: MessageCategory }) {
  const Icon = CHANNELS.find((c) => c.key === channel)?.icon ?? MessagesSquare;
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center bg-dots px-6 py-16 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm">
        <Icon className="size-7" />
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">
        Velkommen til #{channelLabel(channel).toLowerCase()}
      </h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
        Vær den første som sier hei. Prøv en av disse for å komme i gang:
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {STARTERS.map((s) => (
          <span key={s} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
