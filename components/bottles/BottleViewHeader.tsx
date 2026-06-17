"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Backpack, Check, Map } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  bottleId: string;
  title: string;
  typeIcon: string;
  typeName: string;
  creatorName: string;
  participated: boolean;
  alreadyInBag: boolean;
  isExpired: boolean;
};

function ConfirmDialog({
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  loading,
}: {
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl game-panel-light p-5 shadow-lg">
        <p className="text-sm text-slate-700">{message}</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BottleViewHeader({
  bottleId,
  title,
  typeIcon,
  typeName,
  creatorName,
  participated,
  alreadyInBag,
  isExpired,
}: Props) {
  const router = useRouter();
  const getSupabase = useCallback(() => createClient(), []);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showBagConfirm, setShowBagConfirm] = useState(false);
  const [bagLoading, setBagLoading] = useState(false);
  const [bagError, setBagError] = useState<string | null>(null);
  const [inBag, setInBag] = useState(alreadyInBag);

  const handleKeepInBag = async () => {
    setBagLoading(true);
    setBagError(null);
    const supabase = getSupabase();
    const reason = isExpired ? "expired" : "manual";
    const { error: rpcError } = await supabase.rpc("collect_to_bag", {
      p_bottle_id: bottleId,
      p_reason: reason,
    });
    setBagLoading(false);
    if (rpcError) {
      setBagError(rpcError.message);
      return;
    }
    setInBag(true);
    setShowBagConfirm(false);
    router.refresh();
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b border-teal-200/50 game-panel-pastel px-4 py-3 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="font-handwriting text-xl text-slate-800 truncate">{title}</h1>
          <p className="text-xs text-slate-500">
            {typeIcon} {typeName} · by {creatorName}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {participated && (
            <button
              type="button"
              onClick={() => !inBag && setShowBagConfirm(true)}
              disabled={inBag}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-default transition-colors"
              aria-label={inBag ? "Already in bag" : "Keep in bag"}
            >
              {inBag ? (
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.25} />
              ) : (
                <Backpack className="h-4 w-4" strokeWidth={2.25} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Return to map"
          >
            <Map className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </header>

      {bagError && (
        <p className="px-4 py-2 text-sm text-red-600 bg-red-50 shrink-0">{bagError}</p>
      )}

      {showExitConfirm && (
        <ConfirmDialog
          message="Return to map?"
          confirmLabel="Leave"
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => router.push("/map")}
        />
      )}

      {showBagConfirm && (
        <ConfirmDialog
          message="Keep this bottle in your bag?"
          confirmLabel="Keep"
          loading={bagLoading}
          onCancel={() => setShowBagConfirm(false)}
          onConfirm={handleKeepInBag}
        />
      )}
    </>
  );
}
