"use client";

import { Marker } from "react-map-gl/mapbox";
import { Sparkles } from "lucide-react";
import type { MouseEvent } from "react";
import type { MapDecoration } from "@/lib/types";
import { getDecorationType } from "@/lib/decorationCatalog";
import LiveCountdown from "@/components/ui/LiveCountdown";

type Props = {
  decoration: MapDecoration;
  onClick: (e: MouseEvent) => void;
  zIndex?: number;
};

export default function DecorationMarker({ decoration, onClick, zIndex = 0 }: Props) {
  const decorationType = getDecorationType(decoration.decoration_type);
  const markerColor = decorationType?.marker_color ?? "#8b5cf6";
  const icon = decorationType?.icon;

  return (
    <Marker
      longitude={decoration.lng}
      latitude={decoration.lat}
      anchor="bottom"
      style={{ zIndex }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className="relative flex flex-col items-center cursor-pointer group border-0 bg-transparent p-0"
        aria-label={`Decoration: ${decoration.title}`}
      >
        <div className="relative mb-1 max-w-[96px] rounded-lg bg-white/90 backdrop-blur-sm px-2 py-1 text-center shadow-md">
          <p className="truncate text-[10px] font-medium leading-tight text-slate-700">
            {decoration.title}
          </p>
          <div className="mt-0.5 flex justify-center">
            <LiveCountdown
              expiresAt={decoration.expires_at}
              className="text-[9px] px-1.5 py-px leading-tight bg-violet-100 text-violet-800"
            />
          </div>
          <span
            className="absolute -bottom-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-white/90"
            aria-hidden
          />
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg text-xl"
          style={{ backgroundColor: markerColor }}
        >
          {icon ? (
            <span aria-hidden>{icon}</span>
          ) : (
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.25} />
          )}
        </div>
      </button>
    </Marker>
  );
}
