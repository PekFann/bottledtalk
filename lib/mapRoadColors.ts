import type { Map as MapboxMap } from "mapbox-gl";

const HIGHWAY_LAYERS = new Set([
  "road-motorway",
  "road-motorway-link",
  "road-trunk",
  "road-trunk-link",
]);

const HIGHWAY_CASE_SUFFIX = "-case";

const LIGHT_ROAD_LAYERS = new Set([
  "road-primary",
  "road-secondary",
  "road-tertiary",
  "road-street",
  "road-minor",
  "road-construction",
]);

const HIGHWAY_COLOR = "#6b7280";
const HIGHWAY_CASE_COLOR = "#9ca3af";
const LIGHT_ROAD_COLOR = "#e5e7eb";

function setLineColorIfExists(map: MapboxMap, layerId: string, color: string) {
  const layer = map.getLayer(layerId);
  if (layer && layer.type === "line") {
    map.setPaintProperty(layerId, "line-color", color);
  }
}

export function applyGreyRoadColors(map: MapboxMap) {
  const layers = map.getStyle()?.layers ?? [];

  for (const layer of layers) {
    if (layer.type !== "line" || !layer.id.startsWith("road-")) continue;

    const id = layer.id;

    if (HIGHWAY_LAYERS.has(id)) {
      setLineColorIfExists(map, id, HIGHWAY_COLOR);
    } else if (
      id.endsWith(HIGHWAY_CASE_SUFFIX) &&
      (id.includes("motorway") || id.includes("trunk"))
    ) {
      setLineColorIfExists(map, id, HIGHWAY_CASE_COLOR);
    } else if (LIGHT_ROAD_LAYERS.has(id)) {
      setLineColorIfExists(map, id, LIGHT_ROAD_COLOR);
    }
  }
}
