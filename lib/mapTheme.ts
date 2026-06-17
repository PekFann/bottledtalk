import type { Map as MapboxMap } from "mapbox-gl";

export const MAP_STYLE_DEFAULT = "mapbox://styles/mapbox/light-v11";

export const PASTEL_COLORS = {
  water: "#D4E8F7",
  background: "#FAF8F5",
  land: "#FAF8F5",
  fogLow: "rgb(240, 248, 252)",
  fogHigh: "rgb(220, 235, 245)",
  discoveryFill: "#93C5FD",
  discoveryFillOpacity: 0.15,
  discoveryOutline: "#7BAFD4",
  discoveryOutlineOpacity: 0.55,
  userPin: "#5BA3B8",
  userPinPing: "#7EC8D8",
} as const;

export function applyPastelMapTheme(map: MapboxMap) {
  if (map.getLayer("water")) {
    map.setPaintProperty("water", "fill-color", PASTEL_COLORS.water);
  }
  if (map.getLayer("background")) {
    map.setPaintProperty("background", "background-color", PASTEL_COLORS.background);
  }
  if (map.getLayer("land")) {
    map.setPaintProperty("land", "fill-color", PASTEL_COLORS.land);
  }

  map.setFog({
    color: PASTEL_COLORS.fogLow,
    "high-color": PASTEL_COLORS.fogHigh,
    "horizon-blend": 0.08,
  });
}
