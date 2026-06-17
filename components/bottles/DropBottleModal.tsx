"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Coins, X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-xl game-panel-light max-h-[90dvh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white rounded-t-xl">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Cast a bottle</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Coins className="h-3 w-3 text-amber-500" />
              {bottleCaps} caps available
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
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
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selected
                        ? "border-amber-400 bg-amber-50"
                        : affordable
                          ? "border-slate-200 hover:border-slate-300"
                          : "border-slate-100 opacity-50"
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <p className="font-medium text-sm mt-1 text-slate-900">{type.name}</p>
                    <p className="text-xs text-slate-500">{formatDuration(type.duration_hours)}</p>
                    <p className="text-xs font-medium text-amber-700 mt-1">
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 game-input"
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 resize-none game-input"
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
            className="w-full rounded-lg bg-slate-900 text-white font-medium py-3 hover:bg-slate-800 disabled:opacity-50 transition-colors"
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
