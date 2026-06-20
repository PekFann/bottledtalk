export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string | null;
  bottle_caps?: number;
  bag_slot_limit?: number;
  is_admin?: boolean;
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
  is_sealed?: boolean;
};

export type NearbyBottle = {
  id: string;
  creator_id: string;
  bottle_type_id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string | null;
  is_sealed?: boolean;
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
  description?: string | null;
  is_sealed?: boolean;
  expires_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  bottle_id: string;
  author_id: string;
  body: string;
  created_at: string;
  is_remote?: boolean;
  author?: Profile;
};

export type BottleWithType = Bottle & {
  bottle_type: BottleType;
  creator: Profile;
};

export type BottleThreadResponse = {
  bottle: {
    id: string;
    creator_id: string;
    title: string;
    description: string | null;
    is_sealed: boolean;
    expires_at: string;
    created_at: string;
  };
  bottle_type: {
    id: string;
    slug: string;
    name: string;
    description: string;
    duration_hours: number;
    icon: string;
    marker_color: string;
    is_sealed: boolean;
  };
  creator: Profile;
  is_creator: boolean;
  is_unlocked: boolean;
  messages: Message[];
  already_in_bag: boolean;
  participated: boolean;
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

export type MapStackItem =
  | { kind: "bottle"; bottle: NearbyBottle }
  | { kind: "tower"; tower: SignalTower };

export type MapStack = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  items: MapStackItem[];
};

export type MapMarker =
  | { kind: "single"; item: MapStackItem }
  | { kind: "cluster"; stack: MapStack };

export type SignalTower = {
  id: string;
  owner_id: string;
  lat: number;
  lng: number;
  expires_at: string;
  created_at: string;
  owner_name: string;
};

export type MapDecoration = {
  id: string;
  creator_id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  decoration_type: string;
  expires_at: string;
  created_at: string;
  creator_name: string;
};

export type Footprint = {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lng: number;
  expires_at: string;
  created_at: string;
};

export type FriendRequest = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at?: string | null;
  requester?: Profile;
  recipient?: Profile;
};

export type Friend = {
  friend_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export type MapAnchor =
  | { type: "gps"; lat: number; lng: number }
  | { type: "footprint"; lat: number; lng: number; footprintId: string; name: string };

export const DISCOVERY_RADIUS_M = 2000;
export const TOWER_BOOST_RADIUS_M = 5000;
export const TOWER_PROXIMITY_M = 1000;
export const FOOTPRINT_RADIUS_M = 2000;
export const CLUSTER_RADIUS_M = 60;
export const STARTER_CAPS = 100;
export const DEFAULT_BAG_SLOTS = 10;

export const SIGNAL_TOWER_COST = 1000;
export const SIGNAL_TOWER_DAYS = 90;
export const TOWER_EXTEND_7D_COST = 35;
export const TOWER_EXTEND_30D_COST = 90;
export const FOOTPRINT_COST = 100;
export const FOOTPRINT_DAYS = 30;
export const DECORATION_COST = 50;
export const DECORATION_DAYS = 30;
export const SEALED_BOTTLE_COST = 75;
