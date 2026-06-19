import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isExpired } from "@/lib/geo";
import BottleViewHeader from "@/components/bottles/BottleViewHeader";
import BottleConversation from "@/components/bottles/BottleConversation";
import type { BottleThreadResponse } from "@/lib/types";

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

  const { data: threadData, error } = await supabase.rpc("get_bottle_thread", {
    p_bottle_id: id,
  });

  if (error || !threadData) notFound();

  const thread = threadData as BottleThreadResponse;
  const { bottle, bottle_type: bottleType, creator } = thread;
  const expired = isExpired(bottle.expires_at);

  return (
    <div className="flex flex-col h-dvh game-map-bg">
      <BottleViewHeader
        bottleId={id}
        title={bottle.title}
        typeName={bottleType?.name ?? "Bottle"}
        creatorId={creator?.id}
        creatorName={creator?.display_name ?? "Sailor"}
        expiresAt={bottle.expires_at}
        participated={thread.participated}
        alreadyInBag={thread.already_in_bag}
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
          isCreator={thread.is_creator}
          isUnlocked={thread.is_unlocked}
          initialMessages={thread.messages}
          currentUserId={user.id}
          footprintId={footprintId ?? null}
        />
      )}
    </div>
  );
}
