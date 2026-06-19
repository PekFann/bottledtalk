"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Footprints, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Footprint } from "@/lib/types";

type Props = {
  onClose: () => void;
  onSelect: (footprint: Footprint) => void;
  onOpenShop: () => void;
};

export default function FootprintModal({ onClose, onSelect, onOpenShop }: Props) {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(true);
  const getSupabase = useCallback(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data } = await supabase.rpc("list_my_footprints");
      if (data) {
        setFootprints(
          data.map((fp: Footprint & { user_id?: string }) => ({
            ...fp,
            user_id: fp.user_id ?? "",
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [getSupabase]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl max-h-[70dvh] overflow-hidden flex flex-col"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Your footprints</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
          ) : footprints.length === 0 ? (
            <div className="text-center py-8">
              <Footprints className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No footprints yet</p>
              <button type="button" onClick={onOpenShop} className="mt-3 text-sm text-sky-600 font-medium">
                Get one in Shop
              </button>
            </div>
          ) : (
            footprints.map((fp) => (
              <button
                key={fp.id}
                type="button"
                onClick={() => onSelect(fp)}
                className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 transition-colors"
              >
                <Footprints className="h-5 w-5 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-slate-900 truncate">{fp.name}</p>
                  <p className="text-xs text-slate-500">
                    Until {new Date(fp.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium text-sky-600 shrink-0">Go</span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
