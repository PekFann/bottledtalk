"use client";

import { Marker } from "react-map-gl/mapbox";
import type { NearbyBottle } from "@/lib/types";

type Props = {
  bottle: NearbyBottle;
  onClick: () => void;
};

export default function BottleMarker({ bottle, onClick }: Props) {
  return (
    <Marker longitude={bottle.lng} latitude={bottle.lat} anchor="bottom">
      <button
        onClick={onClick}
        className="flex flex-col items-center cursor-pointer group"
        aria-label={`Open bottle: ${bottle.title}`}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-lg border-2 border-white transition-transform group-hover:scale-110"
          style={{ backgroundColor: bottle.marker_color }}
        >
          {bottle.type_icon}
        </div>
        <div className="mt-1 max-w-[80px] truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow">
          {bottle.title}
        </div>
      </button>
    </Marker>
  );
}
