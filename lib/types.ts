export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
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

export const DISCOVERY_RADIUS_M = 2000;
