"use client"

import { useState } from "react"
import { Home, Users, UserPlus, Bell, User, Search, MessageCircle, UserCheck, Heart, Send, Users2, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

const formatTime = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string | null
}

interface Connection {
  id: string
  sender_id: string
  receiver_id: string
  status: string
}

interface Post {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    role: string | null
  } | null
}

interface Like {
  id: string
  user_id: string
  post_id: string
}

interface DashboardClientProps {
  user: { id: string; email: string }
  profile: Profile | null
  profiles: Profile[]
  connections: Connection[]
  posts: Post[]
  likes: Like[]
  signOut: () => Promise<void>
}

export function DashboardClient({ user, profile, profiles, connections, posts, likes, signOut }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "connections" | "community">("home")
  const [hasNotifications, setHasNotifications] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const displayName = profile?.full_name || user.email.split("@")[0] || "Student"
  const initial = displayName[0].toUpperCase()

  const getStatus = (profileId: string) => {
    const conn = connections.find(
      c => (c.sender_id === profileId && c.receiver_id === user.id) ||
           (c.sender_id === user.id && c.receiver_id === profileId)
    )
    if (!conn) return "none"
    if (conn.status === "accepted") return "connected"
    if (conn.sender_id === user.id) return "pending_sent"
    return "pending_received"
  }

  const connectedProfiles = profiles.filter(p => getStatus(p.id) === "connected")

  const filteredProfiles = profiles.filter(p =>
    (p.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.bio ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group profiles by role for communities
  const communities = profiles.reduce((acc, profile) => {
    const role = profile.role || "General"
    if (!acc[role]) {
      acc[role] = []
    }
    acc[role].push(profile)
    return acc
  }, {} as Record<string, Profile[]>)

  // Get user's community based on their role
  const userCommunity = profile?.role || "General"
  const communityMembers = communities[userCommunity] || []

  const getLikeCount = (postId: string) => likes.filter(l => l.post_id === postId).length
  const isLiked = (postId: string) => likes.some(l => l.post_id === postId && l.user_id === user.id)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <h1 className="hidden md:block text-xl font-bold text-white">Sunway Connect</h1>
          </div>

          <nav className="flex items-center gap-1">
            {[
              { tab: "home" as const, icon: <Home className="h-5 w-5" />, label: "Home" },
              { tab: "friends" as const, icon: <Users className="h-5 w-5" />, label: "Friends" },
              { tab: "connections" as const, icon: <UserPlus className="h-5 w-5" />, label: "Connections" },
              { tab: "community" as const, icon: <GraduationCap className="h-5 w-5" />, label: "Community" },
            ].map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex h-12 w-12 md:w-24 items-center justify-center gap-2 rounded-lg transition-all",
                  "hover:bg-zinc-800",
                  activeTab === tab
                    ? "text-indigo-400 border-b-2 border-indigo-400"
                    : "text-zinc-400"
                )}
              >
                {icon}
                <span className="hidden md:inline text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400">
              <Search className="h-5 w-5" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400">
              <MessageCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => setHasNotifications(false)}
              className="relative h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400"
            >
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-zinc-900" />
              )}
            </button>
            <a href="/profile" className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400">
              <User className="h-5 w-5" />
            </a>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white cursor-pointer overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : initial}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="mx-auto max-w-2xl px-4 py-6">

            {/* Create Post */}
            <div className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : initial}
                </div>
                <form method="POST" action="/api/posts/create" className="flex-1 flex gap-2">
                  <input
                    name="content"
                    placeholder="Share something with your network..."
                    className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                      {post.profiles?.avatar_url
                        ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (post.profiles?.full_name?.[0] ?? "S")}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{post.profiles?.full_name ?? "Student"} {post.profiles?.role && <span className="text-xs text-zinc-400">({post.profiles.role})</span>}</p>
                      <p className="text-xs text-zinc-500">{formatTime(post.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed mb-4">{post.content}</p>
                  <div className="flex items-center gap-4 border-t border-zinc-800 pt-3">
                    <form method="POST" action={`/api/posts/like?id=${post.id}`}>
                      <button type="submit"
                        className={cn(
                          "flex items-center gap-2 text-sm transition-colors",
                          isLiked(post.id) ? "text-red-400" : "text-zinc-400 hover:text-red-400"
                        )}>
                        <Heart className={cn("h-4 w-4", isLiked(post.id) && "fill-red-400")} />
                        {getLikeCount(post.id)} {getLikeCount(post.id) === 1 ? "Like" : "Likes"}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-zinc-500 text-center py-12">No posts yet. Be the first to share something!</p>
              )}
            </div>
          </div>
        )}

        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <div className="mx-auto max-w-3xl px-4 py-6">
            <h1 className="text-2xl font-bold mb-1">Friends</h1>
            <p className="text-zinc-400 mb-6">{connectedProfiles.length} friends</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {connectedProfiles.map((friend) => (
                <div key={friend.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden">
                      {friend.avatar_url
                        ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (friend.full_name?.[0] ?? "S")}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-zinc-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{friend.full_name ?? "Student"} {friend.role && <span className="text-xs text-zinc-500">({friend.role})</span>}</p>
                    <p className="text-xs text-zinc-400 truncate">{friend.bio ?? "No bio yet"}</p>
                  </div>
                  <a href={`/messages/${friend.id}`}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              ))}
              {connectedProfiles.length === 0 && (
                <p className="text-zinc-500 col-span-2 text-center py-12">No friends yet. Connect with students first!</p>
              )}
            </div>
          </div>
        )}

        {/* CONNECTIONS TAB */}
        {activeTab === "connections" && (
          <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-2xl font-bold mb-1">Connections</h1>
            <p className="text-zinc-400 mb-6">Discover and connect with fellow Sunway students</p>
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                placeholder="Search by name or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProfiles.map((p) => {
                const status = getStatus(p.id)
                return (
                  <div key={p.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-zinc-700">
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                            : (p.full_name?.[0] ?? "S")}
                        </div>
                        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 ring-2 ring-zinc-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{p.full_name ?? "Student"} {p.role && <span className="text-sm text-zinc-500">({p.role})</span>}</h3>
                        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{p.bio ?? "No bio yet"}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <form method="POST" className="flex-1">
                        {status === "none" && (
                          <button formAction={`/api/connections/send?to=${p.id}`}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                            <UserPlus className="h-4 w-4" /> Connect
                          </button>
                        )}
                        {status === "pending_sent" && (
                          <div className="w-full text-center text-yellow-400 text-sm py-2">Pending...</div>
                        )}
                        {status === "pending_received" && (
                          <button formAction={`/api/connections/accept?from=${p.id}`}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                            <UserCheck className="h-4 w-4" /> Accept
                          </button>
                        )}
                        {status === "connected" && (
                          <div className="w-full text-center text-indigo-400 text-sm py-2 flex items-center justify-center gap-2">
                            <UserCheck className="h-4 w-4" /> Connected
                          </div>
                        )}
                      </form>
                      {status === "connected" && (
                        <a href={`/messages/${p.id}`}
                          className="flex-1 border border-zinc-700 hover:bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                          <MessageCircle className="h-4 w-4" /> Message
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
              {filteredProfiles.length === 0 && (
                <p className="text-zinc-500 col-span-3 text-center py-12">No students found.</p>
              )}
            </div>
          </div>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === "community" && (
          <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-2xl font-bold mb-1">Community</h1>
            <p className="text-zinc-400 mb-6">Connect with students in your program</p>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Your Community: {userCommunity}</h2>
              <p className="text-zinc-400 mb-6">{communityMembers.length} members in {userCommunity}</p>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {communityMembers.map((member) => {
                  const status = getStatus(member.id)
                  return (
                    <div key={member.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-zinc-700">
                            {member.avatar_url
                              ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                              : (member.full_name?.[0] ?? "S")}
                          </div>
                          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 ring-2 ring-zinc-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{member.full_name ?? "Student"} {member.role && <span className="text-sm text-zinc-500">({member.role})</span>}</h3>
                          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{member.bio ?? "No bio yet"}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <form method="POST" className="flex-1">
                          {status === "none" && (
                            <button formAction={`/api/connections/send?to=${member.id}`}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                              <UserPlus className="h-4 w-4" /> Connect
                            </button>
                          )}
                          {status === "pending_sent" && (
                            <div className="w-full text-center text-yellow-400 text-sm py-2">Pending...</div>
                          )}
                          {status === "pending_received" && (
                            <button formAction={`/api/connections/accept?from=${member.id}`}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                              <UserCheck className="h-4 w-4" /> Accept
                            </button>
                          )}
                          {status === "connected" && (
                            <div className="w-full text-center text-indigo-400 text-sm py-2 flex items-center justify-center gap-2">
                              <UserCheck className="h-4 w-4" /> Connected
                            </div>
                          )}
                        </form>
                        {status === "connected" && (
                          <a href={`/messages/${member.id}`}
                            className="flex-1 border border-zinc-700 hover:bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                            <MessageCircle className="h-4 w-4" /> Message
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
                {communityMembers.length === 0 && (
                  <p className="text-zinc-500 col-span-3 text-center py-12">No members in your community yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">All Communities</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(communities).map(([role, members]) => (
                  <div key={role} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-3">
                      <GraduationCap className="h-6 w-6 text-indigo-400" />
                      <h3 className="font-semibold text-lg">{role}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">{members.length} members</p>
                    <button 
                      onClick={() => {
                        // Could implement community switching here if needed
                        // For now, just show the community
                      }}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                      View Community
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-4 right-4">
        <form action={signOut}>
          <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm px-4 py-2 rounded-full border border-zinc-700">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}