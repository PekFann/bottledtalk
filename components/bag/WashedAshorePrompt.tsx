"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { WashedAshoreBottle } from "@/lib/types";
import BottleImage from "@/components/bottles/BottleImage";
import { MapModalCloseButton } from "@/components/ui/MapModal";

type Props = {
  onCollected: () => void;
  onVisibilityChange?: (visible: boolean) => void;
};

type Action = "keep" | "dismiss" | null;

export default function WashedAshorePrompt({ onCollected, onVisibilityChange }: Props) {
  const [queue, setQueue] = useState<WashedAshoreBottle[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action>(null);
  const [error, setError] = useState<string | null>(null);
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
  const busy = action !== null;

  useEffect(() => {
    onVisibilityChange?.(!!current);
  }, [current, onVisibilityChange]);

  const dismiss = async () => {
    if (!current || busy) return;

    const bottleId = current.id;
    setAction("dismiss");
    setError(null);

    const supabase = getSupabase();
    const { error: rpcError } = await supabase.rpc("dismiss_washed_ashore", {
      p_bottle_id: bottleId,
    });

    setAction(null);

    if (rpcError) {
      setError(rpcError.message || "Could not save — try again");
      return;
    }

    setDismissed((s) => new Set(s).add(bottleId));
    setQueue((items) => items.filter((b) => b.id !== bottleId));
  };

  const keep = async () => {
    if (!current || busy) return;

    const bottleId = current.id;
    setAction("keep");
    setError(null);

    const supabase = getSupabase();
    const { error: rpcError } = await supabase.rpc("collect_to_bag", {
      p_bottle_id: bottleId,
      p_reason: "expired",
    });

    setAction(null);

    if (rpcError) {
      setError(rpcError.message || "Could not add to bag — try again");
      return;
    }

    setDismissed((s) => new Set(s).add(bottleId));
    setQueue((items) => items.filter((b) => b.id !== bottleId));
    onCollected();
  };

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 left-4 right-4 z-[1000] mx-auto max-w-lg pointer-events-auto"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
      >
        <div className="game-panel-light rounded-2xl p-4 shadow-xl">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-sky-900">Washed ashore</p>
              <MapModalCloseButton onClick={busy ? () => {} : dismiss} />
            </div>
            <p className="text-sm text-slate-700 mt-1 flex items-center gap-2">
              <BottleImage size="sm" className="shrink-0 inline-block" />
              &ldquo;{current.title}&rdquo; expired. Keep it in your bag?
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={keep}
                disabled={busy}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
              >
                {action === "keep" ? "Saving…" : "Keep in bag"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                disabled={busy}
                className="flex-1 rounded-lg border border-slate-200 bg-white text-sm py-2 font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
              >
                {action === "dismiss" ? "Saving…" : "Let it drift"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
