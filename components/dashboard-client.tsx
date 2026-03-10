"use client"

import { useState, useMemo, useCallback } from "react"
import { Home, Users, UserPlus, Bell, User, Search, MessageCircle, UserCheck, Heart, Send, GraduationCap, Menu, X, Info, Calendar, Users as UsersIcon, BookOpen, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { SearchModal } from "@/components/search-modal"

const supabase = createClient()

const getBadge = (badgeRole: string | null | undefined) => {
  if (!badgeRole) return null
  return ["Founder", "Admin", "Moderator", "Club Leader"].includes(badgeRole) ? true : null
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" })
}

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string | null
  badge_role: string | null
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
    badge_role: string | null
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
    badge_role: string | null
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
  subjectMemberships: string[]
  signOut: () => Promise<void>
}

const Badge = ({ badgeRole }: { badgeRole: string | null | undefined }) => {
  if (!getBadge(badgeRole)) return null
  return <img src="/verified.png" title={badgeRole ?? ""} className="w-4 h-4 inline-block" />
}

const isStaff = (badgeRole: string | null | undefined) =>
  ["Founder", "Admin", "Moderator"].includes(badgeRole ?? "")

export function DashboardClient({ user, profile, profiles, connections, posts: initialPosts, likes: initialLikes, replies: initialReplies, subjectMemberships, signOut }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"home" | "friends" | "connections" | "community">("home")
  const [hasNotifications, setHasNotifications] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [likes, setLikes] = useState<Like[]>(initialLikes)
  const [replies, setReplies] = useState<Reply[]>(initialReplies)
  const [newPostContent, setNewPostContent] = useState("")

  const displayName = profile?.full_name || user.email.split("@")[0] || "Student"
  const initial = displayName[0].toUpperCase()

  const getStatus = useCallback((profileId: string) => {
    const conn = connections.find(
      c => (c.sender_id === profileId && c.receiver_id === user.id) ||
           (c.sender_id === user.id && c.receiver_id === profileId)
    )
    if (!conn) return "none"
    if (conn.status === "accepted") return "connected"
    if (conn.sender_id === user.id) return "pending_sent"
    return "pending_received"
  }, [connections, user.id])

  const connectedProfiles = useMemo(() => profiles.filter(p => getStatus(p.id) === "connected"), [profiles, getStatus])
  const filteredProfiles = useMemo(() => profiles.filter(p =>
    (p.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.bio ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  ), [profiles, searchQuery])

  const communities = useMemo(() => profiles.reduce((acc, p) => {
    const role = p.role || "General"
    if (!acc[role]) acc[role] = []
    acc[role].push(p)
    return acc
  }, {} as Record<string, Profile[]>), [profiles])

  const userCommunity = profile?.role || "General"

  const getLikeCount = useCallback((postId: string) => likes.filter(l => l.post_id === postId).length, [likes])
  const isLiked = useCallback((postId: string) => likes.some(l => l.post_id === postId && l.user_id === user.id), [likes, user.id])
  const getRepliesForPost = useCallback((postId: string) => replies.filter(r => r.post_id === postId), [replies])

  const toggleReplyInput = useCallback((postId: string) => {
    setShowReplyInput(prev => ({ ...prev, [postId]: !prev[postId] }))
  }, [])

  const handleLike = async (postId: string) => {
    const already = isLiked(postId)
    if (already) {
      setLikes(prev => prev.filter(l => !(l.post_id === postId && l.user_id === user.id)))
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId)
    } else {
      const optimistic: Like = { id: `temp-${Date.now()}`, user_id: user.id, post_id: postId }
      setLikes(prev => [...prev, optimistic])
      const { data } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId }).select().single()
      if (data) setLikes(prev => prev.map(l => l.id === optimistic.id ? data : l))
    }
  }

  const handleReply = async (postId: string) => {
    const content = replyInputs[postId]?.trim()
    if (!content) return
    setReplyInputs(prev => ({ ...prev, [postId]: "" }))
    const optimistic: Reply = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      post_id: postId,
      content,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? null,
        badge_role: profile?.badge_role ?? null,
      }
    }
    setReplies(prev => [...prev, optimistic])
    const { data } = await supabase.from("replies").insert({ user_id: user.id, post_id: postId, content }).select().single()
    if (data) setReplies(prev => prev.map(r => r.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : r))
  }

  const handlePost = async () => {
    const content = newPostContent.trim()
    if (!content) return
    setNewPostContent("")
    const optimistic: Post = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? null,
        badge_role: profile?.badge_role ?? null,
      }
    }
    setPosts(prev => [optimistic, ...prev])
    const { data } = await supabase.from("posts").insert({ user_id: user.id, content }).select().single()
    if (data) setPosts(prev => prev.map(p => p.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : p))
  }

  const ConnectionCard = ({ p }: { p: Profile }) => {
    const status = getStatus(p.id)
    return (
      <div className="app-surface rounded-xl p-5 border app-border hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-zinc-700">
              {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.full_name?.[0] ?? "S")}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 ring-2 ring-zinc-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`/user/${p.id}`} className="font-semibold hover:underline">{p.full_name ?? "Student"}</a>
              {p.role && <span className="text-sm app-text-muted">({p.role})</span>}
              <Badge badgeRole={p.badge_role} />
            </div>
            <p className="text-sm app-text-muted mt-1 line-clamp-2">{p.bio ?? "No bio yet"}</p>
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
              className="flex-1 border app-border hover:opacity-80 app-text text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> Message
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col app-bg app-text">
      <header className="sticky top-0 z-50 w-full border-b app-border app-surface shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 app-text-muted">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-xl font-bold app-text">Sunway Connect</h1>
          </div>

          <nav className="flex items-center gap-1">
            {[
              { tab: "home" as const, icon: <Home className="h-6 w-6" />, label: "Home" },
              { tab: "friends" as const, icon: <Users className="h-6 w-6" />, label: "Friends" },
              { tab: "connections" as const, icon: <UserPlus className="h-6 w-6" />, label: "Connections" },
              { tab: "community" as const, icon: <GraduationCap className="h-6 w-6" />, label: "Community" },
            ].map(({ tab, icon, label }) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex h-12 w-12 md:w-24 items-center justify-center gap-2 rounded-lg transition-all hover:opacity-80",
                  activeTab === tab ? "text-indigo-500 border-b-2 border-indigo-500" : "app-text-muted"
                )}>
                {icon}
                <span className="hidden md:inline text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:opacity-80 app-text-muted">
              <Search className="h-5 w-5" />
            </button>
            <a href="/messages" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 app-text-muted">
              <MessageCircle className="h-5 w-5" />
            </a>
            <button onClick={() => setHasNotifications(false)}
              className="relative h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 app-text-muted">
              <Bell className="h-5 w-5" />
              {hasNotifications && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-zinc-900" />}
            </button>
            <a href="/profile" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:opacity-80 app-text-muted">
              <User className="h-5 w-5" />
            </a>
            <a href="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex">
        {sidebarOpen && (
          <>
            <aside className="fixed inset-y-0 left-0 z-60 w-64 app-surface border-r app-border overflow-y-auto">
              <div className="flex flex-col h-full pt-16">
                <div className="p-4 border-b app-border">
                  <p className="text-xs app-text-muted uppercase tracking-wider font-semibold">Menu</p>
                </div>
                <div className="flex-1 p-4 space-y-2">

                  {isStaff(profile?.badge_role) && (
                    <a href="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-yellow-500">Admin Panel</p>
                        <p className="text-xs app-text-muted">Manage users & posts</p>
                      </div>
                    </a>
                  )}

                  {/* Search — mobile only */}
                  <button onClick={() => { setSidebarOpen(false); setSearchOpen(true) }}
                    className="md:hidden w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-colors">
                    <div className="w-8 h-8 rounded-lg app-input-bg border app-border flex items-center justify-center flex-shrink-0">
                      <Search className="h-4 w-4 app-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium app-text">Search</p>
                      <p className="text-xs app-text-muted">Users, posts, communities</p>
                    </div>
                  </button>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-2 mb-1">
                      <UsersIcon className="h-4 w-4 text-indigo-500" />
                      <p className="text-sm font-semibold app-text">Communities</p>
                    </div>

                    {profile?.role && (
                      <a href={`/community/${encodeURIComponent(profile.role)}`}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium app-text truncate">{profile.role}</p>
                          <p className="text-xs app-text-muted">Program</p>
                        </div>
                      </a>
                    )}

                    {subjectMemberships.map(subject => (
                      <a key={subject} href={`/community/${encodeURIComponent(subject)}`}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-colors">
                        <div className="w-8 h-8 rounded-lg app-input-bg border app-border flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-4 w-4 app-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium app-text truncate">{subject}</p>
                          <p className="text-xs app-text-muted">Subject</p>
                        </div>
                      </a>
                    ))}

                    {subjectMemberships.length === 0 && (
                      <a href="/subjects" className="flex items-center gap-2 px-3 py-2 text-xs app-text-muted hover:text-indigo-500 transition-colors">
                        + Browse subject communities
                      </a>
                    )}
                  </div>

                  <div className="border-t app-border pt-4">
                    <div className="flex items-center gap-2 px-2 py-2 mb-1">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <p className="text-sm font-semibold app-text">Upcoming Events</p>
                    </div>
                    <div className="space-y-1">
                      {[
                        { title: "Career Fair 2026", date: "Mar 15 • 10:00 AM" },
                        { title: "Study Group", date: "Mar 20 • 2:00 PM" },
                        { title: "Sports Tournament", date: "Mar 25 • 9:00 AM" },
                      ].map(e => (
                        <div key={e.title} className="px-3 py-2.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer">
                          <p className="text-sm font-medium app-text">{e.title}</p>
                          <p className="text-xs app-text-muted mt-0.5">{e.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t app-border pt-4">
                    <button onClick={() => setAboutOpen(v => !v)}
                      className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:opacity-80 transition-colors">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 app-text-muted" />
                        <p className="text-sm font-semibold app-text-muted">About</p>
                      </div>
                      {aboutOpen ? <ChevronDown className="h-4 w-4 app-text-muted" /> : <ChevronRight className="h-4 w-4 app-text-muted" />}
                    </button>
                    {aboutOpen && (
                      <div className="mt-2 px-3 py-3 app-input-bg rounded-lg border app-border">
                        <p className="text-xs app-text-muted leading-relaxed">
                          Sunway Connect is an independent platform created for students and is not affiliated with, endorsed by, or officially connected to Sunway University or Sunway College. All trademarks and names belong to their respective owners.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSidebarOpen(false)} />
          </>
        )}

        <div className="flex-1 min-w-0">

          {/* HOME TAB */}
          {activeTab === "home" && (
            <div className="mx-auto max-w-2xl px-4 py-6">
              <div className="app-surface rounded-2xl p-5 mb-6 border app-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost() } }}
                      placeholder="Share something with your network..."
                      className="flex-1 app-input-bg app-text rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handlePost} disabled={!newPostContent.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {posts.map((post) => {
                  const postReplies = getRepliesForPost(post.id)
                  const liked = isLiked(post.id)
                  const likeCount = getLikeCount(post.id)
                  return (
                    <div key={post.id} className={cn("app-surface rounded-2xl p-5 border app-border", post.id.startsWith("temp-") && "opacity-70")}>
                      <div className="flex items-center gap-3 mb-3">
                        <a href={`/user/${post.user_id}`}>
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0 hover:opacity-80">
                            {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (post.profiles?.full_name?.[0] ?? "S")}
                          </div>
                        </a>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={`/user/${post.user_id}`} className="font-semibold text-sm hover:underline app-text">{post.profiles?.full_name ?? "Student"}</a>
                            {post.profiles?.role && <span className="text-xs app-text-muted">({post.profiles.role})</span>}
                            <Badge badgeRole={post.profiles?.badge_role} />
                          </div>
                          <p className="text-xs app-text-muted">{formatTime(post.created_at)}</p>
                        </div>
                      </div>

                      <p className="app-text text-sm leading-relaxed mb-4">{post.content}</p>

                      <div className="flex items-center gap-4 border-t app-border pt-3">
                        <button onClick={() => handleLike(post.id)}
                          className={cn("flex items-center gap-2 text-sm transition-colors", liked ? "text-red-400" : "app-text-muted hover:text-red-400")}>
                          <Heart className={cn("h-4 w-4", liked && "fill-red-400")} />
                          {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                        </button>
                        <button onClick={() => toggleReplyInput(post.id)}
                          className="flex items-center gap-2 text-sm app-text-muted hover:opacity-80 transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          {postReplies.length} {postReplies.length === 1 ? "Reply" : "Replies"}
                        </button>
                      </div>

                      {postReplies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 app-border">
                          {postReplies.map((reply) => (
                            <div key={reply.id} className={cn("flex gap-3", reply.id.startsWith("temp-") && "opacity-70")}>
                              <a href={`/user/${reply.user_id}`}>
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0 hover:opacity-80">
                                  {reply.profiles?.avatar_url ? <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (reply.profiles?.full_name?.[0] ?? "S")}
                                </div>
                              </a>
                              <div className="flex-1">
                                <div className="app-input-bg rounded-2xl px-4 py-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <a href={`/user/${reply.user_id}`} className="font-semibold text-sm hover:underline app-text">{reply.profiles?.full_name ?? "Student"}</a>
                                    {reply.profiles?.role && <span className="text-xs app-text-muted">({reply.profiles.role})</span>}
                                    <Badge badgeRole={reply.profiles?.badge_role} />
                                  </div>
                                  <p className="app-text text-sm leading-relaxed">{reply.content}</p>
                                </div>
                                <p className="text-xs app-text-muted mt-1 ml-2">{formatTime(reply.created_at)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showReplyInput[post.id] && (
                        <div className="mt-3 pt-3 border-t app-border">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
                            </div>
                            <input
                              value={replyInputs[post.id] ?? ""}
                              onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(post.id) } }}
                              placeholder="Write a reply..."
                              className="flex-1 app-input-bg app-text rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button onClick={() => handleReply(post.id)} disabled={!replyInputs[post.id]?.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded-full text-sm">
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {posts.length === 0 && <p className="app-text-muted text-center py-12">No posts yet. Be the first to share something!</p>}
              </div>
            </div>
          )}

          {/* FRIENDS TAB */}
          {activeTab === "friends" && (
            <div className="mx-auto max-w-3xl px-4 py-6">
              <h1 className="text-2xl font-bold mb-1 app-text">Friends</h1>
              <p className="app-text-muted mb-6">{connectedProfiles.length} friends</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {connectedProfiles.map((friend) => (
                  <div key={friend.id} className="app-surface rounded-xl p-4 border app-border flex items-center gap-3">
                    <div className="relative">
                      <a href={`/user/${friend.id}`}>
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden hover:opacity-80">
                          {friend.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> : (friend.full_name?.[0] ?? "S")}
                        </div>
                      </a>
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-zinc-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/user/${friend.id}`} className="font-medium hover:underline app-text">{friend.full_name ?? "Student"}</a>
                        {friend.role && <span className="text-xs app-text-muted">({friend.role})</span>}
                        <Badge badgeRole={friend.badge_role} />
                      </div>
                      <p className="text-xs app-text-muted truncate">{friend.bio ?? "No bio yet"}</p>
                    </div>
                    <a href={`/messages/${friend.id}`} className="h-8 w-8 flex items-center justify-center rounded-full hover:opacity-80 app-text-muted">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                ))}
                {connectedProfiles.length === 0 && <p className="app-text-muted col-span-2 text-center py-12">No friends yet. Connect with students first!</p>}
              </div>
            </div>
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === "connections" && (
            <div className="mx-auto max-w-6xl px-4 py-6">
              <h1 className="text-2xl font-bold mb-1 app-text">Connections</h1>
              <p className="app-text-muted mb-6">Discover and connect with fellow Sunway students</p>
              <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-muted" />
                <input placeholder="Search by name or bio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full app-surface border app-border app-text rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.map((p) => <ConnectionCard key={p.id} p={p} />)}
                {filteredProfiles.length === 0 && <p className="app-text-muted col-span-3 text-center py-12">No students found.</p>}
              </div>
            </div>
          )}

          {/* COMMUNITY TAB */}
          {activeTab === "community" && (
            <div className="mx-auto max-w-4xl px-4 py-6">
              <h1 className="text-2xl font-bold mb-6 app-text">Community</h1>
              <div className="app-surface rounded-2xl border app-border overflow-hidden mb-8">
                <div className="px-6 py-4 border-b app-border flex items-center justify-between">
                  <h2 className="text-lg font-semibold app-text">Your Communities</h2>
                  <a href="/subjects" className="text-indigo-500 hover:opacity-80 text-sm font-medium">Manage subjects →</a>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-semibold app-text">{userCommunity}</p>
                        <p className="app-text-muted text-sm">Program community</p>
                      </div>
                    </div>
                    <a href={`/community/${encodeURIComponent(userCommunity)}`}
                      className="text-xs text-indigo-500 hover:opacity-80 app-input-bg px-3 py-1 rounded-full border border-indigo-500/30">
                      Open →
                    </a>
                  </div>
                  {subjectMemberships.length > 0 && (
                    <div className="border-t app-border pt-5">
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-4 w-4 app-text-muted" />
                        <p className="text-sm font-medium app-text-muted">Subject Communities</p>
                      </div>
                      <div className="space-y-3">
                        {subjectMemberships.map((subject) => (
                          <div key={subject} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl app-input-bg border app-border flex items-center justify-center">
                                <BookOpen className="h-4 w-4 app-text-muted" />
                              </div>
                              <p className="text-sm font-medium app-text">{subject}</p>
                            </div>
                            <a href={`/community/${encodeURIComponent(subject)}`}
                              className="text-xs app-text-muted hover:opacity-80">Open →</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {subjectMemberships.length === 0 && (
                    <div className="border-t app-border pt-5">
                      <p className="app-text-muted text-sm">No subject communities joined yet.</p>
                      <a href="/subjects" className="text-indigo-500 hover:opacity-80 text-sm mt-1 inline-block">Browse subjects →</a>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4 app-text">All Program Communities</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(communities).map(([role, members]) => (
                    <a key={role} href={`/community/${encodeURIComponent(role)}`} className={cn(
                      "rounded-xl p-4 border transition-all block",
                      role === userCommunity ? "bg-indigo-600/10 border-indigo-500/30" : "app-surface app-border hover:opacity-90"
                    )}>
                      <div className="flex items-center gap-3 mb-2">
                        <GraduationCap className={cn("h-5 w-5", role === userCommunity ? "text-indigo-500" : "app-text-muted")} />
                        <h3 className="font-semibold text-sm app-text">{role}</h3>
                        {role === userCommunity && <span className="text-xs text-indigo-500 ml-auto">Yours</span>}
                      </div>
                      <p className="app-text-muted text-xs">{members.length} {members.length === 1 ? "member" : "members"}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <div className="fixed bottom-4 right-4">
        <form action={signOut}>
          <button type="submit" className="app-input-bg hover:opacity-80 app-text-muted text-sm px-4 py-2 rounded-full border app-border">
            Sign out
          </button>
        </form>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} currentUserId={user.id} />
    </div>
  )
}