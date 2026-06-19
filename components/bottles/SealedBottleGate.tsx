"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PinInput from "@/components/ui/PinInput";
import MessageThread from "@/components/bottles/MessageThread";
import type { Message } from "@/lib/types";

type Props = {
  bottleId: string;
  title: string;
  description: string | null;
  currentUserId: string;
  isCreator: boolean;
  initialUnlocked: boolean;
  initialMessages: Message[];
  footprintId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
};

export default function SealedBottleGate({
  bottleId,
  title,
  description,
  currentUserId,
  isCreator,
  initialUnlocked,
  initialMessages,
  footprintId,
  userLocation,
}: Props) {
  const [unlocked, setUnlocked] = useState(initialUnlocked || isCreator);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const getSupabase = useCallback(() => createClient(), []);

  const handleUnlock = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error: rpcError } = await supabase.rpc("unlock_sealed_bottle", {
      p_bottle_id: bottleId,
      p_pin: pin,
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setUnlocked(true);
    setPin("");
  };

  if (unlocked) {
    return (
      <MessageThread
        bottleId={bottleId}
        initialMessages={initialMessages}
        currentUserId={currentUserId}
        isExpired={false}
        footprintId={footprintId}
        userLocation={userLocation}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 conversation-panel items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm text-center space-y-5">
        <p className="text-4xl">🔒</p>
        <h2 className="font-handwriting text-2xl text-slate-800">{title}</h2>
        {description && (
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        )}
        <p className="text-sm text-slate-500">Enter the 4-digit PIN to join this conversation</p>
        <PinInput value={pin} onChange={setPin} disabled={loading} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleUnlock}
          disabled={loading || pin.length !== 4}
          className="w-full btn-primary-block py-3"
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </div>
    </div>
  );
}
