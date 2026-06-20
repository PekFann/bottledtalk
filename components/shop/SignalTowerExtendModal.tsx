"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SignalTower } from "@/lib/types";
import { TOWER_EXTEND_7D_COST, TOWER_EXTEND_30D_COST } from "@/lib/types";
import MapModal from "@/components/ui/MapModal";

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
    >
      <div className="glass-card rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-700">
          Expires {new Date(tower.expires_at).toLocaleDateString()}
        </p>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="space-y-2">
        <button type="button" disabled={submitting || bottleCaps < TOWER_EXTEND_7D_COST} onClick={() => extend(7)} className="w-full btn-primary-block py-2.5 text-sm">
          +7 days (−{TOWER_EXTEND_7D_COST} caps)
        </button>
        <button type="button" disabled={submitting || bottleCaps < TOWER_EXTEND_30D_COST} onClick={() => extend(30)} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
          +30 days (−{TOWER_EXTEND_30D_COST} caps)
        </button>
      </div>
    </MapModal>
  );
}
