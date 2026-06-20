"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Footprints, Store, Users, ShoppingBag } from "lucide-react";

type Props = {
  onOpenFriends: () => void;
  onOpenShop: () => void;
  onOpenBag: () => void;
  onOpenFootprints: () => void;
};

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        className="action-circle bg-white text-sky-600 shadow-xl ring-1 ring-black/10 hover:bg-white/95"
        aria-label={label}
      >
        {children}
      </motion.button>
      <span className="action-label">{label}</span>
    </div>
  );
}

export default function MapActionBar({
  onOpenFriends,
  onOpenShop,
  onOpenBag,
  onOpenFootprints,
}: Props) {
  return (
    <div className="absolute bottom-12 right-4 z-20 flex flex-col items-center gap-3 pb-[max(0px,env(safe-area-inset-bottom))]">
      <ActionButton label="Friends" onClick={onOpenFriends}>
        <Users className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label="Shop" onClick={onOpenShop}>
        <Store className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label="Bag" onClick={onOpenBag}>
        <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton label="Footprint" onClick={onOpenFootprints}>
        <Footprints className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </ActionButton>
    </div>
  );
}
