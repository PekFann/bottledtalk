import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isExpired } from "@/lib/geo";
import BottleViewHeader from "@/components/bottles/BottleViewHeader";
import BottleConversation from "@/components/bottles/BottleConversation";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BottlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ footprint?: string }>;
}) {
  const { id } = await params;
  const { footprint: footprintId } = await searchParams;
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
      description,
      is_sealed,
      expires_at,
      created_at,
      bottle_type:bottle_types (id, slug, name, description, duration_hours, icon, marker_color, is_sealed),
      creator:profiles!bottles_creator_id_fkey (id, display_name, avatar_url, created_at)
    `
    )
    .eq("id", id)
    .single();

  if (!bottle) notFound();

  const isCreator = bottle.creator_id === user.id;
  let isUnlocked = isCreator || !bottle.is_sealed;

  if (bottle.is_sealed && !isCreator) {
    const { data: unlock } = await supabase
      .from("bottle_unlocks")
      .select("bottle_id")
      .eq("bottle_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (unlock) isUnlocked = true;
  }

  let messages: Message[] = [];
  if (isUnlocked) {
    const { data: msgData } = await supabase
      .from("messages")
      .select(
        `
        id,
        bottle_id,
        author_id,
        body,
        created_at,
        is_remote,
        author:profiles!messages_author_id_fkey (id, display_name, avatar_url, created_at)
      `
      )
      .eq("bottle_id", id)
      .order("created_at", { ascending: true });

    messages = (msgData ?? []).map((m) => ({
      id: m.id,
      bottle_id: m.bottle_id,
      author_id: m.author_id,
      body: m.body,
      created_at: m.created_at,
      is_remote: m.is_remote,
      author: Array.isArray(m.author) ? m.author[0] : m.author ?? undefined,
    }));
  }

  let bagRow: { id: string } | null = null;
  const { data: bagData, error: bagError } = await supabase
    .from("bag_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_bottle_id", id)
    .maybeSingle();

  if (!bagError && bagData) bagRow = bagData;

  const expired = isExpired(bottle.expires_at);
  const bottleType = Array.isArray(bottle.bottle_type)
    ? bottle.bottle_type[0]
    : bottle.bottle_type;
  const creator = Array.isArray(bottle.creator) ? bottle.creator[0] : bottle.creator;

  const participated =
    bottle.creator_id === user.id ||
    messages.some((m) => m.author_id === user.id);

  return (
    <div className="flex flex-col h-dvh game-map-bg">
      <BottleViewHeader
        bottleId={id}
        title={bottle.title}
        typeName={bottleType?.name ?? "Bottle"}
        creatorId={creator?.id}
        creatorName={creator?.display_name ?? "Sailor"}
        expiresAt={bottle.expires_at}
        participated={participated}
        alreadyInBag={!!bagRow}
        isExpired={expired}
      />

      {expired ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl mb-4">🌊</p>
          <h2 className="text-xl font-bold text-slate-700">This bottle has washed away</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Keep it in your bag to save the conversation.
          </p>
          <Link href="/map" className="mt-6 btn-primary px-5 py-2.5">
            Back to map
          </Link>
        </div>
      ) : (
        <BottleConversation
          bottleId={id}
          title={bottle.title}
          description={bottle.description}
          isSealed={!!bottle.is_sealed}
          isCreator={isCreator}
          isUnlocked={isUnlocked}
          initialMessages={messages}
          currentUserId={user.id}
          footprintId={footprintId ?? null}
        />
      )}
    </div>
  );
}
