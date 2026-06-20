"use client";

import { MapPin } from "lucide-react";
import { isWithinRadius } from "@/lib/placement";

type Props = {
  anchor: { lat: number; lng: number };
  radiusM: number;
  placementPin: { lat: number; lng: number };
  onCancel: () => void;
  onConfirm: () => void;
};

export default function MapPlacementOverlay({
  anchor,
  radiusM,
  placementPin,
  onCancel,
  onConfirm,
}: Props) {
  const inRange = isWithinRadius(placementPin.lat, placementPin.lng, anchor, radiusM);

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="mb-1 max-w-[120px] rounded-lg bg-white/95 px-2 py-1 text-center shadow-lg border border-sky-200">
            <p className="text-[10px] font-medium text-sky-800">Drop here</p>
          </div>
          <MapPin className="h-10 w-10 text-sky-600 drop-shadow-lg" strokeWidth={2.25} fill="currentColor" />
        </div>
      </div>

      <div className="pointer-events-auto absolute top-16 left-3 right-3 mx-auto max-w-lg">
        <div className="game-panel-light rounded-xl px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-slate-800">Drag the map to position your item</p>
          <p className="text-xs text-slate-600 mt-1">
            {inRange
              ? "Pin is inside your viewable circle."
              : "Pin must stay inside your viewable circle."}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!inRange}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-50"
            >
              Confirm location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
