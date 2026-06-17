import type { Map as MapboxMap } from "mapbox-gl";

export const MAP_STYLE_DEFAULT = "mapbox://styles/mapbox/light-v11";

export const PASTEL_COLORS = {
  water: "#E8D5F2",
  background: "#FFF5F8",
  land: "#FFF5F8",
  fogLow: "rgb(255, 232, 245)",
  fogHigh: "rgb(233, 213, 255)",
  discoveryFill: "#F0ABFC",
  discoveryFillOpacity: 0.18,
  discoveryOutline: "#E879A9",
  discoveryOutlineOpacity: 0.55,
  userPin: "#F472B6",
  userPinPing: "#F9A8D4",
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
