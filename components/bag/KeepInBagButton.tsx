"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  bottleId: string;
  alreadyInBag: boolean;
  isExpired: boolean;
};

export default function KeepInBagButton({
  bottleId,
  alreadyInBag,
  isExpired,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyInBag);
  const getSupabase = useCallback(() => createClient(), []);
  const router = useRouter();

  if (done) {
    return (
      <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
        In your bag — view from the map
      </p>
    );
  }

  const handleCollect = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const reason = isExpired ? "expired" : "manual";
    const { error: rpcError } = await supabase.rpc("collect_to_bag", {
      p_bottle_id: bottleId,
      p_reason: reason,
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setDone(true);
    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleCollect}
        disabled={loading}
        className="w-full rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-900 font-semibold py-2.5 hover:bg-amber-100 disabled:opacity-50 transition-colors"
      >
        {loading ? "Stashing…" : "🎒 Keep in bag"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
