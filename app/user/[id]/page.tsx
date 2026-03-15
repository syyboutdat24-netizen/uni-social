import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PUBLIC_COMMUNITIES } from "@/lib/communities";

export const dynamic = 'force-dynamic';

const PROFILE_THEMES: Record<string, { from: string; to: string }> = {
  default:  { from: "from-indigo-900/50", to: "to-zinc-800" },
  ocean:    { from: "from-blue-900/60",   to: "to-cyan-800/60" },
  sunset:   { from: "from-orange-900/60", to: "to-pink-800/60" },
  forest:   { from: "from-green-900/60",  to: "to-emerald-800/60" },
  galaxy:   { from: "from-purple-900/60", to: "to-indigo-800/60" },
  fire:     { from: "from-red-900/60",    to: "to-orange-800/60" },
  midnight: { from: "from-zinc-900",      to: "to-zinc-700" },
  rose:     { from: "from-rose-900/60",   to: "to-pink-700/60" },
}

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📷", url: (v: string) => `https://instagram.com/${v.replace("@","")}` },
  { key: "snapchat",  label: "Snapchat",  icon: "👻", url: (v: string) => `https://snapchat.com/add/${v.replace("@","")}` },
  { key: "twitter",   label: "Twitter",   icon: "🐦", url: (v: string) => `https://x.com/${v.replace("@","")}` },
  { key: "tiktok",    label: "TikTok",    icon: "🎵", url: (v: string) => `https://tiktok.com/@${v.replace("@","")}` },
  { key: "linkedin",  label: "LinkedIn",  icon: "💼", url: (v: string) => v.startsWith("http") ? v : `https://${v}` },
  { key: "github",    label: "GitHub",    icon: "💻", url: (v: string) => `https://github.com/${v.replace("@","")}` },
  { key: "youtube",   label: "YouTube",   icon: "▶️", url: (v: string) => v.startsWith("http") ? v : `https://youtube.com/@${v}` },
  { key: "discord",   label: "Discord",   icon: "🎮", url: (v: string) => `#` },
]

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, role, badge_role, socials, hobbies, profile_theme")
    .eq("id", id)
    .maybeSingle();

  if (!profile) redirect("/dashboard");

  const { data: rawPosts } = await supabase.from("posts").select("*").eq("user_id", id).order("created_at", { ascending: false });
  const { data: likes } = await supabase.from("likes").select("*");
  const { data: subjectMemberships } = await supabase.from("subject_memberships").select("subject").eq("user_id", id);
  const { data: allConnections } = await supabase.from("connections").select("*").or(`sender_id.eq.${id},receiver_id.eq.${id}`).eq("status", "accepted");
  const { data: replies } = await supabase.from("replies").select("*").eq("user_id", id);
  const { data: myConns } = await supabase.from("connections").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const myConn = myConns?.find(c =>
    (c.sender_id === user.id && c.receiver_id === id) ||
    (c.sender_id === id && c.receiver_id === user.id)
  );
  const connStatus = !myConn ? "none" : myConn.status === "accepted" ? "connected" : myConn.sender_id === user.id ? "pending_sent" : "pending_received";
  const isOwnProfile = user.id === id;
  const getLikeCount = (postId: string) => likes?.filter(l => l.post_id === postId).length ?? 0;
  const BADGE_ROLES = ["Founder", "Admin", "Moderator", "Club Leader"];
  const hasBadge = profile.badge_role && BADGE_ROLES.includes(profile.badge_role);
  const initial = profile.full_name?.[0]?.toUpperCase() ?? "S";

  const themeKey = (profile.profile_theme as string) ?? "default";
  const theme = PROFILE_THEMES[themeKey] ?? PROFILE_THEMES.default;

  const socials = (profile.socials as Record<string, string>) ?? {};
  const hobbies = (profile.hobbies as string[]) ?? [];
  const socialEntries = SOCIAL_PLATFORMS.filter(p => socials[p.key]);
  const hobbyItems = hobbies.map(slug => PUBLIC_COMMUNITIES.find(c => c.slug === slug)).filter(Boolean);

  return (
    <div className="min-h-screen app-bg app-text">
      <div className="app-surface border-b app-border px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-indigo-500 font-bold text-lg">Sunway Connect</a>
        <a href="/dashboard" className="app-text-muted hover:opacity-80 text-sm">← Back</a>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Profile Card */}
        <div className="app-surface rounded-2xl border app-border overflow-hidden">
          <div className={`h-32 bg-gradient-to-r ${theme.from} ${theme.to}`} />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold overflow-hidden ring-4 ring-zinc-900">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
              </div>
              <div className="flex gap-2">
                {isOwnProfile && (
                  <a href="/settings" className="app-input-bg hover:opacity-80 app-text text-sm px-4 py-2 rounded-lg border app-border">
                    Edit Profile
                  </a>
                )}
                {!isOwnProfile && connStatus === "none" && (
                  <form method="POST" action={`/api/connections/send?to=${id}`}>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">Connect</button>
                  </form>
                )}
                {!isOwnProfile && connStatus === "pending_sent" && (
                  <span className="text-yellow-400 text-sm px-4 py-2">Pending...</span>
                )}
                {!isOwnProfile && connStatus === "pending_received" && (
                  <form method="POST" action={`/api/connections/accept?from=${id}`}>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">Accept</button>
                  </form>
                )}
                {!isOwnProfile && connStatus === "connected" && (
                  <a href={`/messages/${id}`} className="app-input-bg hover:opacity-80 app-text text-sm px-4 py-2 rounded-lg border app-border">Message</a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold app-text">{profile.full_name ?? "Student"}</h1>
              {hasBadge && <img src="/verified.png" title={profile.badge_role ?? ""} className="w-5 h-5" />}
            </div>
            {profile.role && <p className="app-text-muted text-sm mb-2">{profile.role}</p>}
            {profile.bio && <p className="app-text text-sm leading-relaxed mb-4">{profile.bio}</p>}

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {socialEntries.map(platform => (
                  <a key={platform.key}
                    href={platform.url(socials[platform.key])}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 app-input-bg border app-border px-3 py-1.5 rounded-full text-xs app-text hover:border-indigo-500/50 transition-colors">
                    <span>{platform.icon}</span>
                    <span>{socials[platform.key]}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex gap-6 pt-4 border-t app-border">
              <div className="text-center">
                <p className="text-lg font-bold app-text">{rawPosts?.length ?? 0}</p>
                <p className="text-xs app-text-muted">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold app-text">{allConnections?.length ?? 0}</p>
                <p className="text-xs app-text-muted">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold app-text">{(subjectMemberships?.length ?? 0) + (profile.role ? 1 : 0)}</p>
                <p className="text-xs app-text-muted">Communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hobbies */}
        {hobbyItems.length > 0 && (
          <div className="app-surface rounded-2xl border app-border p-6">
            <h2 className="text-lg font-semibold mb-4 app-text">Passions & Hobbies</h2>
            <div className="flex flex-wrap gap-2">
              {hobbyItems.map(hobby => hobby && (
                <a key={hobby.slug} href={`/community/${hobby.slug}`}
                  className="flex items-center gap-1.5 app-input-bg border app-border px-3 py-1.5 rounded-full text-sm app-text hover:border-indigo-500/50 transition-colors">
                  <span>{hobby.emoji}</span>
                  <span>{hobby.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Communities */}
        <div className="app-surface rounded-2xl border app-border p-6">
          <h2 className="text-lg font-semibold mb-4 app-text">Communities</h2>
          <div className="space-y-3">
            {profile.role && (
              <div className="flex items-center gap-3 p-3 app-input-bg rounded-xl border app-border">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg">🎓</div>
                <div>
                  <p className="font-medium text-sm app-text">{profile.role}</p>
                  <p className="text-xs app-text-muted">Program</p>
                </div>
              </div>
            )}
            {subjectMemberships?.map(m => (
              <div key={m.subject} className="flex items-center gap-3 p-3 app-input-bg rounded-xl border app-border">
                <div className="w-10 h-10 rounded-lg app-input-bg border app-border flex items-center justify-center text-lg">📚</div>
                <div>
                  <p className="font-medium text-sm app-text">{m.subject}</p>
                  <p className="text-xs app-text-muted">Subject</p>
                </div>
              </div>
            ))}
            {!profile.role && (subjectMemberships?.length ?? 0) === 0 && (
              <p className="app-text-muted text-sm">No communities joined yet.</p>
            )}
          </div>
        </div>

        {/* Posts */}
        <div>
          <h2 className="text-lg font-semibold mb-4 app-text">Posts</h2>
          <div className="space-y-4">
            {rawPosts?.map(post => (
              <div key={post.id} className="app-surface rounded-2xl p-5 border app-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm app-text">{profile.full_name ?? "Student"}</p>
                      {hasBadge && <img src="/verified.png" className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-xs app-text-muted">{new Date(post.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <p className="app-text text-sm leading-relaxed mb-3">{post.content}</p>
                <div className="flex items-center gap-4 border-t app-border pt-3">
                  <span className="app-text-muted text-sm">❤️ {getLikeCount(post.id)} likes</span>
                  <span className="app-text-muted text-sm">💬 {replies?.filter(r => r.post_id === post.id).length ?? 0} replies</span>
                </div>
              </div>
            ))}
            {(!rawPosts || rawPosts.length === 0) && (
              <p className="app-text-muted text-center py-8">No posts yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
