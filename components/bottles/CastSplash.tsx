"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  show: boolean;
  capCost: number;
  onDone: () => void;
};

export default function CastSplash({ show, capCost, onDone }: Props) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-950/70 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative flex flex-col items-center text-center px-8">
            <motion.div
              className="mb-4 flex justify-center"
              initial={{ y: "-45vh", opacity: 0, rotate: -12 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.85, ease: [0.33, 0, 0.2, 1] }}
            >
              <BottleImage size="lg" className="h-16 w-16" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.35 }}
            >
              <p className="text-2xl font-bold text-white">Bottle cast!</p>
              <p className="text-amber-300 font-semibold mt-2">-{capCost} caps</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
