import { DEFAULT_BOTTLE_MARKER_SRC } from "@/lib/bottleAssets";

const SIZES = {
  sm: "h-7 w-7",
  md: "h-11 w-11",
  lg: "h-[52px] w-[52px]",
  xl: "h-14 w-14",
} as const;

const PIXEL_SIZES = {
  sm: 28,
  md: 44,
  lg: 52,
  xl: 56,
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
      width={PIXEL_SIZES[size]}
      height={PIXEL_SIZES[size]}
      className={`object-contain pointer-events-none drop-shadow-sm ${SIZES[size]} ${className}`}
      draggable={false}
    />
  );
}
