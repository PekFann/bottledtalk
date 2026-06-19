"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import type { NearbyBottle } from "@/lib/types";
import { formatCountdown } from "@/lib/geo";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  bottle: NearbyBottle;
  onClose: () => void;
  footprintId?: string;
};

export default function BottlePreviewSheet({ bottle, onClose, footprintId }: Props) {
  const href = footprintId
    ? `/bottle/${bottle.id}?footprint=${footprintId}`
    : `/bottle/${bottle.id}`;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-36 sm:pb-6">
      <motion.div
        className="mx-auto max-w-lg rounded-xl game-panel-light p-5"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BottleImage size="md" />
            <div>
              <h2 className="font-semibold text-slate-900">{bottle.title}</h2>
              <p className="text-sm text-slate-500">
                {bottle.type_name} · {bottle.creator_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          Washes away in {formatCountdown(bottle.expires_at)}
        </p>

        <Link href={href} className="mt-4 block btn-primary-block font-medium">
          Open conversation
        </Link>
      </motion.div>
    </div>
  );
}
