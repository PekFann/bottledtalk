"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  DEFAULT_MAP_THEME,
  MAP_THEME_PRESETS,
  mergeMapTheme,
  type MapThemeConfig,
  type MapThemeOverrides,
} from "@/lib/mapTheme";

type Props = {
  initialConfig: MapThemeConfig;
  savedOverrides: MapThemeOverrides | null;
  onClose: () => void;
  onApply: (overrides: MapThemeOverrides) => void;
  onReset: () => void;
};

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 cursor-pointer rounded border border-slate-200 bg-white"
      />
    </label>
  );
}

export default function MapAppearancePanel({
  initialConfig,
  savedOverrides,
  onClose,
  onApply,
  onReset,
}: Props) {
  const [draft, setDraft] = useState<MapThemeConfig>(initialConfig);

  useEffect(() => {
    setDraft(initialConfig);
  }, [initialConfig]);

  const update = (patch: MapThemeOverrides) => {
    setDraft((prev) => mergeMapTheme(prev, patch));
  };

  const applyPreset = (key: string) => {
    const preset = MAP_THEME_PRESETS[key];
    if (!preset) return;
    setDraft(mergeMapTheme(DEFAULT_MAP_THEME, preset.config));
  };

  const handleApply = () => {
    const overrides: MapThemeOverrides = {
      water: draft.water,
      park: draft.park,
      discoveryFill: draft.discoveryFill,
      discoveryOutline: draft.discoveryOutline,
      userPin: draft.userPin,
      tintStrength: draft.tintStrength,
      fogEnabled: draft.fogEnabled,
    };
    onApply(overrides);
    onClose();
  };

  const hasSaved = savedOverrides !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-md rounded-xl game-panel-light max-h-[90dvh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white rounded-t-xl">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Map colors</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune the map on this device
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Presets</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MAP_THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm text-slate-700 mb-2">
              <span>Tint strength</span>
              <span className="tabular-nums text-slate-500">
                {Math.round(draft.tintStrength * 100)}%
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(draft.tintStrength * 100)}
              onChange={(e) =>
                update({ tintStrength: Number(e.target.value) / 100 })
              }
              className="w-full accent-teal-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              0% keeps the standard Mapbox map; higher values add pastel color.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 mb-2">Colors</p>
            <ColorRow
              label="Water"
              value={draft.water}
              onChange={(v) => update({ water: v })}
            />
            <ColorRow
              label="Parks"
              value={draft.park}
              onChange={(v) => update({ park: v })}
            />
            <ColorRow
              label="Discovery ring"
              value={draft.discoveryFill}
              onChange={(v) => update({ discoveryFill: v })}
            />
            <ColorRow
              label="Your location"
              value={draft.userPin}
              onChange={(v) => update({ userPin: v, userPinPing: v })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.fogEnabled}
              onChange={(e) => update({ fogEnabled: e.target.checked })}
              className="rounded border-slate-300 accent-teal-500"
            />
            Soft horizon fog (3D view)
          </label>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white px-5 py-4 rounded-b-xl">
          {hasSaved && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-lg bg-teal-500 text-white py-2.5 text-sm font-semibold hover:bg-teal-600"
          >
            Apply
          </button>
        </div>
      </motion.div>
    </div>
  );
}
