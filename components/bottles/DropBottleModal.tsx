"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { BottleType } from "@/lib/types";
import { formatDuration } from "@/lib/geo";

type Props = {
  bottleTypes: BottleType[];
  location: { lat: number; lng: number };
  bottleCaps: number;
  onClose: () => void;
  onSuccess: (capCost: number) => void;
};

export default function DropBottleModal({
  bottleTypes,
  location,
  bottleCaps,
  onClose,
  onSuccess,
}: Props) {
  const [selectedTypeId, setSelectedTypeId] = useState(bottleTypes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSupabase = useCallback(() => createClient(), []);
  const selectedType = bottleTypes.find((t) => t.id === selectedTypeId);
  const cost = selectedType?.cap_cost ?? 0;
  const canAfford = bottleCaps >= cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !title.trim() || !message.trim() || !canAfford) return;

    setSubmitting(true);
    setError(null);

    const supabase = getSupabase();
    const { data, error: rpcError } = await supabase.rpc("drop_bottle", {
      p_bottle_type_id: selectedTypeId,
      p_lat: location.lat,
      p_lng: location.lng,
      p_title: title.trim(),
      p_message: message.trim(),
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (data) onSuccess(cost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-2xl game-panel-light shadow-2xl max-h-[90dvh] overflow-y-auto"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-sky-200/50 px-5 py-4 bg-white/95 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-sky-900">Cast a bottle</h2>
            <p className="text-xs text-amber-700 font-medium">
              Balance: {bottleCaps} caps
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

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bottle type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {bottleTypes.map((type) => {
                const affordable = bottleCaps >= type.cap_cost;
                const selected = selectedTypeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      selected
                        ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-200"
                        : affordable
                          ? "border-slate-200 hover:border-sky-300"
                          : "border-slate-100 opacity-50"
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <p className="font-semibold text-sm mt-1">{type.name}</p>
                    <p className="text-xs text-slate-500">{formatDuration(type.duration_hours)}</p>
                    <p className="text-xs font-bold text-amber-700 mt-1">
                      {type.cap_cost} caps
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 game-input"
              placeholder="A note for whoever finds this…"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
              First message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              required
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none game-input"
              placeholder="Write your message to the sea…"
            />
          </div>

          {!canAfford && selectedType && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Need {cost} caps — you have {bottleCaps}
            </p>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedTypeId || !canAfford}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold py-3 hover:from-sky-700 hover:to-sky-600 disabled:opacity-50 transition-all shadow-lg"
          >
            {submitting
              ? "Casting into the sea…"
              : `Cast bottle (−${cost} caps)`}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
