"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConnectionCardProps {
  profile: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  };
  initialStatus: "none" | "pending_sent" | "pending_received" | "connected";
  userId: string;
}

export function ConnectionCard({ profile, initialStatus, userId }: ConnectionCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const displayName = profile.full_name ?? "Student";

  const handleSendRequest = async () => {
    const prevStatus = status;
    setStatus("pending_sent");
    try {
      const res = await fetch(`/api/connections/send?to=${profile.id}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus(prevStatus);
      }
    } catch (err) {
      console.error("send connection failed", err);
      setStatus(prevStatus);
    }
  };

  const handleAcceptRequest = async () => {
    const prevStatus = status;
    setIsUpdating(true);
    setStatus("connected");
    try {
      const res = await fetch(`/api/connections/accept?from=${profile.id}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error("accept failed", res.status, json);
        setStatus(prevStatus);
        return;
      }
      // navigate to chat after successful acceptance
      router.push(`/messages/${profile.id}`);
    } catch (err) {
      console.error("accept connection failed", err);
      setStatus(prevStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0">
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          : (displayName[0] ?? "S")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{displayName}</p>
        <p className="text-gray-400 text-sm truncate">{profile.bio ?? "No bio yet"}</p>
      </div>
      <div>
        {status === "none" && (
          <button
            onClick={handleSendRequest}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            Connect
          </button>
        )}
        {status === "pending_sent" && (
          <span className="text-yellow-400 text-sm">Pending</span>
        )}
        {status === "pending_received" && (
          <button
            onClick={handleAcceptRequest}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
          >
            {isUpdating ? "Accepting..." : "Accept"}
          </button>
        )}
        {status === "connected" && (
          <a
            href={`/messages/${profile.id}`}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
          >
            Message
          </a>
        )}
      </div>
    </div>
  );
}