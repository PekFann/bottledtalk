"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  title: string;
  typeName: string;
  collectedAt: string;
};

function ConfirmDialog({
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl game-panel-light p-5 shadow-lg">
        <div className="glass-card rounded-lg p-3">
          <p className="text-sm font-medium text-slate-800">{message}</p>
        </div>
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
            className="rounded-lg btn-primary px-4 py-2 text-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BagViewHeader({ title, typeName, collectedAt }: Props) {
  const router = useRouter();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const savedDate = new Date(collectedAt).toLocaleDateString();

  return (
    <>
      <header className="flex items-center gap-3 border-b border-sky-200/50 game-panel-pastel px-4 py-4 shrink-0">
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <BottleImage size="xl" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-handwriting text-2xl text-slate-800 truncate">{title}</h1>
            <p className="text-sm text-slate-500">
              {typeName} · saved {savedDate}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Return to map"
        >
          <X className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </header>

      {showExitConfirm && (
        <ConfirmDialog
          message="Return to map?"
          confirmLabel="Leave"
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => router.push("/map")}
        />
      )}
    </>
  );
}
