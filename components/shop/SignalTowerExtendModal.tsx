"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SignalTower } from "@/lib/types";
import { TOWER_EXTEND_7D_COST, TOWER_EXTEND_30D_COST } from "@/lib/types";
import MapModal from "@/components/ui/MapModal";
import LiveCountdown from "@/components/ui/LiveCountdown";

type Props = {
  tower: SignalTower;
  bottleCaps: number;
  onClose: () => void;
  onExtended: (capCost: number) => void;
};

export default function SignalTowerExtendModal({
  tower,
  bottleCaps,
  onClose,
  onExtended,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getSupabase = useCallback(() => createClient(), []);

  const extend = async (days: 7 | 30) => {
    const cost = days === 7 ? TOWER_EXTEND_7D_COST : TOWER_EXTEND_30D_COST;
    if (bottleCaps < cost) return;
    setSubmitting(true);
    setError(null);
    const supabase = getSupabase();
    const { error: rpcError } = await supabase.rpc("extend_signal_tower", {
      p_tower_id: tower.id,
      p_days: days,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onExtended(cost);
    onClose();
  };

  return (
    <MapModal
      onClose={onClose}
      title="Extend signal tower"
      maxWidth="sm"
      subtitle={
        <p className="text-sm text-slate-600 mt-1">
          Expires in{" "}
          <LiveCountdown expiresAt={tower.expires_at} className="bg-sky-100 text-sky-800" />
        </p>
      }
    >
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="space-y-2">
        <button
          type="button"
          disabled={submitting || bottleCaps < TOWER_EXTEND_7D_COST}
          onClick={() => extend(7)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
        >
          +7 days{" "}
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-normal text-white">
            −{TOWER_EXTEND_7D_COST} caps
          </span>
        </button>
        <button
          type="button"
          disabled={submitting || bottleCaps < TOWER_EXTEND_30D_COST}
          onClick={() => extend(30)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
        >
          +30 days{" "}
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-normal text-white">
            −{TOWER_EXTEND_30D_COST} caps
          </span>
        </button>
      </div>
    </MapModal>
  );
}
