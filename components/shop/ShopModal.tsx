"use client";

import { useState } from "react";
import { Coins, Radio, Footprints, ChevronLeft, Sparkles } from "lucide-react";
import MapModal from "@/components/ui/MapModal";
import { getShopBottleTypes } from "@/lib/bottleCatalog";
import type { BottleType } from "@/lib/types";
import {
  DECORATION_COST,
  DECORATION_DAYS,
  FOOTPRINT_COST,
  FOOTPRINT_DAYS,
  SIGNAL_TOWER_COST,
  SIGNAL_TOWER_DAYS,
} from "@/lib/types";
import { formatDuration } from "@/lib/geo";
import type { PlacementIntent } from "@/lib/placement";
import {
  DECORATION_CATEGORIES,
  getDecorationType,
  getDecorationsByCategory,
} from "@/lib/decorationCatalog";
import PinInput from "@/components/ui/PinInput";

type Tab = "bottles" | "tower" | "footprint" | "decoration";

type Props = {
  bottleTypes: BottleType[];
  bottleCaps: number;
  footprintMode: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onStartPlacement: (intent: PlacementIntent) => void;
};

const fieldClassName =
  "w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-500 shadow-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 game-input";

export default function ShopModal({
  bottleTypes,
  bottleCaps,
  footprintMode,
  initialTab = "bottles",
  onClose,
  onStartPlacement,
}: Props) {
  const shopBottleTypes = getShopBottleTypes(bottleTypes);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [footprintName, setFootprintName] = useState("");
  const [selectedDecorationTypeId, setSelectedDecorationTypeId] = useState("");
  const [decorationTitle, setDecorationTitle] = useState("");
  const [decorationDescription, setDecorationDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedType = shopBottleTypes.find((t) => t.id === selectedTypeId);
  const selectedDecorationType = getDecorationType(selectedDecorationTypeId);
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

  const selectDecorationType = (typeId: string) => {
    setSelectedDecorationTypeId(typeId);
    setDecorationTitle("");
    setDecorationDescription("");
    setError(null);
  };

  const goBackToDecorationPicker = () => {
    selectDecorationType("");
  };

  const resetDecorationState = () => {
    setSelectedDecorationTypeId("");
    setDecorationTitle("");
    setDecorationDescription("");
  };

  const startBottlePlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !title.trim() || !message.trim() || !canAffordBottle) return;
    if (isSealed && (!description.trim() || pin.length !== 4)) return;

    onStartPlacement({
      kind: "bottle",
      bottleTypeId: selectedTypeId,
      title: title.trim(),
      message: message.trim(),
      description: isSealed ? description.trim() : null,
      pin: isSealed ? pin : null,
      capCost: bottleCost,
      isSealed,
    });
  };

  const startTowerPlacement = () => {
    if (bottleCaps < SIGNAL_TOWER_COST) return;
    onStartPlacement({ kind: "tower", capCost: SIGNAL_TOWER_COST });
  };

  const startFootprintPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footprintName.trim() || bottleCaps < FOOTPRINT_COST) return;
    onStartPlacement({
      kind: "footprint",
      name: footprintName.trim(),
      capCost: FOOTPRINT_COST,
    });
  };

  const startDecorationPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedDecorationTypeId ||
      !decorationTitle.trim() ||
      !decorationDescription.trim() ||
      bottleCaps < DECORATION_COST
    ) {
      return;
    }
    onStartPlacement({
      kind: "decoration",
      decorationTypeId: selectedDecorationTypeId,
      title: decorationTitle.trim(),
      description: decorationDescription.trim(),
      capCost: DECORATION_COST,
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "bottles", label: "Bottles" },
    { id: "tower", label: "Tower" },
    { id: "footprint", label: "Footprint" },
    { id: "decoration", label: "Decorate" },
  ];

  return (
    <MapModal
      onClose={onClose}
      title="Shop"
      subtitle={
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
          <Coins className="h-3 w-3 text-amber-500" />
          {bottleCaps} caps available
        </p>
      }
      headerBelow={
        <div className="flex border-t border-slate-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError(null);
                if (t.id !== "bottles") goBackToBottlePicker();
                if (t.id !== "decoration") resetDecorationState();
              }}
              className={`flex-1 min-w-[4.5rem] py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                tab === t.id
                  ? "text-sky-600 border-b-2 border-sky-500"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
      headerSticky
      panelScroll
      panelClassName="max-h-[90dvh]"
    >
      {tab === "bottles" && (
        <form onSubmit={startBottlePlacement} className="space-y-5">
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
                          <p className="font-semibold text-lg text-slate-900">{type.name}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{type.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-xs font-normal text-white">
                              {formatDuration(type.duration_hours)}
                            </span>
                            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-normal text-white">
                              {type.cap_cost} caps
                            </span>
                            {type.is_sealed && (
                              <span className="rounded-full bg-violet-500 px-2.5 py-0.5 text-xs font-normal text-white">
                                PIN locked
                              </span>
                            )}
                          </div>
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
                      <PinInput value={pin} onChange={setPin} />
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
            <button type="submit" disabled={footprintMode || !canAffordBottle} className="w-full btn-primary-block font-medium py-3">
              Choose location on map (−{bottleCost} caps)
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
              Place a tower within your view. Anyone within 1 km gets 5 km radar for {SIGNAL_TOWER_DAYS} days.
            </p>
            <p className="text-sm font-normal text-amber-700 mt-3">{SIGNAL_TOWER_COST} caps</p>
          </div>
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          <button type="button" onClick={startTowerPlacement} disabled={bottleCaps < SIGNAL_TOWER_COST} className="w-full btn-primary-block font-medium py-3 disabled:opacity-50">
            Choose location on map (−{SIGNAL_TOWER_COST} caps)
          </button>
        </div>
      )}

      {tab === "footprint" && (
        <form onSubmit={startFootprintPlacement} className="space-y-5 text-center glass-card rounded-xl p-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <Footprints className="h-10 w-10 text-slate-600" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Leave a footprint</h3>
            <p className="text-sm text-slate-600 mt-2">
              Mark a spot within your view. Return anytime for {FOOTPRINT_DAYS} days to browse 2 km and comment remotely.
            </p>
            <p className="text-sm font-normal text-amber-700 mt-3">{FOOTPRINT_COST} caps</p>
          </div>
          <div className="text-left">
            <label htmlFor="fp-name" className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input id="fp-name" value={footprintName} onChange={(e) => setFootprintName(e.target.value)} maxLength={40} required className={fieldClassName} placeholder="e.g. Coffee shop corner" />
          </div>
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          <button type="submit" disabled={bottleCaps < FOOTPRINT_COST} className="w-full btn-primary-block font-medium py-3 disabled:opacity-50">
            Choose location on map (−{FOOTPRINT_COST} caps)
          </button>
        </form>
      )}

      {tab === "decoration" && (
        <form onSubmit={startDecorationPlacement} className="space-y-5">
          {!selectedDecorationTypeId ? (
            <div className="space-y-5">
              <div className="text-center glass-card rounded-xl p-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
                  <Sparkles className="h-8 w-8 text-violet-600" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-slate-900 mt-3">Map decoration</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Pick something to place on the map. Others can read your note — no replies, just wonder. Lasts{" "}
                  {DECORATION_DAYS} days.
                </p>
                <p className="text-sm font-normal text-amber-700 mt-3">{DECORATION_COST} caps each</p>
              </div>

              {DECORATION_CATEGORIES.map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{category}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {getDecorationsByCategory(category).map((type) => {
                      const affordable = bottleCaps >= DECORATION_COST;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => selectDecorationType(type.id)}
                          disabled={!affordable}
                          className={`flex flex-col items-center gap-2 rounded-lg glass-card p-3 text-center transition-all ${
                            affordable ? "hover:border-slate-300" : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
                            style={{ backgroundColor: `${type.marker_color}22` }}
                            aria-hidden
                          >
                            {type.icon}
                          </div>
                          <p className="text-sm font-medium text-slate-900">{type.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5 glass-card rounded-xl p-4">
              <button
                type="button"
                onClick={goBackToDecorationPicker}
                className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                  style={{ backgroundColor: `${selectedDecorationType?.marker_color ?? "#a78bfa"}22` }}
                  aria-hidden
                >
                  {selectedDecorationType?.icon}
                </div>
                <p className="text-sm font-semibold text-slate-900">{selectedDecorationType?.name}</p>
              </div>

              <div>
                <label htmlFor="dec-title" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  id="dec-title"
                  value={decorationTitle}
                  onChange={(e) => setDecorationTitle(e.target.value)}
                  maxLength={80}
                  required
                  className={fieldClassName}
                  placeholder="A name for this spot…"
                />
              </div>
              <div>
                <label htmlFor="dec-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  id="dec-desc"
                  value={decorationDescription}
                  onChange={(e) => setDecorationDescription(e.target.value)}
                  maxLength={300}
                  required
                  rows={3}
                  className={`${fieldClassName} resize-none`}
                  placeholder="What travelers will read when they find it…"
                />
              </div>
            </div>
          )}

          {selectedDecorationTypeId && bottleCaps < DECORATION_COST && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Need {DECORATION_COST} caps — you have {bottleCaps}
            </p>
          )}
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          {selectedDecorationTypeId && (
            <button
              type="submit"
              disabled={bottleCaps < DECORATION_COST}
              className="w-full btn-primary-block font-medium py-3 disabled:opacity-50"
            >
              Choose location on map (−{DECORATION_COST} caps)
            </button>
          )}
        </form>
      )}
    </MapModal>
  );
}
