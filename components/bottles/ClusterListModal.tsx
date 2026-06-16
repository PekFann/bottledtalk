"use client";

import { motion } from "framer-motion";
import type { NearbyBottle } from "@/lib/types";
import { formatCountdown } from "@/lib/geo";

type Props = {
  bottles: NearbyBottle[];
  onSelect: (bottle: NearbyBottle) => void;
  onClose: () => void;
};

export default function ClusterListModal({ bottles, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-2xl game-panel-light max-h-[70dvh] overflow-hidden flex flex-col"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
      >
        <div className="flex items-center justify-between border-b border-sky-200/50 px-5 py-4">
          <h2 className="text-lg font-bold text-sky-900">
            {bottles.length} bottles here
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <ul className="overflow-y-auto p-3 space-y-2">
          {bottles.map((bottle) => (
            <li key={bottle.id}>
              <button
                type="button"
                onClick={() => onSelect(bottle)}
                className="w-full flex items-center gap-3 rounded-xl border border-sky-100 bg-white/80 p-3 text-left hover:bg-sky-50 hover:border-sky-300 transition-colors"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: bottle.marker_color }}
                >
                  {bottle.type_icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">{bottle.title}</p>
                  <p className="text-xs text-slate-500">
                    {bottle.type_name} · {formatCountdown(bottle.expires_at)} left
                  </p>
                </div>
                <span className="text-sky-500 text-sm font-medium shrink-0">Open</span>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
