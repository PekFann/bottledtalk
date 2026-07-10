"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import type { NearbyBottle } from "@/lib/types";
import LiveCountdown from "@/components/ui/LiveCountdown";
import BottleImage from "@/components/bottles/BottleImage";
import { bottleFloatDelaySec } from "@/lib/bottleAssets";

type Props = {
  bottle: NearbyBottle;
  onClick: (e: MouseEvent) => void;
  isSelected?: boolean;
  zIndex?: number;
};

export default function BottleMarker({ bottle, onClick, isSelected = false, zIndex = 0 }: Props) {
  const floatDelay = bottleFloatDelaySec(bottle.id);
  const floatTransition = {
    repeat: Infinity,
    duration: 3,
    ease: "easeInOut" as const,
    delay: floatDelay,
  };

  return (
    <Marker
      longitude={bottle.lng}
      latitude={bottle.lat}
      anchor="bottom"
      style={{ zIndex }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className="relative flex flex-col items-center cursor-pointer group border-0 bg-transparent p-0"
        aria-label={`Open bottle: ${bottle.title}`}
        aria-pressed={isSelected}
      >
        <div
          className={`relative mb-1 max-w-[96px] rounded-lg px-2 py-1 text-center shadow-md transition-colors ${
            isSelected
              ? "bg-white/95 backdrop-blur-sm text-slate-800"
              : "bg-white/90 backdrop-blur-sm text-slate-700"
          }`}
        >
          <p className={`truncate text-[10px] leading-tight ${isSelected ? "font-semibold" : "font-medium"}`}>
            {bottle.title}
          </p>
          <div className="mt-0.5 flex justify-center">
            <LiveCountdown
              expiresAt={bottle.expires_at}
              className="text-[9px] px-1.5 py-px leading-tight"
            />
          </div>
          <span
            className="absolute -bottom-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-white/90"
            aria-hidden
          />
        </div>

        <motion.div
          className="relative"
          initial={{ y: 0 }}
          animate={
            isSelected
              ? { y: -14 }
              : { y: [0, -6, 0] }
          }
          transition={
            isSelected
              ? { type: "spring", stiffness: 400, damping: 25 }
              : floatTransition
          }
        >
          <BottleImage size="map" />
        </motion.div>

        <motion.div
          className="mt-0.5 h-3 w-12 rounded-[50%] bg-black/45 blur-[1.5px]"
          initial={{ scale: 1, opacity: 0.35 }}
          animate={
            isSelected
              ? { scale: 0.75, opacity: 0.2 }
              : { scale: [1, 0.85, 1], opacity: [0.45, 0.3, 0.45] }
          }
          transition={
            isSelected
              ? { duration: 0.2 }
              : floatTransition
          }
          aria-hidden
        />
      </button>
    </Marker>
  );
}
