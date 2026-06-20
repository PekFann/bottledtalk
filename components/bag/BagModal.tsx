"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BagItem } from "@/lib/types";
import Link from "next/link";
import BottleImage from "@/components/bottles/BottleImage";
import MapModal from "@/components/ui/MapModal";

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
    <MapModal
      onClose={onClose}
      title="Your bag"
      subtitle={
        <p className="text-xs text-slate-500 mt-0.5">
          {items.length}/{bagLimit} slots
        </p>
      }
      panelClassName="max-h-[85dvh]"
      bodyClassName="p-4 grid grid-cols-2 gap-3"
    >
      {items.map((item) => (
        <motion.div key={item.id} className="rounded-lg glass-card p-3" layout>
          <div className="mx-auto mb-2 flex justify-center">
            <BottleImage size="md" />
          </div>
          <p className="font-medium text-sm text-slate-900 truncate text-center">
            {item.title}
          </p>
          <p className="text-[10px] text-slate-500 text-center mt-1">
            {new Date(item.collected_at).toLocaleDateString()}
          </p>
          <div className="flex gap-1 mt-3">
            <Link
              href={`/bag/${item.id}`}
              className="flex-1 text-center btn-primary text-xs py-1.5"
            >
              Open
            </Link>
            <button
              type="button"
              onClick={() => setConfirmId(item.id)}
              disabled={trashingId === item.id}
              className="rounded-md border border-slate-200 text-slate-500 px-2 py-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              aria-label="Trash bottle"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {confirmId === item.id && (
            <div className="mt-2 p-2 rounded-md bg-red-50 text-xs">
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
                  className="flex-1 border border-slate-200 rounded py-1"
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
          className="rounded-lg border border-dashed border-slate-200 min-h-[130px] flex items-center justify-center"
        >
          <span className="text-slate-300 text-xl">+</span>
        </div>
      ))}
    </MapModal>
  );
}
