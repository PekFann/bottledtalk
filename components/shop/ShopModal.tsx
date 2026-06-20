"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Radio, Footprints, X, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getShopBottleTypes } from "@/lib/bottleCatalog";
import type { BottleType } from "@/lib/types";
import {
  FOOTPRINT_COST,
  FOOTPRINT_DAYS,
  SIGNAL_TOWER_COST,
  SIGNAL_TOWER_DAYS,
} from "@/lib/types";
import { formatDuration } from "@/lib/geo";
import PinInput from "@/components/ui/PinInput";

type Tab = "bottles" | "tower" | "footprint";

type Props = {
  bottleTypes: BottleType[];
  location: { lat: number; lng: number };
  bottleCaps: number;
  footprintMode: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onBottleSuccess: (capCost: number) => void;
  onTowerSuccess: (capCost: number) => void;
  onFootprintSuccess: (capCost: number) => void;
};

const fieldClassName =
  "font-handwriting w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-500 shadow-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 game-input";

export default function ShopModal({
  bottleTypes,
  location,
  bottleCaps,
  footprintMode,
  initialTab = "bottles",
  onClose,
  onBottleSuccess,
  onTowerSuccess,
  onFootprintSuccess,
}: Props) {
  const shopBottleTypes = getShopBottleTypes(bottleTypes);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [footprintName, setFootprintName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSupabase = useCallback(() => createClient(), []);
  const selectedType = shopBottleTypes.find((t) => t.id === selectedTypeId);
  const isSealed = selectedType?.is_sealed ?? false;
  const bottleCost = selectedType?.cap_cost ?? 0;
  const canAffordBottle = selectedType ? bottleCaps >= bottleCost : false;

  const selectBottleType = (typeId: string) => {
    setSelectedTypeId(typeId);
    setTitle("");
    setDescription("");
    setPin("");
    setMessage("");
    setError(null);
  };

  const goBackToBottlePicker = () => {
    selectBottleType("");
  };

  const handleBottleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !title.trim() || !message.trim() || !canAffordBottle) return;
    if (isSealed && (!description.trim() || pin.length !== 4)) return;

    setSubmitting(true);
    setError(null);
    const supabase = getSupabase();
    const { data, error: rpcError } = await supabase.rpc("drop_bottle", {
      p_bottle_type_id: selectedTypeId,
      p_lat: location.lat,
      p_lng: location.lng,
      p_title: title.trim(),
      p_message: message.trim(),
      p_description: isSealed ? description.trim() : null,
      p_pin: isSealed ? pin : null,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (data) onBottleSuccess(bottleCost);
  };

  const handleTowerSubmit = async () => {
    if (bottleCaps < SIGNAL_TOWER_COST) return;
    setSubmitting(true);
    setError(null);
    const supabase = getSupabase();
    const { error: rpcError } = await supabase.rpc("place_signal_tower", {
      p_lat: location.lat,
      p_lng: location.lng,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onTowerSuccess(SIGNAL_TOWER_COST);
  };

  const handleFootprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footprintName.trim() || bottleCaps < FOOTPRINT_COST) return;
    setSubmitting(true);
    setError(null);
    const supabase = getSupabase();
    const { error: rpcError } = await supabase.rpc("create_footprint", {
      p_name: footprintName.trim(),
      p_lat: location.lat,
      p_lng: location.lng,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onFootprintSuccess(FOOTPRINT_COST);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "bottles", label: "Bottles" },
    { id: "tower", label: "Signal tower" },
    { id: "footprint", label: "Footprint" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-xl game-panel-light max-h-[90dvh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="sticky top-0 z-10 glass-header rounded-t-xl">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Shop</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Coins className="h-3 w-3 text-amber-500" />
                {bottleCaps} caps available
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>
          <div className="flex border-t border-slate-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setError(null);
                  if (t.id !== "bottles") goBackToBottlePicker();
                }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-sky-600 border-b-2 border-sky-500"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === "bottles" && (
            <form onSubmit={handleBottleSubmit} className="space-y-5">
              {footprintMode && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  You can&apos;t cast bottles while viewing via a footprint.
                </p>
              )}
              <div className={`space-y-5 ${footprintMode ? "opacity-50 pointer-events-none" : ""}`}>
                {!selectedTypeId ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bottle type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {shopBottleTypes.map((type) => {
                        const affordable = bottleCaps >= type.cap_cost;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => selectBottleType(type.id)}
                            disabled={!affordable}
                            className={`flex items-center gap-3 rounded-lg glass-card p-3 text-left transition-all ${
                              affordable ? "hover:border-slate-300" : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div
                              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl text-4xl"
                              style={{ backgroundColor: `${type.marker_color}22` }}
                              aria-hidden
                            >
                              {type.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-slate-900">{type.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{type.description}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDuration(type.duration_hours)}
                                {type.is_sealed ? " · PIN locked" : ""}
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
                ) : (
                  <div className="space-y-5 glass-card rounded-xl p-4">
                    <button
                      type="button"
                      onClick={goBackToBottlePicker}
                      className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>

                    <p className="text-sm font-semibold text-slate-900">{selectedType?.name}</p>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                      <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required className={fieldClassName} placeholder="A note for whoever finds this…" />
                    </div>

                    {isSealed && (
                      <>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} required rows={2} className={`${fieldClassName} resize-none`} placeholder="What seekers will see before unlocking…" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 text-center">4-digit PIN</label>
                          <PinInput value={pin} onChange={setPin} disabled={submitting} />
                        </div>
                      </>
                    )}

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">First message</label>
                      <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required rows={4} className={`${fieldClassName} resize-none`} placeholder="Write your message to the sea…" />
                    </div>
                  </div>
                )}
              </div>

              {selectedTypeId && !canAffordBottle && selectedType && !footprintMode && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Need {bottleCost} caps — you have {bottleCaps}</p>
              )}
              {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
              {selectedTypeId && (
                <button type="submit" disabled={submitting || footprintMode || !canAffordBottle} className="w-full btn-primary-block font-medium py-3">
                  {submitting ? "Dropping…" : `Drop bottle (−${bottleCost} caps)`}
                </button>
              )}
            </form>
          )}

          {tab === "tower" && (
            <div className="space-y-5 text-center glass-card rounded-xl p-5">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-100">
                <Radio className="h-10 w-10 text-sky-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Signal tower</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Place a tower at your location. Anyone within 1 km gets 5 km radar for {SIGNAL_TOWER_DAYS} days.
                </p>
                <p className="text-sm font-medium text-amber-700 mt-3">{SIGNAL_TOWER_COST} caps</p>
              </div>
              {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
              <button type="button" onClick={handleTowerSubmit} disabled={submitting || bottleCaps < SIGNAL_TOWER_COST} className="w-full btn-primary-block font-medium py-3">
                {submitting ? "Building…" : `Build tower (−${SIGNAL_TOWER_COST} caps)`}
              </button>
            </div>
          )}

          {tab === "footprint" && (
            <form onSubmit={handleFootprintSubmit} className="space-y-5 text-center glass-card rounded-xl p-5">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Footprints className="h-10 w-10 text-slate-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Leave a footprint</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Mark this spot privately. Return anytime for {FOOTPRINT_DAYS} days to browse 2 km and comment remotely.
                </p>
                <p className="text-sm font-medium text-amber-700 mt-3">{FOOTPRINT_COST} caps</p>
              </div>
              <div className="text-left">
                <label htmlFor="fp-name" className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input id="fp-name" value={footprintName} onChange={(e) => setFootprintName(e.target.value)} maxLength={40} required className={fieldClassName} placeholder="e.g. Coffee shop corner" />
              </div>
              {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
              <button type="submit" disabled={submitting || bottleCaps < FOOTPRINT_COST} className="w-full btn-primary-block font-medium py-3">
                {submitting ? "Leaving…" : `Leave footprint (−${FOOTPRINT_COST} caps)`}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
