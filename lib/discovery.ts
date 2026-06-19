import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DISCOVERY_RADIUS_M,
  TOWER_BOOST_RADIUS_M,
  FOOTPRINT_RADIUS_M,
} from "@/lib/types";

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
