"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlacementIntent } from "@/lib/placement";
import { placementKindLabel, placementLabel } from "@/lib/placement";
import MapModal from "@/components/ui/MapModal";

type Props = {
  intent: PlacementIntent;
  placement: { lat: number; lng: number };
  anchor: { lat: number; lng: number };
  radiusM: number;
  onBack: () => void;
  onSuccess: (capCost: number) => void;
  onClose: () => void;
};

export default function PlacementConfirmModal({
  intent,
  placement,
  anchor,
  radiusM,
  onBack,
  onSuccess,
  onClose,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getSupabase = useCallback(() => createClient(), []);

  const anchorParams = {
    p_anchor_lat: anchor.lat,
    p_anchor_lng: anchor.lng,
    p_radius_m: radiusM,
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    const supabase = getSupabase();

    let rpcError: { message: string } | null = null;

    if (intent.kind === "bottle") {
      const { error } = await supabase.rpc("drop_bottle", {
        p_bottle_type_id: intent.bottleTypeId,
        p_lat: placement.lat,
        p_lng: placement.lng,
        p_title: intent.title,
        p_message: intent.message,
        p_description: intent.description,
        p_pin: intent.pin,
        ...anchorParams,
      });
      rpcError = error;
    } else if (intent.kind === "tower") {
      const { error } = await supabase.rpc("place_signal_tower", {
        p_lat: placement.lat,
        p_lng: placement.lng,
        ...anchorParams,
      });
      rpcError = error;
    } else if (intent.kind === "footprint") {
      const { error } = await supabase.rpc("create_footprint", {
        p_name: intent.name,
        p_lat: placement.lat,
        p_lng: placement.lng,
        ...anchorParams,
      });
      rpcError = error;
    } else {
      const { error } = await supabase.rpc("place_decoration", {
        p_title: intent.title,
        p_description: intent.description,
        p_lat: placement.lat,
        p_lng: placement.lng,
        ...anchorParams,
      });
      rpcError = error;
    }

    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    onSuccess(intent.capCost);
    onClose();
  };

  return (
    <MapModal
      onClose={onBack}
      title="Confirm placement"
      subtitle={
        <p className="text-sm text-slate-600 mt-0.5">
          {placementKindLabel(intent)} · {placementLabel(intent)}
        </p>
      }
      maxWidth="sm"
    >
      <div className="glass-card rounded-lg p-4 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-medium text-slate-900">Cost:</span> {intent.capCost} caps
        </p>
        <p>
          <span className="font-medium text-slate-900">Location:</span>{" "}
          {placement.lat.toFixed(5)}, {placement.lng.toFixed(5)}
        </p>
        {intent.kind === "decoration" && (
          <p className="text-slate-600 italic">{intent.description}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 btn-primary-block py-2.5 text-sm disabled:opacity-50"
        >
          {submitting ? "Placing…" : `Place (−${intent.capCost} caps)`}
        </button>
      </div>
    </MapModal>
  );
}
