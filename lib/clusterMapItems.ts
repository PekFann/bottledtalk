import type { MapStack, MapStackItem, MapMarker, NearbyBottle, SignalTower } from "@/lib/types";

function haversineM(
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

type Point = { id: string; lat: number; lng: number; item: MapStackItem };

function sortStackItems(items: MapStackItem[]): MapStackItem[] {
  const bottles = items
    .filter((i): i is { kind: "bottle"; bottle: NearbyBottle } => i.kind === "bottle")
    .sort(
      (a, b) =>
        new Date(b.bottle.created_at).getTime() - new Date(a.bottle.created_at).getTime()
    );
  const towers = items.filter((i): i is { kind: "tower"; tower: SignalTower } => i.kind === "tower");
  return [...bottles, ...towers];
}

export function toMapStackItems(
  bottles: NearbyBottle[],
  towers: SignalTower[]
): MapStackItem[] {
  return [
    ...bottles.map((bottle) => ({ kind: "bottle" as const, bottle })),
    ...towers.map((tower) => ({ kind: "tower" as const, tower })),
  ];
}

export function clusterMapItems(
  bottles: NearbyBottle[],
  towers: SignalTower[],
  radiusM: number
): MapMarker[] {
  const points: Point[] = [
    ...bottles.map((bottle) => ({
      id: bottle.id,
      lat: bottle.lat,
      lng: bottle.lng,
      item: { kind: "bottle" as const, bottle },
    })),
    ...towers.map((tower) => ({
      id: tower.id,
      lat: tower.lat,
      lng: tower.lng,
      item: { kind: "tower" as const, tower },
    })),
  ];

  const remaining = [...points];
  const markers: MapMarker[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const group = [seed];

    for (let i = remaining.length - 1; i >= 0; i--) {
      const other = remaining[i];
      if (haversineM(seed.lat, seed.lng, other.lat, other.lng) <= radiusM) {
        group.push(other);
        remaining.splice(i, 1);
      }
    }

    if (group.length === 1) {
      markers.push({ kind: "single", item: seed.item });
    } else {
      const avgLat = group.reduce((s, p) => s + p.lat, 0) / group.length;
      const avgLng = group.reduce((s, p) => s + p.lng, 0) / group.length;
      const items = sortStackItems(group.map((p) => p.item));
      const stack: MapStack = {
        id: `stack-${group.map((p) => p.id).sort().join("-")}`,
        lat: avgLat,
        lng: avgLng,
        count: items.length,
        items,
      };
      markers.push({ kind: "cluster", stack });
    }
  }

  return markers;
}

export function stackFromItems(items: MapStackItem[], lat: number, lng: number): MapStack {
  const sorted = sortStackItems(items);
  return {
    id: `stack-pick-${sorted.map((i) => (i.kind === "bottle" ? i.bottle.id : i.tower.id)).sort().join("-")}`,
    lat,
    lng,
    count: sorted.length,
    items: sorted,
  };
}
