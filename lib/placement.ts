import type { MapMarker } from "@/lib/types";

export type PlacementIntent =
  | {
      kind: "bottle";
      bottleTypeId: string;
      title: string;
      message: string;
      description: string | null;
      pin: string | null;
      capCost: number;
      isSealed: boolean;
    }
  | { kind: "tower"; capCost: number }
  | { kind: "footprint"; name: string; capCost: number }
  | { kind: "decoration"; title: string; description: string; capCost: number };

export function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isWithinRadius(
  lat: number,
  lng: number,
  anchor: { lat: number; lng: number },
  radiusM: number
): boolean {
  return haversineM(anchor.lat, anchor.lng, lat, lng) <= radiusM;
}

export function getMarkerLat(marker: MapMarker): number {
  if (marker.kind === "cluster") return marker.stack.lat;
  return marker.item.kind === "bottle" ? marker.item.bottle.lat : marker.item.tower.lat;
}

export function markerZIndex(index: number, selected = false): number {
  return index + 1 + (selected ? 1000 : 0);
}

function markerKindDepthRank(marker: MapMarker): number {
  if (marker.kind === "cluster") return 1;
  return marker.item.kind === "tower" ? 0 : 1;
}

export function getMapMarkerDepthRank(marker: MapMarker): number {
  return markerKindDepthRank(marker);
}

export function sortMarkersByDepth(markers: MapMarker[]): MapMarker[] {
  return [...markers].sort((a, b) => {
    const latDiff = getMarkerLat(b) - getMarkerLat(a);
    if (latDiff !== 0) return latDiff;
    return markerKindDepthRank(a) - markerKindDepthRank(b);
  });
}

export function sortByMapDepthLat(latA: number, latB: number, rankA: number, rankB: number): number {
  const latDiff = latB - latA;
  if (latDiff !== 0) return latDiff;
  return rankA - rankB;
}

export function placementLabel(intent: PlacementIntent): string {
  switch (intent.kind) {
    case "bottle":
      return intent.title;
    case "tower":
      return "Signal tower";
    case "footprint":
      return intent.name;
    case "decoration":
      return intent.title;
  }
}

export function placementKindLabel(intent: PlacementIntent): string {
  switch (intent.kind) {
    case "bottle":
      return "Bottle";
    case "tower":
      return "Signal tower";
    case "footprint":
      return "Footprint";
    case "decoration":
      return "Decoration";
  }
}
