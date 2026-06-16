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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.author_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? "bg-sky-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-semibold text-sky-600 mb-1">
                    {msg.author?.display_name ?? "Sailor"}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isOwn ? "text-sky-200" : "text-slate-400"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isExpired ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
          This bottle has washed away. The conversation is closed.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 bg-white px-4 py-3 flex gap-2"
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            placeholder="Continue the conversation…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-full bg-sky-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}

      {error && (
        <p className="px-4 pb-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
