"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottleImage from "@/components/bottles/BottleImage";

type Props = {
  show: boolean;
  capCost: number;
  onDone: () => void;
};

const STARDUST_COLORS = ["#fde68a", "#fef9c3", "#ffffff", "#bae6fd", "#fcd34d"];
const PARTICLE_COUNT = 28;

function StardustBurst({ show }: { show: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const distance = 64 + Math.random() * 80;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 16,
          size: 6 + Math.random() * 8,
          color: STARDUST_COLORS[i % STARDUST_COLORS.length],
          delay: Math.random() * 0.08,
        };
      }),
    []
  );

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2" aria-hidden>
      <motion.div
        className="absolute left-1/2 bottom-2 h-12 w-40 -translate-x-1/2 rounded-full bg-amber-200/40 blur-md"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.4, 1.8] }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 bottom-3 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0.2],
          }}
          transition={{
            duration: 0.75,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function CastSplash({ show, capCost, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!show) {
      setBurst(false);
      return;
    }
    const burstTimer = window.setTimeout(() => setBurst(true), 600);
    const dismissTimer = window.setTimeout(() => onDoneRef.current(), 3200);
    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [show]);

  const dismiss = () => onDoneRef.current();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <div className="relative flex flex-col items-center text-center px-8">
            <div className="relative mb-4 flex min-h-[50vh] w-full items-end justify-center">
              <motion.div
                initial={{ y: "-45vh", opacity: 0, rotate: -18 }}
                animate={{
                  y: [null, 0, -38, 0, -16, 0],
                  opacity: 1,
                  rotate: [-18, 10, -6, 4, -2, 0],
                }}
                transition={{
                  y: {
                    duration: 1.1,
                    times: [0, 0.55, 0.68, 0.8, 0.9, 1],
                    ease: [0.34, 1.25, 0.64, 1],
                  },
                  rotate: {
                    duration: 1.1,
                    times: [0, 0.55, 0.68, 0.8, 0.9, 1],
                    ease: "easeOut",
                  },
                  opacity: { duration: 0.25 },
                }}
              >
                <BottleImage
                  size="lg"
                  className="h-[min(491px,46.08vw)] w-[min(491px,46.08vw)] max-h-[48vh] drop-shadow-2xl"
                />
              </motion.div>
              <StardustBurst show={burst} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.35 }}
            >
              <p className="text-2xl font-bold text-white">Bottle cast!</p>
              <p className="text-amber-300 font-normal mt-2">-{capCost} caps</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
