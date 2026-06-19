"use client";

import { motion } from "framer-motion";
import { ChevronRight, Radio, X } from "lucide-react";
import type { MapStackItem, NearbyBottle, SignalTower } from "@/lib/types";
import { getCatalogDescription } from "@/lib/bottleCatalog";
import { formatCountdown } from "@/lib/geo";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  items: MapStackItem[];
  currentUserId?: string;
  onSelectBottle: (bottle: NearbyBottle) => void;
  onSelectTower: (tower: SignalTower) => void;
  onClose: () => void;
};

const ROW_BUTTON_CLASS =
  "w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white shadow-md p-3.5 text-left hover:bg-sky-50 hover:border-sky-300 transition-colors";

export default function StackPickerModal({
  items,
  currentUserId,
  onSelectBottle,
  onSelectTower,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-lg rounded-xl bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200/80 max-h-[70dvh] overflow-hidden flex flex-col"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            Treasures gathered here
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="overflow-y-auto p-3 space-y-2">
          {items.map((item) => {
            if (item.kind === "bottle") {
              const bottle = item.bottle;
              const catalogLine = getCatalogDescription(bottle.type_slug);
              return (
                <li key={`bottle-${bottle.id}`}>
                  <button
                    type="button"
                    onClick={() => onSelectBottle(bottle)}
                    className={ROW_BUTTON_CLASS}
                  >
                    <BottleImage size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base text-slate-900 truncate">
                        {bottle.title}
                      </p>
                      <p className="text-sm text-slate-600 italic truncate">
                        {catalogLine ?? bottle.type_name}
                      </p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        {formatCountdown(bottle.expires_at)} until the tide
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-sky-500 shrink-0" />
                  </button>
                </li>
              );
            }

            const tower = item.tower;
            const isOwner = tower.owner_id === currentUserId;

            if (isOwner) {
              return (
                <li key={`tower-${tower.id}`}>
                  <button
                    type="button"
                    onClick={() => onSelectTower(tower)}
                    className={ROW_BUTTON_CLASS}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <Radio className="h-5 w-5 text-sky-600" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base text-slate-900">
                        Your signal tower
                      </p>
                      <p className="text-sm text-slate-600 italic">
                        A beacon calling bottles from afar
                      </p>
                      <p className="text-sm text-sky-700 mt-0.5">
                        {formatCountdown(tower.expires_at)} of light remaining
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-sky-500 shrink-0" />
                  </button>
                </li>
              );
            }

            return (
              <li key={`tower-${tower.id}`}>
                <div className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-100 p-3.5 text-left opacity-90">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
                    <Radio className="h-5 w-5 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base text-slate-700">
                      Signal tower · {tower.owner_name}
                    </p>
                    <p className="text-sm text-slate-600 italic">
                      Another sailor&apos;s beacon on the horizon
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {formatCountdown(tower.expires_at)} of light remaining
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
