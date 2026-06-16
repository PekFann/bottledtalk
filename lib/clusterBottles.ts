import type { BottleCluster, MapMarker, NearbyBottle } from "@/lib/types";

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

export function clusterBottles(
  bottles: NearbyBottle[],
  radiusM: number
): MapMarker[] {
  const remaining = [...bottles];
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
      markers.push({ kind: "single", bottle: seed });
    } else {
      const avgLat = group.reduce((s, b) => s + b.lat, 0) / group.length;
      const avgLng = group.reduce((s, b) => s + b.lng, 0) / group.length;
      const cluster: BottleCluster = {
        id: `cluster-${group.map((b) => b.id).sort().join("-")}`,
        lat: avgLat,
        lng: avgLng,
        count: group.length,
        bottles: group.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      };
      markers.push({ kind: "cluster", cluster });
    }
  }

  return markers;
}
