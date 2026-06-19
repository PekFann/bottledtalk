"use client";

import { useEffect, useState } from "react";
import SealedBottleGate from "@/components/bottles/SealedBottleGate";
import MessageThread from "@/components/bottles/MessageThread";
import type { Message } from "@/lib/types";

type Props = {
  bottleId: string;
  title: string;
  description: string | null;
  isSealed: boolean;
  isCreator: boolean;
  isUnlocked: boolean;
  initialMessages: Message[];
  currentUserId: string;
  footprintId: string | null;
};

export default function BottleConversation({
  bottleId,
  title,
  description,
  isSealed,
  isCreator,
  isUnlocked,
  initialMessages,
  currentUserId,
  footprintId,
}: Props) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  if (isSealed && !isUnlocked) {
    return (
      <SealedBottleGate
        bottleId={bottleId}
        title={title}
        description={description}
        currentUserId={currentUserId}
        isCreator={isCreator}
        initialUnlocked={false}
        initialMessages={initialMessages}
        footprintId={footprintId}
        userLocation={userLocation}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 conversation-panel">
      <MessageThread
        bottleId={bottleId}
        initialMessages={initialMessages}
        currentUserId={currentUserId}
        isExpired={false}
        footprintId={footprintId}
        userLocation={userLocation}
      />
    </div>
  );
}
