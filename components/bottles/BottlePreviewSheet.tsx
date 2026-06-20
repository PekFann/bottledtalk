"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import type { NearbyBottle } from "@/lib/types";
import { getCatalogDescription } from "@/lib/bottleCatalog";
import { useLiveCountdown } from "@/lib/hooks/useLiveCountdown";
import BottleImage from "@/components/bottles/BottleImage";
import MapModal from "@/components/ui/MapModal";

type Props = {
  bottle: NearbyBottle;
  onClose: () => void;
  footprintId?: string;
};

export default function BottlePreviewSheet({ bottle, onClose, footprintId }: Props) {
  const router = useRouter();
  const countdown = useLiveCountdown(bottle.expires_at);
  const catalogLine = getCatalogDescription(bottle.type_slug);
  const href = footprintId
    ? `/bottle/${bottle.id}?footprint=${footprintId}`
    : `/bottle/${bottle.id}`;

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  return (
    <MapModal
      onClose={onClose}
      title={bottle.title}
      subtitle={
        <p className="text-sm text-slate-600 mt-0.5">
          {bottle.type_name} · {bottle.creator_name}
        </p>
      }
      maxWidth="md"
    >
      <div className="glass-card rounded-lg p-3 flex items-center gap-3">
        <BottleImage size="md" />
        {catalogLine && (
          <p className="text-sm italic text-slate-600 leading-relaxed">{catalogLine}</p>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-700 glass-card rounded-lg px-3 py-2 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        Washes ashore in {countdown}
      </p>

      <Link
        href={href}
        prefetch
        className="mt-4 block btn-primary-block font-medium"
        onMouseEnter={() => router.prefetch(href)}
        onTouchStart={() => router.prefetch(href)}
      >
        Open conversation
      </Link>
    </MapModal>
  );
}
