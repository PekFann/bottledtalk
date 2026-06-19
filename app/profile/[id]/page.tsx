import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileActions from "@/components/profile/ProfileActions";

export const dynamic = "force-dynamic";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const isOwnProfile = user.id === id;

  let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" | "self" = isOwnProfile
    ? "self"
    : "none";
  let pendingRequestId: string | null = null;

  if (!isOwnProfile) {
    const { data: friendCheck } = await supabase.rpc("list_friends");
    if (friendCheck?.some((f: { friend_id: string }) => f.friend_id === id)) {
      friendStatus = "friends";
    } else {
      const { data: requests } = await supabase
        .from("friend_requests")
        .select("id, requester_id, recipient_id, status")
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${id}),and(requester_id.eq.${id},recipient_id.eq.${user.id})`
        )
        .eq("status", "pending")
        .maybeSingle();

      if (requests) {
        pendingRequestId = requests.id;
        friendStatus =
          requests.requester_id === user.id ? "pending_sent" : "pending_received";
      }
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
