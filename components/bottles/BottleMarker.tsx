"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import type { NearbyBottle } from "@/lib/types";
import { useLiveCountdown } from "@/lib/hooks/useLiveCountdown";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  bottle: NearbyBottle;
  onClick: (e: MouseEvent) => void;
  isSelected?: boolean;
};

export default function BottleMarker({ bottle, onClick, isSelected = false }: Props) {
  const countdown = useLiveCountdown(bottle.expires_at);

  return (
    <Marker longitude={bottle.lng} latitude={bottle.lat} anchor="bottom">
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
          <p className="mt-0.5 text-[9px] leading-tight text-amber-700/90 tabular-nums">
            {countdown}
          </p>
          <span
            className="absolute -bottom-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-white/90"
            aria-hidden
          />
        </div>

        <motion.div
          className="relative z-10"
          initial={false}
          animate={
            isSelected
              ? { y: -12, scale: 1.1 }
              : { y: [0, -6, 0], scale: 1 }
          }
          transition={
            isSelected
              ? { type: "spring", stiffness: 400, damping: 25 }
              : { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }
          whileTap={{ scale: 0.9 }}
        >
          <BottleImage size="lg" className="transition-transform group-hover:scale-110" />
        </motion.div>

        <motion.div
          className="mt-0.5 h-2.5 w-10 rounded-[50%] bg-black/30 blur-[1px]"
          animate={
            isSelected
              ? { scale: 0.75, opacity: 0.2 }
              : { scale: [1, 0.85, 1], opacity: [0.35, 0.25, 0.35] }
          }
          transition={
            isSelected
              ? { duration: 0.2 }
              : { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }
          aria-hidden
        />
      </button>
    </Marker>
  );
}
