"use client";

import Link from "next/link";
import type { NearbyBottle } from "@/lib/types";
import { formatCountdown } from "@/lib/geo";

type Props = {
  bottle: NearbyBottle;
  onClose: () => void;
};

export default function BottlePreviewSheet({ bottle, onClose }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-6">
      <div className="mx-auto max-w-lg rounded-2xl bg-white shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: bottle.marker_color }}
            >
              {bottle.type_icon}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{bottle.title}</h2>
              <p className="text-sm text-slate-500">
                {bottle.type_name} · by {bottle.creator_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          ⏳ Washes away in {formatCountdown(bottle.expires_at)}
        </p>

        <Link
          href={`/bottle/${bottle.id}`}
          className="mt-4 block w-full rounded-lg bg-sky-600 text-white text-center font-semibold py-2.5 hover:bg-sky-700 transition-colors"
        >
          Open conversation
        </Link>
      </div>
    </div>
  );
}
