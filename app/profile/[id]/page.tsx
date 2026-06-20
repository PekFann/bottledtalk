import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileActions from "@/components/profile/ProfileActions";

export const dynamic = "force-dynamic";

function friendPairFilter(userId: string, profileId: string) {
  return `and(requester_id.eq.${userId},recipient_id.eq.${profileId}),and(requester_id.eq.${profileId},recipient_id.eq.${userId})`;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const isOwnProfile = user.id === id;

  const profileQuery = supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();

  const friendshipQuery = isOwnProfile
    ? Promise.resolve({ data: null })
    : supabase
        .from("friend_requests")
        .select("id")
        .eq("status", "accepted")
        .or(friendPairFilter(user.id, id))
        .maybeSingle();

  const pendingQuery = isOwnProfile
    ? Promise.resolve({ data: null })
    : supabase
        .from("friend_requests")
        .select("id, requester_id, recipient_id")
        .eq("status", "pending")
        .or(friendPairFilter(user.id, id))
        .maybeSingle();

  const [{ data: profile }, { data: friendship }, { data: pending }] = await Promise.all([
    profileQuery,
    friendshipQuery,
    pendingQuery,
  ]);

  if (!profile) notFound();

  let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" | "self" = isOwnProfile
    ? "self"
    : "none";
  let pendingRequestId: string | null = null;

  if (!isOwnProfile) {
    if (friendship) {
      friendStatus = "friends";
    } else if (pending) {
      pendingRequestId = pending.id;
      friendStatus =
        pending.requester_id === user.id ? "pending_sent" : "pending_received";
    }
  }

  return (
    <div className="min-h-dvh game-map-bg px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-md">
        <ProfileActions
          profileId={profile.id}
          displayName={profile.display_name}
          bio={profile.bio}
          isOwnProfile={isOwnProfile}
          initialFriendStatus={friendStatus}
          pendingRequestId={pendingRequestId}
        />
      </div>
    </div>
  );
}
