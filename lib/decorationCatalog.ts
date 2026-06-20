export type DecorationType = {
  id: string;
  name: string;
  icon: string;
  marker_color: string;
  category: "Animals" | "Nature" | "Objects" | "Vehicles";
};

export const DECORATION_CATALOG: DecorationType[] = [
  { id: "cat", name: "Cat", icon: "🐱", marker_color: "#f59e0b", category: "Animals" },
  { id: "dog", name: "Dog", icon: "🐶", marker_color: "#d97706", category: "Animals" },
  { id: "bird", name: "Bird", icon: "🐦", marker_color: "#38bdf8", category: "Animals" },
  { id: "fish", name: "Fish", icon: "🐟", marker_color: "#0ea5e9", category: "Animals" },
  { id: "flower", name: "Flower", icon: "🌸", marker_color: "#f472b6", category: "Nature" },
  { id: "tree", name: "Tree", icon: "🌳", marker_color: "#22c55e", category: "Nature" },
  { id: "mushroom", name: "Mushroom", icon: "🍄", marker_color: "#ef4444", category: "Nature" },
  { id: "butterfly", name: "Butterfly", icon: "🦋", marker_color: "#a78bfa", category: "Nature" },
  { id: "bench", name: "Bench", icon: "🪑", marker_color: "#78716c", category: "Objects" },
  { id: "lamp", name: "Lamp", icon: "💡", marker_color: "#fbbf24", category: "Objects" },
  { id: "gift", name: "Gift", icon: "🎁", marker_color: "#ec4899", category: "Objects" },
  { id: "flag", name: "Flag", icon: "🚩", marker_color: "#ef4444", category: "Objects" },
  { id: "car", name: "Car", icon: "🚗", marker_color: "#64748b", category: "Vehicles" },
  { id: "bicycle", name: "Bicycle", icon: "🚲", marker_color: "#14b8a6", category: "Vehicles" },
  { id: "boat", name: "Boat", icon: "⛵", marker_color: "#3b82f6", category: "Vehicles" },
  { id: "train", name: "Train", icon: "🚂", marker_color: "#6366f1", category: "Vehicles" },
];

const catalogById = new Map(DECORATION_CATALOG.map((entry) => [entry.id, entry]));

export function getDecorationType(id: string): DecorationType | undefined {
  return catalogById.get(id);
}

export const DECORATION_CATEGORIES = [
  "Animals",
  "Nature",
  "Objects",
  "Vehicles",
] as const;

export function getDecorationsByCategory(
  category: DecorationType["category"]
): DecorationType[] {
  return DECORATION_CATALOG.filter((entry) => entry.category === category);
}
