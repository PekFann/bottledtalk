import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BagMessageSnapshot } from "@/lib/types";
import BagViewHeader from "@/components/bag/BagViewHeader";

export const dynamic = "force-dynamic";

export default async function BagItemPage({
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

  const { data: item } = await supabase
    .from("bag_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!item) notFound();

  const messages = (item.messages_snapshot ?? []) as BagMessageSnapshot[];

  return (
    <div className="flex flex-col h-dvh game-map-bg">
      <BagViewHeader
        title={item.title}
        typeName={item.type_name}
        collectedAt={item.collected_at}
      />

      <div className="flex flex-col flex-1 min-h-0 conversation-panel">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No messages saved</p>
          ) : (
            messages.map((msg, i) => (
              <article
                key={i}
                className="border-b border-slate-200/80 pb-4 mb-4 last:border-0 last:mb-0"
              >
                <p className="text-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
                  <span className="text-slate-600">{msg.author_name}:</span>{" "}
                  {msg.body}{" "}
                  <span className="text-xs text-slate-400 align-baseline">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </p>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500 shrink-0">
          Archived conversation — read only
        </div>
      </div>
    </div>
  );
}
