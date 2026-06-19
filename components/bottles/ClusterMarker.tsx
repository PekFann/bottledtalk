"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import type { MapStack } from "@/lib/types";

type Props = {
  stack: MapStack;
  onClick: (e: MouseEvent) => void;
};

export default function ClusterMarker({ stack, onClick }: Props) {
  return (
    <Marker longitude={stack.lng} latitude={stack.lat} anchor="center">
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className="relative flex items-center justify-center cursor-pointer"
        whileTap={{ scale: 0.92 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        aria-label={`${stack.count} items clustered`}
      >
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">{stack.count}</span>
        </div>
        <div className="absolute -bottom-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-orange-700 shadow">
          items
        </div>
      </motion.button>
    </Marker>
  );
}
