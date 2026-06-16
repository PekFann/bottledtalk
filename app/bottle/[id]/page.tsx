import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isExpired } from "@/lib/geo";
import MessageThread from "@/components/bottles/MessageThread";
import ExpiryCountdown from "@/components/bottles/ExpiryCountdown";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BottlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: bottle } = await supabase
    .from("bottles")
    .select(
      `
      id,
      creator_id,
      title,
      expires_at,
      created_at,
      bottle_type:bottle_types (id, slug, name, description, duration_hours, icon, marker_color),
      creator:profiles!bottles_creator_id_fkey (id, display_name, avatar_url, created_at)
    `
    )
    .eq("id", id)
    .single();

  if (!bottle) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      id,
      bottle_id,
      author_id,
      body,
      created_at,
      author:profiles!messages_author_id_fkey (id, display_name, avatar_url, created_at)
    `
    )
    .eq("bottle_id", id)
    .order("created_at", { ascending: true });

  const expired = isExpired(bottle.expires_at);
  const bottleType = Array.isArray(bottle.bottle_type)
    ? bottle.bottle_type[0]
    : bottle.bottle_type;
  const creator = Array.isArray(bottle.creator) ? bottle.creator[0] : bottle.creator;

  const normalizedMessages: Message[] = (messages ?? []).map((m) => ({
    id: m.id,
    bottle_id: m.bottle_id,
    author_id: m.author_id,
    body: m.body,
    created_at: m.created_at,
    author: Array.isArray(m.author) ? m.author[0] : m.author ?? undefined,
  }));

  return (
    <div className="flex flex-col h-dvh bg-sky-50">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <Link
          href="/map"
          className="text-sky-600 hover:text-sky-800 text-sm font-medium"
        >
          ← Map
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">{bottle.title}</h1>
          <p className="text-xs text-slate-500">
            {bottleType?.icon} {bottleType?.name} · by {creator?.display_name}
          </p>
        </div>
      </header>

      <div className="px-4 py-3 shrink-0">
        <ExpiryCountdown expiresAt={bottle.expires_at} />
      </div>

      {expired ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl mb-4">🌊</p>
          <h2 className="text-xl font-bold text-slate-800">This bottle has washed away</h2>
          <p className="text-slate-600 mt-2 text-sm">
            It drifted past its time limit and is no longer discoverable.
          </p>
          <Link
            href="/map"
            className="mt-6 rounded-lg bg-sky-600 text-white px-5 py-2.5 font-semibold hover:bg-sky-700"
          >
            Back to map
          </Link>
        </div>
      ) : (
        <MessageThread
          bottleId={id}
          initialMessages={normalizedMessages}
          currentUserId={user.id}
          isExpired={false}
        />
      )}
    </div>
  );
}
