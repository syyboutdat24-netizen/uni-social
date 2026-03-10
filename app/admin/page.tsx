import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const ALLOWED_BADGE_ROLES = ['Founder', 'Admin', 'Moderator'];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("badge_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!currentProfile?.badge_role || !ALLOWED_BADGE_ROLES.includes(currentProfile.badge_role)) {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, badge_role")
    .order("full_name");

  const { data: rawPosts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: postProfiles } = await supabase
    .from("profiles")
    .select("id, full_name");

  const posts = (rawPosts ?? []).map(post => ({
    ...post,
    profiles: postProfiles?.find(p => p.id === post.user_id) ?? null
  }));

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, badge_role");

  return (
    <div className="min-h-screen app-bg app-text">
      <div className="app-surface border-b app-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-indigo-500 font-bold text-lg">Sunway Connect</a>
          <span className="app-text-muted">|</span>
          <span className="text-yellow-500 font-semibold">Admin Panel</span>
        </div>
        <a href="/dashboard" className="app-text-muted hover:opacity-80 text-sm">← Back to Dashboard</a>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        <div className="grid grid-cols-3 gap-4">
          <div className="app-surface rounded-xl p-5 border app-border">
            <p className="app-text-muted text-sm">Total Users</p>
            <p className="text-3xl font-bold mt-1 app-text">{profiles?.length ?? 0}</p>
          </div>
          <div className="app-surface rounded-xl p-5 border app-border">
            <p className="app-text-muted text-sm">Total Posts</p>
            <p className="text-3xl font-bold mt-1 app-text">{posts?.length ?? 0}</p>
          </div>
          <div className="app-surface rounded-xl p-5 border app-border">
            <p className="app-text-muted text-sm">Staff Members</p>
            <p className="text-3xl font-bold mt-1 app-text">{allUsers?.filter(u => u.badge_role).length ?? 0}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 app-text">Manage User Roles</h2>
          <div className="app-surface rounded-xl border app-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b app-border">
                  <th className="text-left px-4 py-3 app-text-muted text-sm font-medium">User</th>
                  <th className="text-left px-4 py-3 app-text-muted text-sm font-medium">Program</th>
                  <th className="text-left px-4 py-3 app-text-muted text-sm font-medium">Badge Role</th>
                  <th className="text-left px-4 py-3 app-text-muted text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles?.map((p) => (
                  <tr key={p.id} className="border-b app-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.full_name?.[0] ?? "S")}
                        </div>
                        <p className="font-medium text-sm app-text">{p.full_name ?? "Student"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 app-text-muted text-sm">{p.role ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.badge_role
                        ? <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">{p.badge_role}</span>
                        : <span className="app-text-muted text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <form method="POST" action={`/api/admin/set-role?userId=${p.id}`} className="flex items-center gap-2">
                        <select name="badge_role" defaultValue={p.badge_role ?? ""}
                          className="app-input-bg border app-border app-text text-sm rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">No badge</option>
                          <option value="Founder">Founder</option>
                          <option value="Admin">Admin</option>
                          <option value="Moderator">Moderator</option>
                          <option value="Club Leader">Club Leader</option>
                        </select>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1 rounded-lg">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 app-text">Manage Posts</h2>
          <div className="space-y-3">
            {posts?.map((post) => (
              <div key={post.id} className="app-surface rounded-xl p-4 border app-border flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-500">{post.profiles?.full_name ?? "Student"}</p>
                  <p className="app-text text-sm mt-1">{post.content}</p>
                  <p className="app-text-muted text-xs mt-1">{new Date(post.created_at).toLocaleString("en-MY")}</p>
                </div>
                <form method="POST" action={`/api/admin/delete-post?postId=${post.id}`}>
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-lg flex-shrink-0">
                    Delete
                  </button>
                </form>
              </div>
            ))}
            {(!posts || posts.length === 0) && (
              <p className="app-text-muted text-center py-8">No posts yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}