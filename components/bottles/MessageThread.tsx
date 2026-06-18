"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

type Props = {
  bottleId: string;
  initialMessages: Message[];
  currentUserId: string;
  isExpired: boolean;
};

export default function MessageThread({
  bottleId,
  initialMessages,
  currentUserId,
  isExpired,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const getSupabase = useCallback(() => createClient(), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`bottle-${bottleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `bottle_id=eq.${bottleId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: author } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, created_at")
            .eq("id", newMsg.author_id)
            .single();

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, author: author ?? undefined }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bottleId, getSupabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isExpired) return;

    setSubmitting(true);
    setError(null);

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from("messages").insert({
      bottle_id: bottleId,
      author_id: currentUserId,
      body: body.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBody("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
        {messages.map((msg) => (
          <article
            key={msg.id}
            className="border-b border-white/20 pb-4 mb-4 last:border-0 last:mb-0"
          >
            <p className="text-lg text-paper-ink whitespace-pre-wrap leading-relaxed">
              <span className="text-white/90">
                {msg.author?.display_name ?? "Sailor"}:
              </span>{" "}
              {msg.body}{" "}
              <span className="text-xs text-white/60 align-baseline">
                {new Date(msg.created_at).toLocaleString()}
              </span>
            </p>
          </article>
        ))}
        <div ref={bottomRef} />
      </div>

      {isExpired ? (
        <div className="border-t border-white/20 bg-white/10 backdrop-blur-md px-4 py-4 text-center text-sm text-white/70">
          This bottle has washed away. The conversation is closed.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 space-y-2"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Continue the conversation…"
            className="w-full rounded-lg border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none game-input"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-lg bg-teal-500/90 text-white px-5 py-2 text-sm hover:bg-teal-600 disabled:opacity-50 backdrop-blur-sm"
            >
              Send
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="px-4 pb-3 text-sm text-red-200">{error}</p>
      )}
    </div>
  );
}
