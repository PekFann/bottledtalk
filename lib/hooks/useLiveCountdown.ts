"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/geo";

export function useLiveCountdown(expiresAt: string): string {
  const [label, setLabel] = useState(() => formatCountdown(expiresAt));

  useEffect(() => {
    setLabel(formatCountdown(expiresAt));
    const id = window.setInterval(() => {
      setLabel(formatCountdown(expiresAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return label;
}
