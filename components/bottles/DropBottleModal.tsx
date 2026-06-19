"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Coins, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BottleType } from "@/lib/types";
import { formatDuration } from "@/lib/geo";
import BottleImage from "@/components/bottles/BottleImage";

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

  const fieldClassName =
    "font-handwriting w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-500 shadow-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 game-input";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl max-h-[90dvh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Cast a bottle</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Coins className="h-3 w-3 text-amber-500" />
              {bottleCaps} caps available
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bottle type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bottleTypes.map((type) => {
                const affordable = bottleCaps >= type.cap_cost;
                const selected = selectedTypeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selected
                        ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                        : affordable
                          ? "border-slate-200 bg-white hover:border-slate-300"
                          : "border-slate-100 bg-slate-50 opacity-50"
                    }`}
                  >
                    <BottleImage
                      size="sm"
                      className="shrink-0 h-[98px] w-[98px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-slate-900">{type.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDuration(type.duration_hours)}
                      </p>
                      <p className="text-xs font-medium text-amber-700 mt-1">
                        {type.cap_cost} caps
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
              className={fieldClassName}
              placeholder="A note for whoever finds this…"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
              First message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              required
              rows={4}
              className={`${fieldClassName} resize-none`}
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
            className="w-full btn-primary-block font-medium py-3"
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
