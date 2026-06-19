"use client";

import { Marker } from "react-map-gl/mapbox";
import { Radio } from "lucide-react";
import type { SignalTower } from "@/lib/types";

type Props = {
  tower: SignalTower;
  isOwner: boolean;
  onClick: () => void;
};

export default function SignalTowerMarker({ tower, isOwner, onClick }: Props) {
  return (
    <Marker longitude={tower.lng} latitude={tower.lat} anchor="bottom">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex flex-col items-center ${isOwner ? "cursor-pointer" : "cursor-default"}`}
        aria-label={isOwner ? "Your signal tower" : "Signal tower"}
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg ${isOwner ? "bg-sky-500" : "bg-slate-500"}`}>
          <Radio className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        {isOwner && (
          <span className="mt-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 shadow">
            Tower
          </span>
        )}
      </button>
    </Marker>
  );
}
