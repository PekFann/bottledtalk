"use client";

import { ChevronRight, Radio } from "lucide-react";
import type { MapStackItem, NearbyBottle, SignalTower } from "@/lib/types";
import { getCatalogDescription } from "@/lib/bottleCatalog";
import BottleImage from "@/components/bottles/BottleImage";
import LiveCountdown from "@/components/ui/LiveCountdown";
import MapModal from "@/components/ui/MapModal";

type Props = {
  items: MapStackItem[];
  currentUserId?: string;
  onSelectBottle: (bottle: NearbyBottle) => void;
  onSelectTower: (tower: SignalTower) => void;
  onClose: () => void;
};

const ROW_BUTTON_CLASS =
  "w-full flex items-center gap-3 rounded-xl glass-card p-3.5 text-left hover:bg-sky-50 hover:border-sky-300 transition-colors";

export default function StackPickerModal({
  items,
  currentUserId,
  onSelectBottle,
  onSelectTower,
  onClose,
}: Props) {
  return (
    <MapModal
      onClose={onClose}
      title="Treasures gathered here"
      panelClassName="max-h-[70dvh]"
      bodyClassName="p-3 space-y-2"
    >
      <ul className="space-y-2">
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
                      <LiveCountdown expiresAt={bottle.expires_at} /> until the tide
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
                      <LiveCountdown
                        expiresAt={tower.expires_at}
                        className="bg-sky-100 text-sky-800"
                      />{" "}
                      of light remaining
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-sky-500 shrink-0" />
                </button>
              </li>
            );
          }

          return (
            <li key={`tower-${tower.id}`}>
              <div className="w-full flex items-center gap-3 rounded-xl glass-card border-slate-200 p-3.5 text-left opacity-90">
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
                    <LiveCountdown
                      expiresAt={tower.expires_at}
                      className="bg-sky-100 text-sky-800"
                    />{" "}
                    of light remaining
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </MapModal>
  );
}
