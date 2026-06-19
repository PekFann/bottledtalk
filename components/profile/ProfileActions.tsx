"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Props = {
  profileId: string;
  displayName: string;
  bio: string | null;
  isOwnProfile: boolean;
  initialFriendStatus: "none" | "pending_sent" | "pending_received" | "friends" | "self";
  pendingRequestId?: string | null;
};

export default function ProfileActions({
  profileId,
  displayName,
  bio: initialBio,
  isOwnProfile,
  initialFriendStatus,
  pendingRequestId,
}: Props) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [editing, setEditing] = useState(false);
  const [friendStatus, setFriendStatus] = useState(initialFriendStatus);
  const [requestId, setRequestId] = useState(pendingRequestId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getSupabase = useCallback(() => createClient(), []);

  const saveBio = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bio: bio.trim() || null })
      .eq("id", profileId);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(false);
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { data, error: rpcError } = await supabase.rpc("send_friend_request", {
      p_recipient_id: profileId,
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setFriendStatus("pending_sent");
    if (data) setRequestId(data as string);
  };

  const respond = async (accept: boolean) => {
    if (!requestId) return;
    setLoading(true);
    const supabase = getSupabase();
    await supabase.rpc("respond_friend_request", { p_request_id: requestId, p_accept: accept });
    setLoading(false);
    setFriendStatus(accept ? "friends" : "none");
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-semibold text-sky-600">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h1 className="font-handwriting text-2xl text-slate-800">{displayName}</h1>
      </div>

      <div className="rounded-xl game-panel-pastel p-4">
        <h2 className="text-sm font-medium text-slate-600 mb-2">Bio</h2>
        {isOwnProfile && editing ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none"
              placeholder="Tell others about yourself…"
            />
            <div className="flex gap-2">
              <button type="button" onClick={saveBio} disabled={loading} className="btn-primary px-4 py-1.5 text-sm">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {bio || (isOwnProfile ? "No bio yet." : "No bio.")}
          </p>
        )}
        {isOwnProfile && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="mt-2 text-sm text-sky-600 font-medium">
            Edit bio
          </button>
        )}
      </div>

      {!isOwnProfile && (
        <div className="flex justify-center">
          {friendStatus === "friends" ? (
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-medium">Friends</span>
          ) : friendStatus === "pending_sent" ? (
            <span className="rounded-full bg-slate-100 text-slate-600 px-4 py-2 text-sm font-medium">Request sent</span>
          ) : friendStatus === "pending_received" ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => respond(true)} disabled={loading} className="btn-primary px-4 py-2 text-sm">Accept friend</button>
              <button type="button" onClick={() => respond(false)} disabled={loading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Decline</button>
            </div>
          ) : (
            <button type="button" onClick={sendRequest} disabled={loading} className="btn-primary px-5 py-2.5 text-sm">
              Add friend
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="text-center">
        <Link href="/map" className="text-sm text-sky-600 font-medium">Back to map</Link>
      </div>
    </div>
  );
}
