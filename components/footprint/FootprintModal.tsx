"use client";

import { useCallback, useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Footprint } from "@/lib/types";
import MapModal from "@/components/ui/MapModal";
import LiveCountdown from "@/components/ui/LiveCountdown";

type Props = {
  onClose: () => void;
  onSelect: (footprint: Footprint) => void;
  onOpenShop: () => void;
};

export default function FootprintModal({ onClose, onSelect, onOpenShop }: Props) {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(true);
  const getSupabase = useCallback(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data } = await supabase.rpc("list_my_footprints");
      if (data) {
        setFootprints(
          data.map((fp: Footprint & { user_id?: string }) => ({
            ...fp,
            user_id: fp.user_id ?? "",
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [getSupabase]);

  return (
    <MapModal
      onClose={onClose}
      title="Your footprints"
      maxWidth="md"
      panelClassName="max-h-[70dvh]"
      bodyClassName="p-4 space-y-2"
    >
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
      ) : footprints.length === 0 ? (
        <div className="text-center py-8">
          <Footprints className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No footprints yet</p>
          <button type="button" onClick={onOpenShop} className="mt-3 text-sm text-sky-600 font-medium">
            Get one in Shop
          </button>
        </div>
      ) : (
        footprints.map((fp) => (
          <button
            key={fp.id}
            type="button"
            onClick={() => onSelect(fp)}
            className="w-full flex items-center gap-3 rounded-lg glass-card p-3 text-left hover:bg-sky-50 transition-colors"
          >
            <Footprints className="h-5 w-5 text-slate-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-slate-900 truncate">{fp.name}</p>
              <div className="mt-1">
                <LiveCountdown expiresAt={fp.expires_at} />
              </div>
            </div>
            <span className="text-xs font-medium text-sky-600 shrink-0">Go</span>
          </button>
        ))
      )}
    </MapModal>
  );
}
