import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DISCOVERY_RADIUS_M,
  TOWER_BOOST_RADIUS_M,
  FOOTPRINT_RADIUS_M,
} from "@/lib/types";

export const GPS_RELOAD_MIN_DISTANCE_M = 50;
export const GPS_RELOAD_MIN_INTERVAL_MS = 15000;

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

export function shouldReloadMapAtLocation(
  lat: number,
  lng: number,
  last: { lat: number; lng: number; at: number } | null
): boolean {
  if (!last) return true;
  if (Date.now() - last.at >= GPS_RELOAD_MIN_INTERVAL_MS) return true;
  return haversineM(last.lat, last.lng, lat, lng) >= GPS_RELOAD_MIN_DISTANCE_M;
}

export async function fetchDiscoveryRadius(
  supabase: SupabaseClient,
  lat: number,
  lng: number
): Promise<number> {
  const { data, error } = await supabase.rpc("get_discovery_radius", { lat, lng });
  if (error || data == null) return DISCOVERY_RADIUS_M;
  return data as number;
}

export function getAnchorRadiusM(anchorType: "gps" | "footprint", discoveryRadius: number): number {
  if (anchorType === "footprint") return FOOTPRINT_RADIUS_M;
  return discoveryRadius;
}

export { DISCOVERY_RADIUS_M, TOWER_BOOST_RADIUS_M, FOOTPRINT_RADIUS_M };
