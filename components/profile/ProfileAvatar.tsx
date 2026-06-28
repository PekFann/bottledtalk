import {
  getProfilePicSrc,
  normalizeAvatarBgColor,
} from "@/lib/profileAvatars";

type Size = "sm" | "hud" | "md" | "lg";

const sizeClasses: Record<Size, { outer: string; text: string }> = {
  sm: { outer: "h-8 w-8", text: "text-sm" },
  hud: { outer: "h-12 w-12", text: "text-base" },
  md: { outer: "h-11 w-11", text: "text-base" },
  lg: { outer: "h-20 w-20", text: "text-2xl" },
};

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  avatarBgColor?: string | null;
  size?: Size;
  className?: string;
};

export default function ProfileAvatar({
  displayName,
  avatarUrl,
  avatarBgColor,
  size = "md",
  className = "",
}: Props) {
  const src = getProfilePicSrc(avatarUrl);
  const bg = normalizeAvatarBgColor(avatarBgColor);
  const initial = displayName.charAt(0).toUpperCase() || "?";
  const sizes = sizeClasses[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-md ${sizes.outer} ${className}`}
      style={{ backgroundColor: bg }}
      aria-hidden={!!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className={`font-semibold text-sky-700 ${sizes.text}`}>{initial}</span>
      )}
    </div>
  );
}
