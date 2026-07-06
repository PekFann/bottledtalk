import type { Map } from "mapbox-gl";
import type { MapStackItem } from "@/lib/types";

export const MAP_HIT_RADIUS_PX = 56;

function itemCoords(item: MapStackItem): [number, number] {
  if (item.kind === "bottle") {
    return [item.bottle.lng, item.bottle.lat];
  }
  return [item.tower.lng, item.tower.lat];
}

export function getStackItemsAtClick(
  map: Map,
  point: { x: number; y: number },
  items: MapStackItem[],
  radiusPx = MAP_HIT_RADIUS_PX
): MapStackItem[] {
  return items.filter((item) => {
    const [itemLng, itemLat] = itemCoords(item);
    const pt = map.project([itemLng, itemLat]);
    const dx = pt.x - point.x;
    const dy = pt.y - point.y;
    return Math.sqrt(dx * dx + dy * dy) <= radiusPx;
  });
}

export function getStackItemsAtPoint(
  map: Map,
  lng: number,
  lat: number,
  items: MapStackItem[],
  radiusPx = MAP_HIT_RADIUS_PX
): MapStackItem[] {
  const clickPoint = map.project([lng, lat]);
  return getStackItemsAtClick(map, clickPoint, items, radiusPx);
}
