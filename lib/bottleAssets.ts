export const DEFAULT_BOTTLE_MARKER_SRC = "/Items/Bottles_A01.png";

/** Stable 0–3s delay so map bottles float out of sync. */
export function bottleFloatDelaySec(bottleId: string): number {
  let h = 0;
  for (let i = 0; i < bottleId.length; i++) h = (h * 31 + bottleId.charCodeAt(i)) >>> 0;
  return (h % 3000) / 1000;
}
