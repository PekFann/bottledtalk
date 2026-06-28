"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import {
  isValidProfilePicId,
  normalizeAvatarBgColor,
  PROFILE_BG_COLORS,
  PROFILE_PIC_IDS,
} from "@/lib/profileAvatars";

type Props = {
  profileId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarBgColor: string | null;
  isOwnProfile: boolean;
  initialFriendStatus: "none" | "pending_sent" | "pending_received" | "friends" | "self";
  pendingRequestId?: string | null;
};

export default function ProfileActions({
  profileId,
  displayName,
  bio: initialBio,
  avatarUrl: initialAvatarUrl,
  avatarBgColor: initialAvatarBgColor,
  isOwnProfile,
  initialFriendStatus,
  pendingRequestId,
}: Props) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarBgColor, setAvatarBgColor] = useState(
    normalizeAvatarBgColor(initialAvatarBgColor)
  );
  const [editingAvatar, setEditingAvatar] = useState(false);
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

  const saveAvatar = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        avatar_bg_color: avatarBgColor,
      })
      .eq("id", profileId);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditingAvatar(false);
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
      <div className="flex items-center justify-center gap-3">
        <ProfileAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          avatarBgColor={avatarBgColor}
          size="lg"
        />
        <h1 className="font-handwriting text-2xl text-slate-800">{displayName}</h1>
      </div>

      {isOwnProfile && (
        <div className="rounded-xl game-panel-pastel p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-slate-600">Profile picture</h2>
            {!editingAvatar && (
              <button
                type="button"
                onClick={() => setEditingAvatar(true)}
                className="text-sm text-sky-600 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingAvatar ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {PROFILE_PIC_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAvatarUrl(id)}
                    className={`rounded-lg p-1 transition-all ${
                      avatarUrl === id
                        ? "ring-2 ring-sky-500 ring-offset-2"
                        : "hover:bg-white/60"
                    }`}
                    aria-label={`Select ${id}`}
                    aria-pressed={avatarUrl === id}
                  >
                    <ProfileAvatar
                      displayName={displayName}
                      avatarUrl={id}
                      avatarBgColor={avatarBgColor}
                      size="md"
                      className="mx-auto"
                    />
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Background colour</p>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_BG_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAvatarBgColor(color.hex)}
                      className={`h-9 w-9 rounded-full border-2 transition-all ${
                        avatarBgColor === color.hex
                          ? "border-sky-600 scale-110"
                          : "border-white shadow-sm hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.label}
                      aria-pressed={avatarBgColor === color.hex}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveAvatar}
                  disabled={loading}
                  className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl(initialAvatarUrl);
                    setAvatarBgColor(normalizeAvatarBgColor(initialAvatarBgColor));
                    setEditingAvatar(false);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              {avatarUrl && isValidProfilePicId(avatarUrl)
                ? "Tap Edit to change your picture or background."
                : "Tap Edit to choose a profile picture."}
            </p>
          )}
        </div>
      )}

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
