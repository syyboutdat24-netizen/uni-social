"use client"

import { useState } from "react"
import { Home, Users, UserPlus, Bell, User, Search, MessageCircle, UserCheck, Heart, Send, GraduationCap, Menu, X, Info, Calendar, Users as UsersIcon } from "lucide-react"
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

interface Reply {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    role: string | null
  } | null
}

interface DashboardClientProps {
  user: { id: string; email: string }
  profile: Profile | null
  profiles: Profile[]
  connections: Connection[]
  posts: Post[]
  likes: Like[]
  replies: Reply[]
  signOut: () => Promise<void>
}

export function DashboardClient({ user, profile, profiles, connections, posts, likes, replies, signOut }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "connections" | "community">("home")
  const [hasNotifications, setHasNotifications] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const getRepliesForPost = (postId: string) => replies.filter(r => r.post_id === postId)
  const toggleReplies = (postId: string) => {
    setShowReplies(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => sidebarOpen ? setSidebarOpen(false) : setSidebarOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-xl font-bold text-white">Sunway Connect</h1>
          </div>

          <nav className="flex items-center gap-1">
            {[
              { tab: "home" as const, icon: <Home className="h-6 w-6" />, label: "Home" },
              { tab: "friends" as const, icon: <Users className="h-6 w-6" />, label: "Friends" },
              { tab: "connections" as const, icon: <UserPlus className="h-6 w-6" />, label: "Connections" },
              { tab: "community" as const, icon: <GraduationCap className="h-6 w-6" />, label: "Community" },
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

      <main className="flex-1 flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <aside className={cn(
              "fixed md:relative inset-y-0 left-0 z-60 w-40 bg-zinc-900 border-r border-zinc-800 transform transition-all duration-300 ease-in-out",
              "translate-x-0"
            )}>
              <div className="flex flex-col h-full pt-16">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-white">Menu</h2>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                  {/* About Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white">About</h3>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                          <p className="text-zinc-300 text-[0.4rem] leading-relaxed">
                        Sunway Connect is an independent platform
                        <br />
                        created for students and is not affiliated
                        <br />
                        with, endorsed by, or officially connected
                        <br />
                        to Sunway University or Sunway College.
                        <br />
                        All trademarks and names belong to
                        <br />
                        their respective owners.
                      </p>
                    </div>
                  </div>

                  {/* Events Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white">Events</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                        <h4 className="font-medium text-white text-sm mb-1">Career Fair 2026</h4>
                        <p className="text-zinc-400 text-xs">Mar 15 • 10:00 AM</p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                        <h4 className="font-medium text-white text-sm mb-1">Study Group</h4>
                        <p className="text-zinc-400 text-xs">Mar 20 • 2:00 PM</p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                        <h4 className="font-medium text-white text-sm mb-1">Sports Tournament</h4>
                        <p className="text-zinc-400 text-xs">Mar 25 • 9:00 AM</p>
                      </div>
                    </div>
                  </div>

                  {/* Communities Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <UsersIcon className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white">Communities</h3>
                    </div>
                    <div className="space-y-2">
                      {/* User's Community */}
                      {profile?.role && (
                        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-4 w-4 text-indigo-400" />
                            <h4 className="font-medium text-white text-sm">{profile.role}</h4>
                          </div>
                          <p className="text-zinc-400 text-xs mb-2">
                            {communities[profile.role]?.length || 0} members
                          </p>
                          <button
                            onClick={() => {
                              setActiveTab("community")
                              setSidebarOpen(false)
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded transition-colors"
                          >
                            View
                          </button>
                        </div>
                      )}

                      {/* Other Communities */}
                      {Object.entries(communities)
                        .filter(([role]) => role !== profile?.role)
                        .slice(0, 2)
                        .map(([role, members]) => (
                          <div key={role} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="h-4 w-4 text-zinc-400" />
                              <h4 className="font-medium text-white text-sm">{role}</h4>
                            </div>
                            <p className="text-zinc-400 text-xs mb-2">
                              {members.length} members
                            </p>
                            <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded transition-colors">
                              Join
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
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
                    <button
                      onClick={() => toggleReplies(post.id)}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {getRepliesForPost(post.id).length} {getRepliesForPost(post.id).length === 1 ? "Reply" : "Replies"}
                    </button>
                  </div>

                  {/* Reply Form */}
                  {showReplies[post.id] && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <form method="POST" action="/api/posts/reply" className="flex gap-2 mb-4">
                        <input type="hidden" name="postId" value={post.id} />
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                          {profile?.avatar_url
                            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            : initial}
                        </div>
                        <input
                          name="content"
                          placeholder="Write a reply..."
                          className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-full text-sm">
                          <Send className="h-4 w-4" />
                        </button>
                      </form>

                      {/* Replies List */}
                      <div className="space-y-3">
                        {getRepliesForPost(post.id).map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                              {reply.profiles?.avatar_url
                                ? <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                : (reply.profiles?.full_name?.[0] ?? "S")}
                            </div>
                            <div className="flex-1">
                              <div className="bg-zinc-800 rounded-2xl px-4 py-2">
                                <p className="font-semibold text-sm">{reply.profiles?.full_name ?? "Student"} {reply.profiles?.role && <span className="text-xs text-zinc-400">({reply.profiles.role})</span>}</p>
                                <p className="text-zinc-200 text-sm leading-relaxed">{reply.content}</p>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1">{formatTime(reply.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

        </div>

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