"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { BagItem } from "@/lib/types";
import Link from "next/link";

type Props = {
  items: BagItem[];
  bagLimit: number;
  onClose: () => void;
  onTrashed: () => void;
};

export default function BagModal({ items, bagLimit, onClose, onTrashed }: Props) {
  const [trashingId, setTrashingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const getSupabase = useCallback(() => createClient(), []);

  const emptySlots = Math.max(0, bagLimit - items.length);

  const handleTrash = async (id: string) => {
    setTrashingId(id);
    const supabase = getSupabase();
    const { error } = await supabase.rpc("trash_from_bag", { p_bag_item_id: id });
    setTrashingId(null);
    setConfirmId(null);
    if (!error) onTrashed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-2xl game-panel-light max-h-[85dvh] overflow-hidden flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between border-b border-sky-200/50 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sky-900">Your bag</h2>
            <p className="text-xs text-slate-500">
              {items.length}/{bagLimit} slots · saved conversations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="rounded-xl border-2 border-sky-200 bg-white p-3 slot-glow"
              layout
            >
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl mb-2"
                style={{ backgroundColor: item.marker_color }}
              >
                {item.type_icon}
              </div>
              <p className="font-semibold text-sm text-slate-900 truncate text-center">
                {item.title}
              </p>
              <p className="text-[10px] text-slate-500 text-center mt-1">
                {new Date(item.collected_at).toLocaleDateString()}
              </p>
              <div className="flex gap-1 mt-3">
                <Link
                  href={`/bag/${item.id}`}
                  className="flex-1 text-center rounded-lg bg-sky-600 text-white text-xs font-semibold py-1.5 hover:bg-sky-700"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmId(item.id)}
                  disabled={trashingId === item.id}
                  className="rounded-lg border border-red-200 text-red-600 text-xs px-2 py-1.5 hover:bg-red-50"
                >
                  🗑
                </button>
              </div>
              {confirmId === item.id && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 text-xs">
                  <p className="text-red-800 mb-2">Trash this bottle?</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleTrash(item.id)}
                      className="flex-1 bg-red-600 text-white rounded py-1 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="flex-1 border rounded py-1"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-xl border-2 border-dashed border-sky-200/80 bg-sky-50/50 min-h-[140px] flex items-center justify-center"
            >
              <span className="text-sky-300 text-2xl">+</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
