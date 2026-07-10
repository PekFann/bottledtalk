import type { BottleType, NearbyBottle } from "@/lib/types";
import type { PlacementIntent } from "@/lib/placement";

export type PlacementSuccessMeta = {
  bottleId?: string;
  intent: PlacementIntent;
  placement: { lat: number; lng: number };
};

export function buildOptimisticBottle(
  bottleId: string,
  intent: Extract<PlacementIntent, { kind: "bottle" }>,
  placement: { lat: number; lng: number },
  bottleType: BottleType,
  userId: string,
  creatorName: string
): NearbyBottle {
  const expiresAt = new Date(
    Date.now() + bottleType.duration_hours * 60 * 60 * 1000
  ).toISOString();

  return {
    id: bottleId,
    creator_id: userId,
    bottle_type_id: intent.bottleTypeId,
    lat: placement.lat,
    lng: placement.lng,
    title: intent.title,
    description: intent.description,
    is_sealed: intent.isSealed,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    type_slug: bottleType.slug,
    type_name: bottleType.name,
    type_icon: bottleType.icon,
    marker_color: bottleType.marker_color,
    creator_name: creatorName,
  };
}
