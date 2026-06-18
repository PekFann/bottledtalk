"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { NearbyBottle } from "@/lib/types";
import { DEFAULT_BOTTLE_MARKER_SRC } from "@/lib/bottleAssets";

type Props = {
  bottle: NearbyBottle;
  onClick: () => void;
};

export default function BottleMarker({ bottle, onClick }: Props) {
  return (
    <Marker longitude={bottle.lng} latitude={bottle.lat} anchor="bottom">
      <button
        onClick={onClick}
        className="relative flex flex-col items-center cursor-pointer group border-0 bg-transparent p-0"
        aria-label={`Open bottle: ${bottle.title}`}
      >
        <div className="mb-1 max-w-[80px] truncate rounded bg-white/45 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-slate-700 shadow">
          {bottle.title}
        </div>

        <motion.div
          className="relative z-10"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          whileTap={{ scale: 0.9 }}
        >
          <img
            src={DEFAULT_BOTTLE_MARKER_SRC}
            alt=""
            width={52}
            height={52}
            className="h-[52px] w-[52px] object-contain pointer-events-none drop-shadow-sm transition-transform group-hover:scale-110"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="mt-0.5 h-2.5 w-10 rounded-[50%] bg-black/30 blur-[1px]"
          animate={{ scale: [1, 0.85, 1], opacity: [0.35, 0.25, 0.35] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          aria-hidden
        />
      </button>
    </Marker>
  );
}
