import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BagMessageSnapshot } from "@/lib/types";
import BottleImage from "@/components/bottles/BottleImage";

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
      <header className="flex items-center gap-3 border-b border-teal-200/50 game-panel-pastel px-4 py-3 shrink-0">
        <Link
          href="/map"
          className="text-teal-600 hover:text-teal-800 text-sm font-medium"
        >
          ← Map
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-handwriting text-xl text-slate-800 truncate">{item.title}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <BottleImage size="sm" className="inline-block shrink-0" />
            <span>
              {item.type_name} · saved{" "}
              {new Date(item.collected_at).toLocaleDateString()}
            </span>
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 conversation-panel">
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

      <div className="border-t border-teal-200/50 game-panel-pastel px-4 py-3 text-center text-xs text-slate-500">
        Archived conversation — read only
      </div>
    </div>
  );
}
