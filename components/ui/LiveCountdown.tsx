"use client";

import { useLiveCountdown } from "@/lib/hooks/useLiveCountdown";

const frameClassName =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-normal text-amber-800";

type Props = {
  expiresAt: string;
  className?: string;
};

export default function LiveCountdown({ expiresAt, className = "" }: Props) {
  const countdown = useLiveCountdown(expiresAt);
  return <span className={`${frameClassName} ${className}`.trim()}>{countdown}</span>;
}
