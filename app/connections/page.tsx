import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
        <div className="flex items-center gap-4 mb-8">
          <a href="/dashboard" className="text-gray-400 hover:text-white">← Dashboard</a>
          <h1 className="text-3xl font-bold">Students</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles?.map((profile) => {
            const status = getStatus(profile.id);
            return (
              <div key={profile.id} className="bg-gray-900 rounded-xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (profile.full_name?.[0] ?? "S")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile.full_name ?? "Student"}</p>
                  <p className="text-gray-400 text-sm truncate">{profile.bio ?? "No bio yet"}</p>
                </div>
                <form method="POST">
                  {status === "none" && (
                    <button formAction={`/api/connections/send?to=${profile.id}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">
                      Connect
                    </button>
                  )}
                  {status === "pending_sent" && (
                    <span className="text-yellow-400 text-sm">Pending</span>
                  )}
                  {status === "pending_received" && (
                    <button formAction={`/api/connections/accept?from=${profile.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">
                      Accept
                    </button>
                  )}
                  {status === "connected" && (
                    <a href={`/messages/${profile.id}`}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg">
                      Message
                    </a>
                  )}
                </form>
              </div>
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
