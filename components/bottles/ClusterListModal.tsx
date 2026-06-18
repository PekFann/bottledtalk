"use client";

import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import type { NearbyBottle } from "@/lib/types";
import { formatCountdown } from "@/lib/geo";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  bottles: NearbyBottle[];
  onSelect: (bottle: NearbyBottle) => void;
  onClose: () => void;
};

export default function ClusterListModal({ bottles, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-xl game-panel-light max-h-[70dvh] overflow-hidden flex flex-col"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {bottles.length} bottles here
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="overflow-y-auto p-3 space-y-1.5">
          {bottles.map((bottle) => (
            <li key={bottle.id}>
              <button
                type="button"
                onClick={() => onSelect(bottle)}
                className="w-full flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50 transition-colors"
              >
                <BottleImage size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-slate-900 truncate">{bottle.title}</p>
                  <p className="text-xs text-slate-500">
                    {bottle.type_name} · {formatCountdown(bottle.expires_at)} left
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
