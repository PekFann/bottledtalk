"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { WashedAshoreBottle } from "@/lib/types";
import BottleImage from "@/components/bottles/BottleImage";
import { MapModalCloseButton } from "@/components/ui/MapModal";

type Props = {
  onCollected: () => void;
};

export default function WashedAshorePrompt({ onCollected }: Props) {
  const [queue, setQueue] = useState<WashedAshoreBottle[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const getSupabase = useCallback(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data } = await supabase.rpc("get_washed_ashore");
      if (data) setQueue(data);
    }
    load();
  }, [getSupabase]);

  const current = queue.find((b) => !dismissed.has(b.id));
  if (!current) return null;

  const dismiss = () => setDismissed((s) => new Set(s).add(current.id));

  const keep = async () => {
    setLoading(current.id);
    const supabase = getSupabase();
    const { error } = await supabase.rpc("collect_to_bag", {
      p_bottle_id: current.id,
      p_reason: "expired",
    });
    setLoading(null);
    setDismissed((s) => new Set(s).add(current.id));
    if (!error) onCollected();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-20 left-4 right-4 z-30 mx-auto max-w-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
      >
        <div className="game-panel-light rounded-2xl p-4 shadow-xl">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-sky-900">Washed ashore</p>
              <MapModalCloseButton onClick={dismiss} />
            </div>
            <p className="text-sm text-slate-700 mt-1 flex items-center gap-2">
              <BottleImage size="sm" className="shrink-0 inline-block" />
              &ldquo;{current.title}&rdquo; expired. Keep it in your bag?
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={keep}
                disabled={loading === current.id}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
              >
                Keep in bag
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 rounded-lg border border-slate-200 bg-white text-sm py-2 font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                Let it drift
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
