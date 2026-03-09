import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConnectionCard } from "@/components/ConnectionCard";

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id);

  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const getStatus = (profileId: string) => {
    const conn = connections?.find(
      c => (c.sender_id === profileId && c.receiver_id === user.id) ||
           (c.sender_id === user.id && c.receiver_id === profileId)
    );
    if (!conn) return "none";
    if (conn.status === "accepted") return "connected";
    if (conn.sender_id === user.id) return "pending_sent";
    return "pending_received";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="/dashboard" className="text-indigo-500 font-semibold text-lg">
            Sunway Connect
          </a>
          <div className="flex items-center gap-4">
            <a href="/profile" className="text-gray-400 hover:text-white text-sm">Profile</a>
            <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</a>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Students</h1>
        <p className="text-gray-400 mb-8">Connect with other Sunway students</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles?.map((profile) => {
            const status = getStatus(profile.id);
            return (
              <ConnectionCard
                key={profile.id}
                profile={profile}
                initialStatus={status as any}
                userId={user.id}
              />
            );
          })}
          {(!profiles || profiles.length === 0) && (
            <p className="text-gray-500 col-span-2">No other students yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}