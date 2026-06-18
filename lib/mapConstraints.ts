import type { Map as MapboxMap } from "mapbox-gl";

export const MAP_BOUNDS_RADIUS_MULTIPLIER = 2.5;
export const MAP_MIN_ZOOM_RADIUS_MULTIPLIER = 1.35;
export const MAP_MIN_ZOOM_PADDING_PX = 64;
export const MAP_USER_VISIBLE_MARGIN_PX = 48;

const EARTH_RADIUS_M = 6371000;

export type LngLat = { lng: number; lat: number };

export function getBoundsAroundPoint(
  lng: number,
  lat: number,
  radiusM: number
): [[number, number], [number, number]] {
  const latDelta = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);

  return [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
  ];
}

export function clampCenterNearUser(
  center: LngLat,
  user: LngLat,
  maxPanM: number
): LngLat {
  const dLat = center.lat - user.lat;
  const dLng = center.lng - user.lng;
  const latRad = (user.lat * Math.PI) / 180;
  const dx = dLng * Math.cos(latRad) * EARTH_RADIUS_M * (Math.PI / 180);
  const dy = dLat * EARTH_RADIUS_M * (Math.PI / 180);
  const distanceM = Math.sqrt(dx * dx + dy * dy);

  if (distanceM <= maxPanM) return center;

  const ratio = maxPanM / distanceM;
  return {
    lat: user.lat + dLat * ratio,
    lng: user.lng + dLng * ratio,
  };
}

export function adjustCenterToKeepUserVisible(
  map: MapboxMap,
  userLng: number,
  userLat: number,
  marginPx: number
): LngLat | null {
  const point = map.project([userLng, userLat]);
  const width = map.getContainer().clientWidth;
  const height = map.getContainer().clientHeight;

  let dx = 0;
  let dy = 0;

  if (point.x < marginPx) dx = point.x - marginPx;
  if (point.x > width - marginPx) dx = point.x - (width - marginPx);
  if (point.y < marginPx) dy = point.y - marginPx;
  if (point.y > height - marginPx) dy = point.y - (height - marginPx);

  if (dx === 0 && dy === 0) return null;

  const center = map.getCenter();
  const centerPoint = map.project(center);
  const adjusted = map.unproject([centerPoint.x + dx, centerPoint.y + dy]);

  return { lng: adjusted.lng, lat: adjusted.lat };
}
