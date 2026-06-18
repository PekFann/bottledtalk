import type { Map as MapboxMap } from "mapbox-gl";

const HIGHWAY_COLOR = "#8991a0";
const HIGHWAY_CASE_COLOR = "#b0b5bf";
const LIGHT_ROAD_COLOR = "#e5e7eb";

const SKIP_PATTERNS = ["label", "rail", "path", "pedestrian", "steps"];

function isRoadLikeLayer(id: string): boolean {
  return (
    id.startsWith("road-") ||
    id.startsWith("bridge-") ||
    id.startsWith("tunnel-")
  );
}

function isHighwayLayer(id: string): boolean {
  return (
    id.includes("motorway") || id.includes("trunk") || id.includes("major-link")
  );
}

function isLightRoadLayer(id: string): boolean {
  return (
    id.includes("primary") ||
    id.includes("secondary") ||
    id.includes("tertiary") ||
    id.includes("street") ||
    id.includes("minor") ||
    id.includes("construction")
  );
}

function shouldSkipRoadLayer(id: string): boolean {
  return SKIP_PATTERNS.some((pattern) => id.includes(pattern));
}

function classifyRoadLayer(id: string): string | null {
  if (!isRoadLikeLayer(id) || shouldSkipRoadLayer(id)) return null;

  if (isHighwayLayer(id)) {
    return id.endsWith("-case") ? HIGHWAY_CASE_COLOR : HIGHWAY_COLOR;
  }

  if (isLightRoadLayer(id)) {
    return LIGHT_ROAD_COLOR;
  }

  return null;
}

function setLineColorIfExists(map: MapboxMap, layerId: string, color: string) {
  const layer = map.getLayer(layerId);
  if (layer && layer.type === "line") {
    map.setPaintProperty(layerId, "line-color", color);
  }
}

export function applyGreyRoadColors(map: MapboxMap) {
  const layers = map.getStyle()?.layers ?? [];
  let matched = 0;

  for (const layer of layers) {
    if (layer.type !== "line" || !isRoadLikeLayer(layer.id)) continue;

    const color = classifyRoadLayer(layer.id);
    if (!color) continue;

    setLineColorIfExists(map, layer.id, color);
    matched++;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug(`[mapRoadColors] recolored ${matched} road layers`);
  }
}
