"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { NearbyBottle } from "@/lib/types";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  bottle: NearbyBottle;
  onClick: () => void;
  isSelected?: boolean;
};

export default function BottleMarker({ bottle, onClick, isSelected = false }: Props) {
  return (
    <Marker longitude={bottle.lng} latitude={bottle.lat} anchor="bottom">
      <button
        onClick={onClick}
        className="relative flex flex-col items-center cursor-pointer group border-0 bg-transparent p-0"
        aria-label={`Open bottle: ${bottle.title}`}
        aria-pressed={isSelected}
      >
        <div
          className={`mb-1 max-w-[80px] truncate rounded px-1.5 py-0.5 text-[10px] shadow transition-colors ${
            isSelected
              ? "bg-white/90 backdrop-blur-sm text-slate-800 font-medium"
              : "bg-white/45 backdrop-blur-sm text-slate-700"
          }`}
        >
          {bottle.title}
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
