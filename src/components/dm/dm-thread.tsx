"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import type { Author } from "@/lib/types";
import { MessageComposer } from "@/components/chat/message-composer";
import { UserAvatar } from "@/components/user-avatar";
import { messageTime, dayLabel } from "@/lib/time";
import { cn } from "@/lib/utils";

type DM = Database["public"]["Tables"]["direct_messages"]["Row"];

export function DmThread({
  currentUserId,
  partner,
  initialMessages,
}: {
  currentUserId: string;
  partner: Author;
  initialMessages: DM[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<DM[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    const markRead = async () => {
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", currentUserId)
        .eq("sender_id", partner.id)
        .is("read_at", null);
    };
    markRead();

    const sub = supabase
      .channel(`dm:${currentUserId}:${partner.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${currentUserId}` },
        (payload) => {
          const row = payload.new as DM;
          if (row.sender_id !== partner.id) return;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          markRead();
          requestAnimationFrame(() => scrollToBottom("smooth"));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [supabase, currentUserId, partner.id]);

  async function handleSend(content: string) {
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: currentUserId, recipient_id: partner.id, content })
      .select("*")
      .single();
    if (error) {
      toast.error("Kunne ikke sende melding", { description: error.message });
      return;
    }
    setMessages((prev) => [...prev, data as DM]);
    requestAnimationFrame(() => scrollToBottom("smooth"));
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-end gap-1 px-4 py-4 sm:px-6">
          {messages.map((m, i) => {
            const mine = m.sender_id === currentUserId;
            const prev = messages[i - 1];
            const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
            const grouped = prev && prev.sender_id === m.sender_id && !newDay;
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="rounded-full bg-card px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground shadow-xs">
                      {dayLabel(m.created_at)}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2")}
                >
                  {!mine && (
                    <div className="w-7 shrink-0">
                      {!grouped && <UserAvatar name={partner.name} avatarUrl={partner.avatar_url} seed={partner.id} className="size-7" />}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-[0.95rem] leading-relaxed shadow-xs",
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-card text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <span className={cn("mt-0.5 block text-[0.65rem]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {messageTime(m.created_at)}
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      <MessageComposer onSend={handleSend} placeholder={`Melding til ${partner.name.split(" ")[0]}…`} />
    </div>
  );
}
