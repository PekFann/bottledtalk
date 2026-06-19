"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Friend, FriendRequest, Profile } from "@/lib/types";

type Tab = "friends" | "incoming" | "sent";

type Props = {
  currentUserId: string;
  onClose: () => void;
};

export default function FriendsModal({ currentUserId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const getSupabase = useCallback(() => createClient(), []);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const [friendsRes, requestsRes] = await Promise.all([
      supabase.rpc("list_friends"),
      supabase
        .from("friend_requests")
        .select("id, requester_id, recipient_id, status, created_at, requester:profiles!friend_requests_requester_id_fkey(id, display_name), recipient:profiles!friend_requests_recipient_id_fkey(id, display_name)")
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .eq("status", "pending"),
    ]);

    if (friendsRes.data) setFriends(friendsRes.data as Friend[]);
    if (requestsRes.data) {
      const reqs = requestsRes.data as unknown as FriendRequest[];
      setIncoming(reqs.filter((r) => r.recipient_id === currentUserId));
      setSent(reqs.filter((r) => r.requester_id === currentUserId));
    }
    setLoading(false);
  }, [getSupabase, currentUserId]);

  useEffect(() => { load(); }, [load]);

  const respond = async (requestId: string, accept: boolean) => {
    const supabase = getSupabase();
    await supabase.rpc("respond_friend_request", { p_request_id: requestId, p_accept: accept });
    load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "friends", label: `Friends (${friends.length})` },
    { id: "incoming", label: `Incoming (${incoming.length})` },
    { id: "sent", label: `Sent (${sent.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <motion.div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl max-h-[70dvh] overflow-hidden flex flex-col"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Friends</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-medium ${tab === t.id ? "text-sky-600 border-b-2 border-sky-500" : "text-slate-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
          ) : tab === "friends" ? (
            friends.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No friends yet — visit profiles to connect</p>
            ) : (
              friends.map((f) => (
                <Link
                  key={f.friend_id}
                  href={`/profile/${f.friend_id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
                    {f.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900">{f.display_name}</p>
                    {f.bio && <p className="text-xs text-slate-500 truncate">{f.bio}</p>}
                  </div>
                </Link>
              ))
            )
          ) : tab === "incoming" ? (
            incoming.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No pending requests</p>
            ) : (
              incoming.map((r) => {
                const requester = Array.isArray(r.requester) ? r.requester[0] : r.requester;
                return (
                  <div key={r.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-sm text-slate-900">
                      {(requester as Profile)?.display_name ?? "Sailor"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => respond(r.id, true)} className="flex-1 btn-primary text-xs py-1.5">Accept</button>
                      <button type="button" onClick={() => respond(r.id, false)} className="flex-1 rounded-lg border border-slate-200 text-xs py-1.5">Decline</button>
                    </div>
                  </div>
                );
              })
            )
          ) : sent.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No sent requests</p>
          ) : (
            sent.map((r) => {
              const recipient = Array.isArray(r.recipient) ? r.recipient[0] : r.recipient;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <UserPlus className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-700">
                    Pending — {(recipient as Profile)?.display_name ?? "Sailor"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
