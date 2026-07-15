"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import type { MapCapSpawn } from "@/lib/types";
import BottleCapIcon from "@/components/ui/BottleCapIcon";

type Props = {
  spawn: MapCapSpawn;
  onClick: (e: MouseEvent) => void;
  zIndex?: number;
  disabled?: boolean;
};

export default function CapSpawnMarker({ spawn, onClick, zIndex = 0, disabled = false }: Props) {
  return (
    <Marker
      longitude={spawn.lng}
      latitude={spawn.lat}
      anchor="bottom"
      style={{ zIndex }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onClick(e);
        }}
        disabled={disabled}
        className="relative flex flex-col items-center cursor-pointer border-0 bg-transparent p-0 disabled:opacity-50 disabled:cursor-wait"
        aria-label="Collect bottle cap"
      >
        <motion.div
          className="relative drop-shadow-md"
          initial={{ y: 0 }}
          animate={{ y: [0, -4, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut",
          }}
        >
          <BottleCapIcon size="xl" />
        </motion.div>
        <div
          className="mt-0.5 h-2.5 w-8 rounded-[50%] bg-black/35 blur-[1px]"
          aria-hidden
        />
      </button>
    </Marker>
  );
}
