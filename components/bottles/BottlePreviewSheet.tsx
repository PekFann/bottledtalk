"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import type { NearbyBottle } from "@/lib/types";
import BottleImage from "@/components/bottles/BottleImage";
import LiveCountdown from "@/components/ui/LiveCountdown";
import MapModal from "@/components/ui/MapModal";

type Props = {
  bottle: NearbyBottle;
  onClose: () => void;
  footprintId?: string;
};

export default function BottlePreviewSheet({ bottle, onClose, footprintId }: Props) {
  const router = useRouter();
  const href = footprintId
    ? `/bottle/${bottle.id}?footprint=${footprintId}`
    : `/bottle/${bottle.id}`;

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  return (
    <MapModal
      onClose={onClose}
      headerLeading={<BottleImage size="md" className="shrink-0" />}
      title={bottle.title}
      subtitle={
        <p className="text-sm text-slate-600 mt-0.5">
          {bottle.type_name} · {bottle.creator_name}
        </p>
      }
      maxWidth="md"
    >
      <p className="text-sm text-slate-700 glass-card rounded-lg px-3 py-2 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span>
          Washes ashore in <LiveCountdown expiresAt={bottle.expires_at} />
        </span>
      </p>

      <Link
        href={href}
        prefetch
        className="mt-4 block btn-primary-block font-medium"
        onClick={onClose}
        onMouseEnter={() => router.prefetch(href)}
        onTouchStart={() => router.prefetch(href)}
      >
        Open bottle
      </Link>
    </MapModal>
  );
}
