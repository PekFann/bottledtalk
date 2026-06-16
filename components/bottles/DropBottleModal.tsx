"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BottleType } from "@/lib/types";
import { formatDuration } from "@/lib/geo";

type Props = {
  bottleTypes: BottleType[];
  location: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: () => void;
};

export default function DropBottleModal({
  bottleTypes,
  location,
  onClose,
  onSuccess,
}: Props) {
  const [selectedTypeId, setSelectedTypeId] = useState(bottleTypes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSupabase = useCallback(() => createClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !title.trim() || !message.trim()) return;

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

    if (data) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Drop a bottle</h2>
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
              {bottleTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedTypeId(type.id)}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${
                    selectedTypeId === type.id
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="font-semibold text-sm mt-1">{type.name}</p>
                  <p className="text-xs text-slate-500">{formatDuration(type.duration_hours)}</p>
                </button>
              ))}
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              placeholder="Write your message to the sea…"
            />
          </div>

          <p className="text-xs text-slate-500">
            📍 Dropping at your current location ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
          </p>

          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedTypeId}
            className="w-full rounded-lg bg-sky-600 text-white font-semibold py-2.5 hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Casting into the sea…" : "Cast bottle"}
          </button>
        </form>
      </div>
    </div>
  );
}
