import {
  getProfilePicSrc,
  normalizeAvatarBgColor,
} from "@/lib/profileAvatars";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, { outer: string; text: string; img: string }> = {
  sm: { outer: "h-8 w-8", text: "text-sm", img: "h-[70%] w-[70%]" },
  md: { outer: "h-11 w-11", text: "text-base", img: "h-[72%] w-[72%]" },
  lg: { outer: "h-20 w-20", text: "text-2xl", img: "h-[76%] w-[76%]" },
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
          className={`object-contain ${sizes.img}`}
          draggable={false}
        />
      ) : (
        <span className={`font-semibold text-sky-700 ${sizes.text}`}>{initial}</span>
      )}
    </div>
  );
}
