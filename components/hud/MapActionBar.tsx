"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Backpack, Footprints, Store, Users } from "lucide-react";

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
  children,
}: {
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary";
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
            : "bg-white/45 text-sky-600 border border-white/40 backdrop-blur-md hover:bg-white/60"
        }`}
        aria-label={label}
      >
        {children}
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
      <ActionButton label="Friends" onClick={onOpenFriends} variant="secondary">
        <Users className="h-5 w-5" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label="Shop" onClick={onOpenShop} variant="primary">
        <Store className="h-5 w-5" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label={`Bag ${bagUsed}/${bagLimit}`} onClick={onOpenBag} variant="secondary">
        <Backpack className="h-5 w-5" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label="Footprint" onClick={onOpenFootprints} variant="secondary">
        <Footprints className="h-5 w-5" strokeWidth={2.25} />
      </ActionButton>
    </div>
  );
}
