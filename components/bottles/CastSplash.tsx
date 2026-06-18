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
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-950/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center px-8"
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <motion.div
              className="mb-4 flex justify-center"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: 2, duration: 0.6 }}
            >
              <BottleImage size="lg" className="h-16 w-16" />
            </motion.div>
            <p className="text-2xl font-bold text-white">Bottle cast!</p>
            <p className="text-amber-300 font-semibold mt-2">-{capCost} caps</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
