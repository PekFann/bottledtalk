"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlacementIntent } from "@/lib/placement";
import type { PlacementSuccessMeta } from "@/lib/optimisticBottle";
import { placementKindLabel, placementLabel } from "@/lib/placement";
import { getDecorationType } from "@/lib/decorationCatalog";
import {
  friendlyDropBottleError,
  uploadPendingBottleImage,
} from "@/lib/bottleImage";
import MapModal from "@/components/ui/MapModal";
import CapAmount from "@/components/ui/CapAmount";

type Props = {
  intent: PlacementIntent;
  placement: { lat: number; lng: number };
  anchor: { lat: number; lng: number };
  radiusM: number;
  onBack: () => void;
  onSuccess: (capCost: number, meta: PlacementSuccessMeta) => void;
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
  const [errorKind, setErrorKind] = useState<"photo" | "place" | null>(null);
  const getSupabase = useCallback(() => createClient(), []);

  const anchorParams = {
    p_anchor_lat: anchor.lat,
    p_anchor_lng: anchor.lng,
    p_radius_m: radiusM,
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    setErrorKind(null);
    const supabase = getSupabase();

    let rpcError: { message: string } | null = null;
    let newBottleId: string | undefined;

    if (intent.kind === "bottle") {
      let imagePath: string | null = null;
      if (intent.imageFile) {
        try {
          imagePath = await uploadPendingBottleImage(intent.imageFile);
        } catch (err) {
          setSubmitting(false);
          setErrorKind("photo");
          setError(err instanceof Error ? err.message : "Couldn’t upload photo");
          return;
        }
      }

      const { data, error: placeError } = await supabase.rpc("drop_bottle", {
        p_bottle_type_id: intent.bottleTypeId,
        p_lat: placement.lat,
        p_lng: placement.lng,
        p_title: intent.title,
        p_message: intent.message,
        p_description: intent.description,
        p_pin: intent.pin,
        p_image_path: imagePath,
        ...anchorParams,
      });
      rpcError = placeError
        ? { message: friendlyDropBottleError(placeError.message) }
        : null;
      if (!placeError && data) newBottleId = data as string;
    } else if (intent.kind === "tower") {
      const { error: placeError } = await supabase.rpc("place_signal_tower", {
        p_lat: placement.lat,
        p_lng: placement.lng,
        ...anchorParams,
      });
      rpcError = placeError;
    } else if (intent.kind === "footprint") {
      const { error: placeError } = await supabase.rpc("create_footprint", {
        p_name: intent.name,
        p_lat: placement.lat,
        p_lng: placement.lng,
        ...anchorParams,
      });
      rpcError = placeError;
    } else {
      const { error: placeError } = await supabase.rpc("place_decoration", {
        p_title: intent.title,
        p_description: intent.description,
        p_decoration_type: intent.decorationTypeId,
        p_lat: placement.lat,
        p_lng: placement.lng,
        ...anchorParams,
      });
      rpcError = placeError;
    }

    setSubmitting(false);
    if (rpcError) {
      setErrorKind("place");
      setError(rpcError.message);
      return;
    }

    onSuccess(intent.capCost, { bottleId: newBottleId, intent, placement });
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
        <p className="flex items-center gap-1">
          <span className="font-medium text-slate-900">Cost:</span>{" "}
          <CapAmount amount={intent.capCost} />
        </p>
        <p>
          <span className="font-medium text-slate-900">Location:</span>{" "}
          {placement.lat.toFixed(5)}, {placement.lng.toFixed(5)}
        </p>
        {intent.kind === "bottle" && intent.imageFile && (
          <p>
            <span className="font-medium text-slate-900">Photo:</span> Attached
          </p>
        )}
        {intent.kind === "decoration" && (() => {
          const decorationType = getDecorationType(intent.decorationTypeId);
          return (
            <>
              {decorationType && (
                <p className="flex items-center gap-2 text-slate-700">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: `${decorationType.marker_color}22` }}
                    aria-hidden
                  >
                    {decorationType.icon}
                  </span>
                  <span>{decorationType.name}</span>
                </p>
              )}
              <p className="text-slate-600 italic">{intent.description}</p>
            </>
          );
        })()}
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          <p className="font-medium text-red-800">
            {errorKind === "photo" ? "Photo upload failed" : "Couldn’t place on map"}
          </p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

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
          {submitting ? (
            intent.kind === "bottle" && intent.imageFile ? "Uploading photo…" : "Placing…"
          ) : (
            <>
              Place (<CapAmount amount={intent.capCost} prefix="−" />)
            </>
          )}
        </button>
      </div>
    </MapModal>
  );
}
