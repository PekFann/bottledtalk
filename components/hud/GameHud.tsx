"use client";

import { motion } from "framer-motion";

type Props = {
  bottleCaps: number;
  bagUsed: number;
  bagLimit: number;
  capPulse?: boolean;
  onOpenBag: () => void;
};

export default function GameHud({
  bottleCaps,
  bagUsed,
  bagLimit,
  capPulse,
  onOpenBag,
}: Props) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-3 py-2">
      <div className="game-panel flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">🍾</span>
          <span className="font-bold text-sky-100 truncate text-sm">BottledTalk</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1"
            animate={capPulse ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm" aria-hidden>
              🪙
            </span>
            <span className="font-bold text-amber-300 text-sm tabular-nums">
              {bottleCaps}
            </span>
          </motion.div>

          <button
            type="button"
            onClick={onOpenBag}
            className="flex items-center gap-1.5 rounded-full bg-sky-500/30 border border-sky-400/40 px-3 py-1 hover:bg-sky-500/50 transition-colors"
          >
            <span className="text-sm">🎒</span>
            <span className="font-semibold text-sky-100 text-sm tabular-nums">
              {bagUsed}/{bagLimit}
            </span>
          </button>

          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-sky-200/80 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
            >
              Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
