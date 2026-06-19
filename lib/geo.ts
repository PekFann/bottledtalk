export function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDuration(hours: number): string {
  if (hours >= 168) return `${Math.floor(hours / 24)} days`;
  if (hours >= 24) return `${Math.floor(hours / 24)} day${hours >= 48 ? "s" : ""}`;
  return `${hours} hours`;
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

function buildCircleRing(
  lng: number,
  lat: number,
  radiusM: number,
  points = 64
): [number, number][] {
  const coords: [number, number][] = [];
  const earthRadius = 6371000;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusM * Math.cos(angle);
    const dy = radiusM * Math.sin(angle);
    const newLat = lat + (dy / earthRadius) * (180 / Math.PI);
    const newLng =
      lng + (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    coords.push([newLng, newLat]);
  }

  return coords;
}

const DISCOVERY_MASK_OUTER_RADIUS_MULTIPLIER = 40;

/** Outer vignette extends well beyond the viewport at min zoom (scales with discovery radius). */
export function getDiscoveryMaskOuterRadiusM(radiusM: number): number {
  return Math.max(radiusM * DISCOVERY_MASK_OUTER_RADIUS_MULTIPLIER, 80_000);
}

export function createDiscoveryCircleGeoJSON(
  lng: number,
  lat: number,
  radiusM: number,
  points = 64
) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [buildCircleRing(lng, lat, radiusM, points)],
    },
    properties: {},
  };
}

export function createDiscoveryMaskGeoJSON(
  lng: number,
  lat: number,
  radiusM: number,
  points = 64
) {
  const outer = buildCircleRing(
    lng,
    lat,
    getDiscoveryMaskOuterRadiusM(radiusM),
    points
  );
  const inner = [...buildCircleRing(lng, lat, radiusM, points)].reverse();

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [outer, inner],
    },
    properties: {},
  };
}
