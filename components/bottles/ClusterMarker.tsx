"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { BottleCluster } from "@/lib/types";

type Props = {
  cluster: BottleCluster;
  onClick: () => void;
};

export default function ClusterMarker({ cluster, onClick }: Props) {
  return (
    <Marker longitude={cluster.lng} latitude={cluster.lat} anchor="center">
      <motion.button
        onClick={onClick}
        className="relative flex items-center justify-center cursor-pointer"
        whileTap={{ scale: 0.92 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        aria-label={`${cluster.count} bottles clustered`}
      >
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">{cluster.count}</span>
        </div>
        <div className="absolute -bottom-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-orange-700 shadow">
          bottles
        </div>
      </motion.button>
    </Marker>
  );
}
