import type { Map as MapboxMap } from "mapbox-gl";

export const MAP_STYLE_DEFAULT = "mapbox://styles/mapbox/light-v11";

export type MapThemeConfig = {
  water: string;
  park: string;
  discoveryFill: string;
  discoveryOutline: string;
  discoveryFillOpacity: number;
  discoveryOutlineOpacity: number;
  userPin: string;
  userPinPing: string;
  tintStrength: number;
  fogEnabled: boolean;
};

export type MapThemeOverrides = Partial<MapThemeConfig>;

export const DEFAULT_MAP_THEME: MapThemeConfig = {
  water: "#A8CCE8",
  park: "#D4E8D4",
  discoveryFill: "#93C5FD",
  discoveryOutline: "#5B9BD5",
  discoveryFillOpacity: 0.15,
  discoveryOutlineOpacity: 0.55,
  userPin: "#5BA3B8",
  userPinPing: "#7EC8D8",
  tintStrength: 0.45,
  fogEnabled: true,
};

/** Approximate light-v11 base colors for tint blending */
const BASE_LAYER_COLORS = {
  water: "#C6D9E5",
  park: "#E2E9D8",
} as const;

export const MAP_THEME_PRESETS: Record<
  string,
  { label: string; config: MapThemeOverrides }
> = {
  natural: {
    label: "Natural",
    config: { tintStrength: 0, fogEnabled: false },
  },
  softPastel: {
    label: "Soft Pastel",
    config: { ...DEFAULT_MAP_THEME, tintStrength: 0.45 },
  },
  cozy: {
    label: "Cozy",
    config: {
      ...DEFAULT_MAP_THEME,
      water: "#9BBFE0",
      park: "#C8E0C8",
      tintStrength: 0.65,
    },
  },
};

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
  return `#${c.toString(16).padStart(6, "0")}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function lerpHex(base: string, target: string, t: number): string {
  const a = parseHex(base);
  const b = parseHex(target);
  if (!a || !b) return target;
  const s = Math.max(0, Math.min(1, t));
  return toHex(
    a[0] + (b[0] - a[0]) * s,
    a[1] + (b[1] - a[1]) * s,
    a[2] + (b[2] - a[2]) * s
  );
}

function parseEnvNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseEnvBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function parseEnvColor(
  value: string | undefined,
  fallback: string
): string {
  if (!value?.trim()) return fallback;
  return parseHex(value) ? value.trim() : fallback;
}

export function getEnvMapTheme(): MapThemeOverrides {
  if (typeof process === "undefined") return {};
  return {
    water: process.env.NEXT_PUBLIC_MAP_WATER,
    park: process.env.NEXT_PUBLIC_MAP_PARK,
    discoveryFill: process.env.NEXT_PUBLIC_MAP_DISCOVERY_FILL,
    discoveryOutline: process.env.NEXT_PUBLIC_MAP_DISCOVERY_OUTLINE,
    userPin: process.env.NEXT_PUBLIC_MAP_USER_PIN,
    tintStrength: process.env.NEXT_PUBLIC_MAP_TINT_STRENGTH
      ? parseEnvNumber(process.env.NEXT_PUBLIC_MAP_TINT_STRENGTH, DEFAULT_MAP_THEME.tintStrength)
      : undefined,
    fogEnabled: process.env.NEXT_PUBLIC_MAP_FOG
      ? parseEnvBool(process.env.NEXT_PUBLIC_MAP_FOG, DEFAULT_MAP_THEME.fogEnabled)
      : undefined,
  };
}

export function mergeMapTheme(
  ...layers: MapThemeOverrides[]
): MapThemeConfig {
  const merged = { ...DEFAULT_MAP_THEME };
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value !== undefined && value !== null) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }
  merged.tintStrength = Math.max(0, Math.min(1, merged.tintStrength));
  return merged;
}

export function getMapThemeConfig(
  overrides?: MapThemeOverrides
): MapThemeConfig {
  const env = getEnvMapTheme();
  const cleanedEnv: MapThemeOverrides = {
    water: env.water ? parseEnvColor(env.water, DEFAULT_MAP_THEME.water) : undefined,
    park: env.park ? parseEnvColor(env.park, DEFAULT_MAP_THEME.park) : undefined,
    discoveryFill: env.discoveryFill
      ? parseEnvColor(env.discoveryFill, DEFAULT_MAP_THEME.discoveryFill)
      : undefined,
    discoveryOutline: env.discoveryOutline
      ? parseEnvColor(env.discoveryOutline, DEFAULT_MAP_THEME.discoveryOutline)
      : undefined,
    userPin: env.userPin
      ? parseEnvColor(env.userPin, DEFAULT_MAP_THEME.userPin)
      : undefined,
    tintStrength: env.tintStrength,
    fogEnabled: env.fogEnabled,
  };
  return mergeMapTheme(cleanedEnv, overrides ?? {});
}

function setLayerFill(
  map: MapboxMap,
  layerId: string,
  baseColor: string,
  targetColor: string,
  strength: number
) {
  if (!map.getLayer(layerId)) return;
  if (strength <= 0) return;
  map.setPaintProperty(
    layerId,
    "fill-color",
    lerpHex(baseColor, targetColor, strength)
  );
}

export function applyMapTheme(map: MapboxMap, config: MapThemeConfig) {
  const { tintStrength, water, park, fogEnabled } = config;

  if (tintStrength > 0) {
    setLayerFill(map, "water", BASE_LAYER_COLORS.water, water, tintStrength);
    setLayerFill(map, "waterway", BASE_LAYER_COLORS.water, water, tintStrength);
    setLayerFill(map, "national-park", BASE_LAYER_COLORS.park, park, tintStrength);
  }

  if (fogEnabled && tintStrength > 0) {
    map.setFog({
      color: "rgb(240, 248, 252)",
      "high-color": "rgb(220, 235, 245)",
      "horizon-blend": 0.06 * tintStrength,
    });
  } else {
    map.setFog({});
  }
}

/** @deprecated use applyMapTheme */
export const PASTEL_COLORS = DEFAULT_MAP_THEME;
export function applyPastelMapTheme(map: MapboxMap) {
  applyMapTheme(map, DEFAULT_MAP_THEME);
}
