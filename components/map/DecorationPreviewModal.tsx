"use client";

import type { MapDecoration } from "@/lib/types";
import { getDecorationType } from "@/lib/decorationCatalog";
import MapModal from "@/components/ui/MapModal";
import LiveCountdown from "@/components/ui/LiveCountdown";

type Props = {
  decoration: MapDecoration;
  onClose: () => void;
};

export default function DecorationPreviewModal({ decoration, onClose }: Props) {
  const decorationType = getDecorationType(decoration.decoration_type);

  return (
    <MapModal
      onClose={onClose}
      title={decoration.title}
      subtitle={
        <p className="text-sm text-slate-600 mt-0.5">
          by {decoration.creator_name} · fades in{" "}
          <LiveCountdown
            expiresAt={decoration.expires_at}
            className="bg-violet-100 text-violet-800"
          />
        </p>
      }
      maxWidth="md"
    >
      {decorationType && (
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${decorationType.marker_color}22` }}
            aria-hidden
          >
            {decorationType.icon}
          </div>
          <p className="text-sm font-medium text-slate-700">{decorationType.name}</p>
        </div>
      )}
      <div className="glass-card rounded-lg p-4">
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {decoration.description}
        </p>
      </div>
    </MapModal>
  );
}
