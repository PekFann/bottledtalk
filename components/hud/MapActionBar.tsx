"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Backpack, Send } from "lucide-react";

type Props = {
  bagUsed: number;
  bagLimit: number;
  onCast: () => void;
  onOpenBag: () => void;
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
            ? "bg-teal-400 text-white shadow-lg shadow-teal-300/40 hover:bg-teal-500"
            : "bg-white/45 text-teal-600 border border-white/40 backdrop-blur-md hover:bg-white/60"
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
  onCast,
  onOpenBag,
}: Props) {
  return (
    <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-4 pb-[max(0px,env(safe-area-inset-bottom))]">
      <ActionButton label="Cast bottle" onClick={onCast} variant="primary">
        <Send className="h-5 w-5" strokeWidth={2.25} />
      </ActionButton>
      <ActionButton
        label={`Bag ${bagUsed}/${bagLimit}`}
        onClick={onOpenBag}
        variant="secondary"
      >
        <Backpack className="h-5 w-5" strokeWidth={2.25} />
      </ActionButton>
    </div>
  );
}
