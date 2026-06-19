import type { BottleType } from "@/lib/types";

type CatalogEntry = Pick<
  BottleType,
  "slug" | "name" | "description" | "duration_hours" | "icon" | "marker_color" | "cap_cost" | "is_sealed"
>;

/** Canonical Shop catalog (user spec). */
const SHOP_CATALOG: CatalogEntry[] = [
  {
    slug: "basic-day",
    name: "1 Day",
    description: "A whisper carried on the tide, gone by morning",
    duration_hours: 24,
    icon: "🍾",
    marker_color: "#60a5fa",
    cap_cost: 10,
    is_sealed: false,
  },
  {
    slug: "basic-week",
    name: "1 Week",
    description: "Words that drift a week before the sea claims them",
    duration_hours: 168,
    icon: "🪵",
    marker_color: "#34d399",
    cap_cost: 50,
    is_sealed: false,
  },
  {
    slug: "basic-month",
    name: "1 Month",
    description: "A long tale anchored for a month upon the waves",
    duration_hours: 720,
    icon: "🌊",
    marker_color: "#fbbf24",
    cap_cost: 120,
    is_sealed: false,
  },
  {
    slug: "sealed",
    name: "Sealed",
    description: "Locked with a secret — only the worthy may open its depths",
    duration_hours: 168,
    icon: "🔒",
    marker_color: "#a78bfa",
    cap_cost: 75,
    is_sealed: true,
  },
];

const LEGACY_SLUG_TO_CATALOG: Record<string, string> = {
  glass: "basic-day",
  cork: "basic-week",
  driftwood: "basic-month",
  treasure: "sealed",
};

const catalogBySlug = new Map(SHOP_CATALOG.map((entry) => [entry.slug, entry]));

function resolveCatalogSlug(slug: string): string {
  return LEGACY_SLUG_TO_CATALOG[slug] ?? slug;
}

function normalizeShopBottleType(type: BottleType): BottleType {
  const catalog = catalogBySlug.get(resolveCatalogSlug(type.slug));
  if (!catalog) return type;
  return { ...type, ...catalog };
}

/** Poetic catalog line for map surfaces (preview, stack picker). */
export function getCatalogDescription(typeSlug: string): string | undefined {
  const catalog = catalogBySlug.get(resolveCatalogSlug(typeSlug));
  return catalog?.description;
}

/** Bottle types shown in the Shop tab, in catalog order with canonical labels. */
export function getShopBottleTypes(types: BottleType[]): BottleType[] {
  const allowedSlugs = new Set([
    ...SHOP_CATALOG.map((entry) => entry.slug),
    ...Object.keys(LEGACY_SLUG_TO_CATALOG),
  ]);

  return types
    .filter((type) => allowedSlugs.has(type.slug))
    .map(normalizeShopBottleType)
    .sort(
      (a, b) =>
        SHOP_CATALOG.findIndex((entry) => entry.slug === a.slug) -
        SHOP_CATALOG.findIndex((entry) => entry.slug === b.slug)
    );
}
