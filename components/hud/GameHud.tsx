"use client";

import { motion } from "framer-motion";
import { Coins, MessageCircle } from "lucide-react";
import UserMenu from "@/components/hud/UserMenu";
import { getJournalTitle } from "@/lib/display";

type Props = {
  bottleCaps: number;
  capPulse?: boolean;
  displayName: string | null;
  email: string | null;
};

export default function GameHud({
  bottleCaps,
  capPulse,
  displayName,
  email,
}: Props) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="game-panel-pastel flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-4 w-4 shrink-0 text-teal-500" strokeWidth={2.25} />
          <span className="font-handwriting font-medium text-slate-700 truncate text-base tracking-tight">
            {getJournalTitle(displayName)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-sky-100/80 px-2.5 py-1"
            animate={capPulse ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.35 }}
          >
            <Coins className="h-3.5 w-3.5 text-amber-600" strokeWidth={2.25} />
            <span className="font-semibold text-slate-700 text-sm tabular-nums">
              {bottleCaps}
            </span>
          </motion.div>

          <UserMenu displayName={displayName} email={email} />
        </div>
      </div>
    </header>
  );
}
