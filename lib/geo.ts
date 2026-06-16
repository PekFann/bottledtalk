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

export function createDiscoveryCircleGeoJSON(
  lng: number,
  lat: number,
  radiusM: number,
  points = 64
) {
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

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };
}
