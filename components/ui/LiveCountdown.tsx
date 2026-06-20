"use client";

import { useLiveCountdown } from "@/lib/hooks/useLiveCountdown";

type Props = {
  expiresAt: string;
  className?: string;
};

export default function LiveCountdown({ expiresAt, className = "" }: Props) {
  const countdown = useLiveCountdown(expiresAt);
  return <span className={`tabular-nums ${className}`.trim()}>{countdown}</span>;
}
