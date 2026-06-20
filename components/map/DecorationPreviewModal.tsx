"use client";

import type { MapDecoration } from "@/lib/types";
import MapModal from "@/components/ui/MapModal";
import LiveCountdown from "@/components/ui/LiveCountdown";

type Props = {
  decoration: MapDecoration;
  onClose: () => void;
};

export default function DecorationPreviewModal({ decoration, onClose }: Props) {
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
      <div className="glass-card rounded-lg p-4">
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {decoration.description}
        </p>
      </div>
    </MapModal>
  );
}
