export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bottle_caps?: number;
  bag_slot_limit?: number;
  created_at: string;
};

export type BottleType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_hours: number;
  icon: string;
  marker_color: string;
  cap_cost: number;
};

export type NearbyBottle = {
  id: string;
  creator_id: string;
  bottle_type_id: string;
  lat: number;
  lng: number;
  title: string;
  expires_at: string;
  created_at: string;
  type_slug: string;
  type_name: string;
  type_icon: string;
  marker_color: string;
  creator_name: string;
};

export type Bottle = {
  id: string;
  creator_id: string;
  bottle_type_id: string;
  title: string;
  expires_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  bottle_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
};

export type BottleWithType = Bottle & {
  bottle_type: BottleType;
  creator: Profile;
};

export type BagMessageSnapshot = {
  author_name: string;
  body: string;
  created_at: string;
};

export type BagItem = {
  id: string;
  user_id: string;
  source_bottle_id: string | null;
  title: string;
  type_slug: string;
  type_name: string;
  type_icon: string;
  marker_color: string;
  messages_snapshot: BagMessageSnapshot[];
  collected_at: string;
  collection_reason: "manual" | "expired";
};

export type WashedAshoreBottle = {
  id: string;
  title: string;
  expires_at: string;
  type_slug: string;
  type_name: string;
  type_icon: string;
  marker_color: string;
};

export type BottleCluster = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  bottles: NearbyBottle[];
};

export type MapMarker =
  | { kind: "single"; bottle: NearbyBottle }
  | { kind: "cluster"; cluster: BottleCluster };

export const DISCOVERY_RADIUS_M = 2000;
export const CLUSTER_RADIUS_M = 30;
export const STARTER_CAPS = 100;
export const DEFAULT_BAG_SLOTS = 10;
