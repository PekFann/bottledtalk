export const PROFILE_PIC_IDS = [
  "Profile_A001",
  "Profile_A002",
  "Profile_A003",
  "Profile_A004",
  "Profile_A005",
  "Profile_A006",
  "Profile_A007",
  "Profile_A008",
  "Profile_A009",
  "Profile_A010",
  "Profile_A011",
  "Profile_A012",
  "Profile_A013",
] as const;

export type ProfilePicId = (typeof PROFILE_PIC_IDS)[number];

export const DEFAULT_AVATAR_BG_COLOR = "#d4e8f7";

export const PROFILE_BG_COLORS = [
  { id: "sky", hex: "#d4e8f7", label: "Sky" },
  { id: "teal", hex: "#99d6e8", label: "Teal" },
  { id: "amber", hex: "#fde68a", label: "Amber" },
  { id: "violet", hex: "#ddd6fe", label: "Violet" },
  { id: "emerald", hex: "#a7f3d0", label: "Emerald" },
  { id: "rose", hex: "#fecdd3", label: "Rose" },
  { id: "slate", hex: "#e2e8f0", label: "Slate" },
  { id: "cream", hex: "#faf8f5", label: "Cream" },
] as const;

const picIdSet = new Set<string>(PROFILE_PIC_IDS);

export function isValidProfilePicId(id: string | null | undefined): id is ProfilePicId {
  return !!id && picIdSet.has(id);
}

export function getProfilePicSrc(id: string | null | undefined): string | null {
  if (!isValidProfilePicId(id)) return null;
  return `/Profile Pics/${id}.png`;
}

export function normalizeAvatarBgColor(color: string | null | undefined): string {
  if (!color) return DEFAULT_AVATAR_BG_COLOR;
  return PROFILE_BG_COLORS.some((c) => c.hex === color) ? color : DEFAULT_AVATAR_BG_COLOR;
}
