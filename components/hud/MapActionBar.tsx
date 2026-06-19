"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Footprints, Store, Users } from "lucide-react";
import PouchIcon from "@/components/icons/PouchIcon";

type Props = {
  bagUsed: number;
  bagLimit: number;
  onOpenFriends: () => void;
  onOpenShop: () => void;
  onOpenBag: () => void;
  onOpenFootprints: () => void;
};

function ActionButton({
  label,
  onClick,
  variant,
  iconClassName,
  children,
}: {
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary";
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        className={`action-circle ${
          variant === "primary"
            ? "bg-sky-500 text-white shadow-lg shadow-sky-300/40 hover:bg-sky-600"
            : "bg-white/95 text-slate-800 ring-1 ring-slate-200/80 shadow-md hover:bg-white"
        }`}
        aria-label={label}
      >
        <span className={iconClassName}>{children}</span>
      </motion.button>
      <span className="action-label">{label}</span>
    </div>
  );
}

export default function MapActionBar({
  bagUsed,
  bagLimit,
  onOpenFriends,
  onOpenShop,
  onOpenBag,
  onOpenFootprints,
}: Props) {
  return (
    <div className="absolute bottom-12 right-4 z-20 flex flex-col items-center gap-3 pb-[max(0px,env(safe-area-inset-bottom))]">
      <ActionButton
        label="Friends"
        onClick={onOpenFriends}
        variant="secondary"
        iconClassName="text-slate-600"
      >
        <Users className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label="Shop" onClick={onOpenShop} variant="primary">
        <Store className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton
        label={`Pouch ${bagUsed}/${bagLimit}`}
        onClick={onOpenBag}
        variant="secondary"
        iconClassName="text-amber-700"
      >
        <PouchIcon className="h-[22px] w-[22px]" />
      </ActionButton>
      <ActionButton
        label="Footprint"
        onClick={onOpenFootprints}
        variant="secondary"
        iconClassName="text-emerald-600"
      >
        <Footprints className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
    </div>
  );
}
