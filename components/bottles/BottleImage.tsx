import { DEFAULT_BOTTLE_MARKER_SRC } from "@/lib/bottleAssets";

const SIZES = {
  sm: "h-7 w-7",
  md: "h-11 w-11",
  lg: "h-[52px] w-[52px]",
} as const;

type Props = {
  size?: keyof typeof SIZES;
  className?: string;
  alt?: string;
};

export default function BottleImage({
  size = "md",
  className = "",
  alt = "",
}: Props) {
  return (
    <img
      src={DEFAULT_BOTTLE_MARKER_SRC}
      alt={alt}
      width={size === "lg" ? 52 : size === "md" ? 44 : 28}
      height={size === "lg" ? 52 : size === "md" ? 44 : 28}
      className={`object-contain pointer-events-none drop-shadow-sm ${SIZES[size]} ${className}`}
      draggable={false}
    />
  );
}
