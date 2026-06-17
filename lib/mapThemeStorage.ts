import type { MapThemeOverrides } from "@/lib/mapTheme";

const STORAGE_KEY = "bottledtalk-map-theme";

export function loadMapThemeOverrides(): MapThemeOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MapThemeOverrides;
  } catch {
    return null;
  }
}

export function saveMapThemeOverrides(overrides: MapThemeOverrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function clearMapThemeOverrides(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
