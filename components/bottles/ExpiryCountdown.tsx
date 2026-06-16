"use client";

import { useEffect, useState } from "react";
import { formatCountdown, isExpired } from "@/lib/geo";

type Props = {
  expiresAt: string;
};

export default function ExpiryCountdown({ expiresAt }: Props) {
  const [countdown, setCountdown] = useState(formatCountdown(expiresAt));
  const expired = isExpired(expiresAt);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(expiresAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (expired) {
    return (
      <p className="text-sm text-slate-500 bg-slate-100 rounded-lg px-3 py-2">
        🌊 This bottle has washed away
      </p>
    );
  }

  return (
    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
      ⏳ Washes away in {countdown}
    </p>
  );
}
