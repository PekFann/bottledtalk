import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BagMessageSnapshot } from "@/lib/types";

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
      <header className="flex items-center gap-3 border-b border-sky-800/30 game-panel px-4 py-3 shrink-0">
        <Link
          href="/map"
          className="text-sky-200 hover:text-white text-sm font-medium"
        >
          ← Map
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sky-50 truncate">{item.title}</h1>
          <p className="text-xs text-sky-200/80">
            {item.type_icon} {item.type_name} · saved{" "}
            {new Date(item.collected_at).toLocaleDateString()}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-sky-200/70 text-sm py-8">No messages saved</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/95 text-slate-800 shadow-sm px-4 py-2.5">
                <p className="text-xs font-semibold text-sky-600 mb-1">
                  {msg.author_name}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-sky-800/30 game-panel px-4 py-3 text-center text-xs text-sky-200/70">
        Archived conversation — read only
      </div>
    </div>
  );
}
