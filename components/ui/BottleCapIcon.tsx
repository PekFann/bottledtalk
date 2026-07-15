import { BOTTLE_CAP_ICON_SRC } from "@/lib/capAssets";

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-8 w-8",
} as const;

const PIXEL_SIZES = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 32,
} as const;

type Props = {
  size?: keyof typeof SIZES;
  className?: string;
};

export default function BottleCapIcon({ size = "sm", className = "" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BOTTLE_CAP_ICON_SRC}
      alt=""
      width={PIXEL_SIZES[size]}
      height={PIXEL_SIZES[size]}
      className={`object-contain pointer-events-none shrink-0 ${SIZES[size]} ${className}`}
      draggable={false}
    />
  );
}
