"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Send, Hash, MessageCircle, BookOpen, Users, X, Plus, ChevronLeft, FileText, Menu, Settings, Trash2, Shield, ShieldCheck, Crown, Edit2, Check, AlertTriangle } from "lucide-react"
import { MediaAttachment, MediaDisplay } from "@/components/MediaAttachment"
import type { MediaFile } from "@/components/MediaAttachment"

const supabase = createClient()

const MOD_ROLES = ["Founder", "Admin", "Moderator", "Community Moderator"]
const isMod = (badgeRole: string | null | undefined) => MOD_ROLES.includes(badgeRole ?? "")

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
  role: string | null
  badge_role: string | null
}

interface ForumPost {
  id: string
  user_id: string
  title: string
  content: string
  media_url?: string | null
  media_type?: string | null
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface ForumReply {
  id: string
  post_id: string
  user_id: string
  content: string
  media_url?: string | null
  media_type?: string | null
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface ChatMessage {
  id: string
  user_id: string
  content: string
  media_url?: string | null
  media_type?: string | null
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface Note {
  id: string
  user_id: string
  title: string
  content: string
  media_url?: string | null
  media_type?: string | null
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface Channel {
  id: string
  name: string
  type: "chat" | "forum" | "notes"
  position: number
}

interface CommunityClientProps {
  user: { id: string; email: string }
  profile: Profile | null
  community: { name: string; type: "program" | "subject" | "public"; emoji?: string; description?: string }
  slug: string
  members: Profile[]
  forumPosts: ForumPost[]
  forumReplies: ForumReply[]
  chatMessages: ChatMessage[]
  notes: Note[]
}

const Avatar = ({ profile, size = "sm" }: { profile: { full_name?: string | null; avatar_url?: string | null } | null; size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-base", lg: "w-12 h-12 text-lg" }
  return (
    <div className={cn("rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0", sizes[size])}>
      <img src={profile?.avatar_url || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
    </div>
  )
}

const BadgeIcon = ({ role }: { role: string | null | undefined }) => {
  return null
}

export default function CommunityClient({
  user, profile, community, slug, members: initialMembers,
  forumPosts: initialForumPosts, forumReplies: initialForumReplies,
  chatMessages: initialChatMessages, notes: initialNotes,
}: CommunityClientProps) {
  const canModerate = isMod(profile?.badge_role)

  // Default channels
  const defaultChannels: Channel[] = [
    { id: "general-chat", name: "General Chat", type: "chat", position: 0 },
    { id: "forum", name: "Forum", type: "forum", position: 1 },
    { id: "notes", name: "Notes", type: "notes", position: 2 },
  ]

  const [channels, setChannels] = useState<Channel[]>(defaultChannels)
  const [activeChannelId, setActiveChannelId] = useState("general-chat")
  const [memberSidebarOpen, setMemberSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"overview" | "channels" | "members">("overview")

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages)
  const [chatInput, setChatInput] = useState("")
  const [chatMedia, setChatMedia] = useState<MediaFile | null>(null)
  const [chatMediaUploading, setChatMediaUploading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Forum state
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(initialForumPosts)
  const [forumReplies, setForumReplies] = useState<ForumReply[]>(initialForumReplies)
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostMedia, setNewPostMedia] = useState<MediaFile | null>(null)
  const [newPostMediaUploading, setNewPostMediaUploading] = useState(false)
  const [replyInput, setReplyInput] = useState("")
  const [replyMedia, setReplyMedia] = useState<MediaFile | null>(null)
  const [replyMediaUploading, setReplyMediaUploading] = useState(false)

  // Notes state
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newNoteMedia, setNewNoteMedia] = useState<MediaFile | null>(null)
  const [newNoteMediaUploading, setNewNoteMediaUploading] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  // Community settings state
  const [communityDesc, setCommunityDesc] = useState(community.description ?? "")
  const [communityRules, setCommunityRules] = useState("")
  const [members, setMembers] = useState<Profile[]>(initialMembers)
  const [savingSettings, setSavingSettings] = useState(false)

  // Channel editing
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [editingChannelName, setEditingChannelName] = useState("")
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<"chat" | "forum" | "notes">("chat")

  const activeChannel = channels.find(c => c.id === activeChannelId) ?? channels[0]

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  useEffect(() => {
    const channel = supabase
      .channel(`community-chat-${slug}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "community_messages",
        filter: `community_slug=eq.${slug}`,
      }, async (payload) => {
        const msg = payload.new as any
        if (msg.user_id === user.id) return
        const { data: p } = await supabase.from("profiles").select("full_name, avatar_url, badge_role").eq("id", msg.user_id).single()
        setChatMessages(prev => [...prev, { ...msg, profiles: p }])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [slug, user.id])

  const sendChat = async () => {
    const content = chatInput.trim()
    if (!content && !chatMedia) return
    const media = chatMedia
    setChatInput("")
    setChatMedia(null)
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`, user_id: user.id, content: content || "",
      media_url: media?.url ?? null, media_type: media?.type ?? null,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setChatMessages(prev => [...prev, optimistic])
    const { data } = await supabase.from("community_messages")
      .insert({ community_slug: slug, user_id: user.id, content: content || "", media_url: media?.url ?? null, media_type: media?.type ?? null })
      .select().single()
    if (data) setChatMessages(prev => prev.map(m => m.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : m))
  }

  const deleteMessage = async (id: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== id))
    await supabase.from("community_messages").delete().eq("id", id)
  }

  const createPost = async () => {
    const title = newPostTitle.trim()
    const content = newPostContent.trim()
    if (!title || !content) return
    const media = newPostMedia
    setNewPostTitle(""); setNewPostContent(""); setShowNewPost(false); setNewPostMedia(null)
    const optimistic: ForumPost = {
      id: `temp-${Date.now()}`, user_id: user.id, title, content,
      media_url: media?.url ?? null, media_type: media?.type ?? null,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setForumPosts(prev => [optimistic, ...prev])
    const { data } = await supabase.from("community_posts")
      .insert({ community_slug: slug, user_id: user.id, title, content, media_url: media?.url ?? null, media_type: media?.type ?? null })
      .select().single()
    if (data) setForumPosts(prev => prev.map(p => p.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : p))
  }

  const deletePost = async (id: string) => {
    setForumPosts(prev => prev.filter(p => p.id !== id))
    setSelectedPost(null)
    await supabase.from("community_posts").delete().eq("id", id)
  }

  const sendReply = async (postId: string) => {
    const content = replyInput.trim()
    if (!content && !replyMedia) return
    const media = replyMedia
    setReplyInput(""); setReplyMedia(null)
    const optimistic: ForumReply = {
      id: `temp-${Date.now()}`, post_id: postId, user_id: user.id, content: content || "",
      media_url: media?.url ?? null, media_type: media?.type ?? null,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setForumReplies(prev => [...prev, optimistic])
    const { data } = await supabase.from("community_post_replies")
      .insert({ post_id: postId, user_id: user.id, content: content || "", media_url: media?.url ?? null, media_type: media?.type ?? null })
      .select().single()
    if (data) setForumReplies(prev => prev.map(r => r.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : r))
  }

  const createNote = async () => {
    const title = newNoteTitle.trim()
    const content = newNoteContent.trim()
    if (!title || !content) return
    const media = newNoteMedia
    setNewNoteTitle(""); setNewNoteContent(""); setShowNewNote(false); setNewNoteMedia(null)
    const optimistic: Note = {
      id: `temp-${Date.now()}`, user_id: user.id, title, content,
      media_url: media?.url ?? null, media_type: media?.type ?? null,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setNotes(prev => [optimistic, ...prev])
    const { data } = await supabase.from("community_notes")
      .insert({ community_slug: slug, user_id: user.id, title, content, media_url: media?.url ?? null, media_type: media?.type ?? null })
      .select().single()
    if (data) setNotes(prev => prev.map(n => n.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : n))
  }

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setSelectedNote(null)
    await supabase.from("community_notes").delete().eq("id", id)
  }

  const addChannel = () => {
    if (!newChannelName.trim()) return
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: newChannelName.trim(),
      type: newChannelType,
      position: channels.length,
    }
    setChannels(prev => [...prev, newChannel])
    setNewChannelName("")
    setShowAddChannel(false)
    setActiveChannelId(newChannel.id)
  }

  const renameChannel = (id: string) => {
    if (!editingChannelName.trim()) return
    setChannels(prev => prev.map(c => c.id === id ? { ...c, name: editingChannelName.trim() } : c))
    setEditingChannelId(null)
    setEditingChannelName("")
  }

  const deleteChannel = (id: string) => {
    if (channels.length <= 1) return
    setChannels(prev => prev.filter(c => c.id !== id))
    if (activeChannelId === id) setActiveChannelId(channels[0].id)
  }

  const getRepliesForPost = useCallback((postId: string) => forumReplies.filter(r => r.post_id === postId), [forumReplies])

  const channelIcon = (type: Channel["type"]) => {
    if (type === "chat") return <Hash className="h-4 w-4" />
    if (type === "forum") return <MessageCircle className="h-4 w-4" />
    return <BookOpen className="h-4 w-4" />
  }

  // Settings Modal
  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="app-surface border app-border rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b app-border">
          <h2 className="text-lg font-bold app-text">Community Settings — {community.name}</h2>
          <button onClick={() => setSettingsOpen(false)} className="app-text-muted hover:opacity-80">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings sidebar */}
          <div className="w-44 flex-shrink-0 border-r app-border p-2 space-y-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "channels", label: "Channels" },
              { id: "members", label: "Members" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setSettingsTab(tab.id as any)}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  settingsTab === tab.id ? "bg-indigo-600 text-white" : "app-text-muted hover:opacity-80")}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">

            {/* OVERVIEW */}
            {settingsTab === "overview" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold app-text mb-1">Community Name</h3>
                  <input value={community.name} disabled
                    className="w-full app-input-bg app-text-muted border app-border rounded-xl px-4 py-2.5 text-sm opacity-60 cursor-not-allowed" />
                  <p className="text-xs app-text-muted mt-1">Community names cannot be changed.</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold app-text mb-1">Description</h3>
                  <textarea value={communityDesc} onChange={e => setCommunityDesc(e.target.value)} rows={3}
                    className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Describe this community..." />
                </div>
                <div>
                  <h3 className="text-sm font-semibold app-text mb-1">Rules</h3>
                  <textarea value={communityRules} onChange={e => setCommunityRules(e.target.value)} rows={4}
                    className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="1. Be respectful&#10;2. No spam&#10;3. Stay on topic" />
                </div>
                <button onClick={() => { setSavingSettings(true); setTimeout(() => setSavingSettings(false), 1000) }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium">
                  {savingSettings ? "Saved!" : "Save Changes"}
                </button>
              </div>
            )}

            {/* CHANNELS */}
            {settingsTab === "channels" && (
              <div className="space-y-3">
                <p className="text-sm app-text-muted">Add, rename, or delete channels. Each channel can be a chat, forum, or notes board.</p>
                <div className="space-y-2">
                  {channels.map(ch => (
                    <div key={ch.id} className="flex items-center gap-3 app-input-bg border app-border rounded-xl px-4 py-3">
                      <span className="app-text-muted">{channelIcon(ch.type)}</span>
                      {editingChannelId === ch.id ? (
                        <input autoFocus value={editingChannelName}
                          onChange={e => setEditingChannelName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") renameChannel(ch.id); if (e.key === "Escape") setEditingChannelId(null) }}
                          className="flex-1 bg-transparent app-text text-sm outline-none border-b border-indigo-500" />
                      ) : (
                        <span className="flex-1 text-sm app-text">{ch.name}</span>
                      )}
                      <span className="text-xs app-text-muted capitalize">{ch.type}</span>
                      <div className="flex gap-1">
                        {editingChannelId === ch.id ? (
                          <button onClick={() => renameChannel(ch.id)} className="text-green-400 hover:opacity-80 p-1">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => { setEditingChannelId(ch.id); setEditingChannelName(ch.name) }}
                            className="app-text-muted hover:opacity-80 p-1">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteChannel(ch.id)} disabled={channels.length <= 1}
                          className="text-red-400 hover:opacity-80 p-1 disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showAddChannel ? (
                  <div className="app-input-bg border app-border rounded-xl p-4 space-y-3">
                    <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                      placeholder="Channel name..."
                      className="w-full bg-transparent app-text text-sm outline-none border-b app-border pb-1" />
                    <div className="flex gap-2">
                      {(["chat", "forum", "notes"] as const).map(type => (
                        <button key={type} onClick={() => setNewChannelType(type)}
                          className={cn("px-3 py-1 rounded-full text-xs capitalize border transition-colors",
                            newChannelType === type ? "bg-indigo-600 text-white border-indigo-600" : "app-text-muted border-transparent app-surface")}>
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addChannel} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm">Add</button>
                      <button onClick={() => setShowAddChannel(false)} className="app-text-muted hover:opacity-80 px-4 py-1.5 rounded-lg text-sm border app-border">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddChannel(true)}
                    className="flex items-center gap-2 text-indigo-400 hover:opacity-80 text-sm">
                    <Plus className="h-4 w-4" /> Add Channel
                  </button>
                )}
              </div>
            )}

            {/* MEMBERS */}
            {settingsTab === "members" && (
              <div className="space-y-3">
                <p className="text-sm app-text-muted">View community members. To change roles, go to the Admin Panel.</p>
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 app-input-bg border app-border rounded-xl px-4 py-3">
                      <Avatar profile={member} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium app-text truncate">{member.full_name ?? "Student"}</p>
                          <BadgeIcon role={member.badge_role} />
                        </div>
                        <p className="text-xs app-text-muted">{member.badge_role ?? "Member"}</p>
                      </div>
                      <a href="/admin" className="text-xs text-indigo-400 hover:underline">
                        Manage
                      </a>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="app-text-muted text-sm text-center py-8">No members yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen flex-col app-bg app-text overflow-hidden">

      {settingsOpen && <SettingsModal />}

      {/* Top bar */}
      <header className="flex-shrink-0 app-surface border-b app-border px-4 h-14 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="app-text-muted hover:opacity-80">
            <ChevronLeft className="h-5 w-5" />
          </a>
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            {community.emoji ? <span className="text-lg">{community.emoji}</span> : <Hash className="h-4 w-4 text-indigo-500" />}
          </div>
          <div>
            <p className="font-semibold text-sm app-text leading-none">{community.name}</p>
            <p className="text-xs app-text-muted">
              {community.type === "public" ? "Public Community" : community.type === "program" ? "Program" : "Subject"} • {members.length} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canModerate && (
            <button onClick={() => setSettingsOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:opacity-80 app-text-muted"
              title="Community Settings">
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setMemberSidebarOpen(v => !v)} className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:opacity-80 app-text-muted">
            <Users className="h-4 w-4" />
          </button>
          <button onClick={() => setMobileSidebarOpen(v => !v)} className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:opacity-80 app-text-muted">
            <Users className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — channels */}
        <aside className="w-48 flex-shrink-0 app-surface border-r app-border flex flex-col hidden md:flex">
          <div className="p-3 border-b app-border flex items-center justify-between">
            <p className="text-xs app-text-muted uppercase tracking-wider font-semibold px-2">Channels</p>
            {canModerate && (
              <button onClick={() => { setSettingsOpen(true); setSettingsTab("channels") }}
                className="app-text-muted hover:text-indigo-400 transition-colors" title="Manage channels">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex-1 p-2 space-y-0.5">
            {channels.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannelId(ch.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeChannelId === ch.id ? "bg-indigo-600/20 text-indigo-400" : "app-text-muted hover:opacity-80"
                )}>
                {channelIcon(ch.type)}
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t app-border">
            <div className="flex items-center gap-2">
              <Avatar profile={profile} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs app-text truncate">{profile?.full_name ?? "You"}</p>
                {profile?.badge_role && <p className="text-xs text-indigo-400 truncate">{profile.badge_role}</p>}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 app-surface border-t app-border flex overflow-x-auto">
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannelId(ch.id)}
              className={cn("flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors min-w-0 px-1",
                activeChannelId === ch.id ? "text-indigo-400" : "app-text-muted")}>
              {channelIcon(ch.type)}
              <span className="truncate w-full text-center">{ch.name}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* CHAT */}
          {activeChannel?.type === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
                {chatMessages.length === 0 && (
                  <p className="app-text-muted text-center mt-20 text-sm">No messages yet. Start the conversation!</p>
                )}
                {chatMessages.map((msg, i) => {
                  const prevMsg = chatMessages[i - 1]
                  const sameUser = prevMsg?.user_id === msg.user_id
                  const canDelete = canModerate || msg.user_id === user.id
                  return (
                    <div key={msg.id} className={cn("flex gap-3 group", sameUser && "mt-0.5")}>
                      {!sameUser ? <Avatar profile={msg.profiles} size="sm" /> : <div className="w-8 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        {!sameUser && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-semibold app-text">{msg.profiles?.full_name ?? "Student"}</span>
                            <BadgeIcon role={msg.profiles?.badge_role} />
                            <span className="text-xs app-text-muted">{formatTime(msg.created_at)}</span>
                          </div>
                        )}
                        {msg.content && <p className={cn("text-sm app-text leading-relaxed break-words", msg.id.startsWith("temp-") && "opacity-60")}>{msg.content}</p>}
                        {msg.media_url && <MediaDisplay url={msg.media_url} type={msg.media_type ?? undefined} />}
                      </div>
                      {canDelete && (
                        <button onClick={() => deleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:opacity-80 p-1 flex-shrink-0 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
                <div ref={chatBottomRef} />
              </div>
              <div className="flex-shrink-0 p-3 app-surface border-t app-border mb-12 md:mb-0">
                {chatMedia && (
                  <div className="mb-2 pl-1">
                    <MediaAttachment current={chatMedia} onAttach={setChatMedia} onRemove={() => setChatMedia(null)} uploading={chatMediaUploading} setUploading={setChatMediaUploading} bucket="post-media" folder="community" />
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  {!chatMedia && <MediaAttachment current={null} onAttach={setChatMedia} onRemove={() => setChatMedia(null)} uploading={chatMediaUploading} setUploading={setChatMediaUploading} bucket="post-media" folder="community" />}
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                    placeholder={`Message #${activeChannel.name.toLowerCase()}`}
                    className="flex-1 app-input-bg app-text rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={sendChat} disabled={!chatInput.trim() && !chatMedia}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FORUM */}
          {activeChannel?.type === "forum" && (
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
              {selectedPost ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 app-text-muted hover:opacity-80 text-sm">
                      <ChevronLeft className="h-4 w-4" /> Back to Forum
                    </button>
                    {(canModerate || selectedPost.user_id === user.id) && (
                      <button onClick={() => deletePost(selectedPost.id)} className="flex items-center gap-2 text-red-400 hover:opacity-80 text-sm">
                        <Trash2 className="h-4 w-4" /> Delete Post
                      </button>
                    )}
                  </div>
                  <div className="app-surface rounded-xl p-5 border app-border mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar profile={selectedPost.profiles} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm app-text">{selectedPost.profiles?.full_name ?? "Student"}</p>
                          <BadgeIcon role={selectedPost.profiles?.badge_role} />
                        </div>
                        <p className="text-xs app-text-muted">{formatTime(selectedPost.created_at)}</p>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold app-text mb-2">{selectedPost.title}</h2>
                    <p className="text-sm app-text leading-relaxed">{selectedPost.content}</p>
                    {selectedPost.media_url && <MediaDisplay url={selectedPost.media_url} type={selectedPost.media_type ?? undefined} />}
                  </div>
                  <div className="space-y-3 mb-4">
                    {getRepliesForPost(selectedPost.id).map(reply => (
                      <div key={reply.id} className={cn("flex gap-3 group", reply.id.startsWith("temp-") && "opacity-60")}>
                        <Avatar profile={reply.profiles} size="sm" />
                        <div className="flex-1 app-input-bg rounded-xl px-4 py-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm font-semibold app-text">{reply.profiles?.full_name ?? "Student"}</span>
                            <BadgeIcon role={reply.profiles?.badge_role} />
                            <span className="text-xs app-text-muted">{formatTime(reply.created_at)}</span>
                          </div>
                          {reply.content && <p className="text-sm app-text">{reply.content}</p>}
                          {reply.media_url && <MediaDisplay url={reply.media_url} type={reply.media_type ?? undefined} />}
                        </div>
                        {(canModerate || reply.user_id === user.id) && (
                          <button onClick={async () => {
                            setForumReplies(prev => prev.filter(r => r.id !== reply.id))
                            await supabase.from("community_post_replies").delete().eq("id", reply.id)
                          }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:opacity-80 p-1 flex-shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {getRepliesForPost(selectedPost.id).length === 0 && (
                      <p className="app-text-muted text-sm text-center py-4">No replies yet. Be the first!</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-start">
                    <Avatar profile={profile} size="sm" />
                    <div className="flex-1">
                      <div className="flex gap-2 items-center">
                        <input value={replyInput} onChange={e => setReplyInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(selectedPost.id) } }}
                          placeholder="Write a reply..."
                          className="flex-1 app-input-bg app-text rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={() => sendReply(selectedPost.id)} disabled={!replyInput.trim() && !replyMedia}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm">
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      <MediaAttachment current={replyMedia} onAttach={setReplyMedia} onRemove={() => setReplyMedia(null)} uploading={replyMediaUploading} setUploading={setReplyMediaUploading} bucket="post-media" folder="community" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold app-text">{activeChannel.name}</h2>
                    <button onClick={() => setShowNewPost(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" /> New Post
                    </button>
                  </div>
                  {showNewPost && (
                    <div className="app-surface rounded-xl p-4 border app-border mb-4">
                      <p className="font-semibold app-text mb-3">New Post</p>
                      <input value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} placeholder="Title"
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2" />
                      <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="What's on your mind?" rows={4}
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2 resize-none" />
                      <MediaAttachment current={newPostMedia} onAttach={setNewPostMedia} onRemove={() => setNewPostMedia(null)} uploading={newPostMediaUploading} setUploading={setNewPostMediaUploading} bucket="post-media" folder="community" />
                      <div className="flex gap-2 justify-end mt-3">
                        <button onClick={() => setShowNewPost(false)} className="text-sm px-4 py-2 rounded-lg border app-border app-text-muted hover:opacity-80">Cancel</button>
                        <button onClick={createPost} disabled={!newPostTitle.trim() || !newPostContent.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Post</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {forumPosts.map(post => (
                      <div key={post.id} className={cn("app-surface rounded-xl p-4 border app-border cursor-pointer hover:border-indigo-500/50 transition-all group", post.id.startsWith("temp-") && "opacity-60")}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1" onClick={() => setSelectedPost(post)}>
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar profile={post.profiles} size="sm" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-semibold app-text">{post.profiles?.full_name ?? "Student"}</p>
                                  <BadgeIcon role={post.profiles?.badge_role} />
                                </div>
                                <p className="text-xs app-text-muted">{formatTime(post.created_at)}</p>
                              </div>
                            </div>
                            <h3 className="font-semibold app-text mb-1">{post.title}</h3>
                            <p className="text-sm app-text-muted line-clamp-2">{post.content}</p>
                            <p className="text-xs app-text-muted mt-2">{getRepliesForPost(post.id).length} replies</p>
                          </div>
                          {(canModerate || post.user_id === user.id) && (
                            <button onClick={() => deletePost(post.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:opacity-80 p-1 ml-2 flex-shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {forumPosts.length === 0 && !showNewPost && (
                      <p className="app-text-muted text-center py-12 text-sm">No posts yet. Start a discussion!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {activeChannel?.type === "notes" && (
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
              {selectedNote ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setSelectedNote(null)} className="flex items-center gap-2 app-text-muted hover:opacity-80 text-sm">
                      <ChevronLeft className="h-4 w-4" /> Back to Notes
                    </button>
                    {(canModerate || selectedNote.user_id === user.id) && (
                      <button onClick={() => deleteNote(selectedNote.id)} className="flex items-center gap-2 text-red-400 hover:opacity-80 text-sm">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    )}
                  </div>
                  <div className="app-surface rounded-xl p-5 border app-border">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar profile={selectedNote.profiles} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm app-text">{selectedNote.profiles?.full_name ?? "Student"}</p>
                          <BadgeIcon role={selectedNote.profiles?.badge_role} />
                        </div>
                        <p className="text-xs app-text-muted">{formatTime(selectedNote.created_at)}</p>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold app-text mb-4">{selectedNote.title}</h2>
                    <p className="text-sm app-text leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
                    {selectedNote.media_url && <MediaDisplay url={selectedNote.media_url} type={selectedNote.media_type ?? undefined} />}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold app-text">{activeChannel.name}</h2>
                    <button onClick={() => setShowNewNote(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Share Notes
                    </button>
                  </div>
                  {showNewNote && (
                    <div className="app-surface rounded-xl p-4 border app-border mb-4">
                      <p className="font-semibold app-text mb-3">Share Notes</p>
                      <input value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} placeholder="Title (e.g. Chapter 3 Summary)"
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2" />
                      <textarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="Paste your notes here..." rows={8}
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2 resize-none font-mono" />
                      <MediaAttachment current={newNoteMedia} onAttach={setNewNoteMedia} onRemove={() => setNewNoteMedia(null)} uploading={newNoteMediaUploading} setUploading={setNewNoteMediaUploading} bucket="post-media" folder="community" />
                      <div className="flex gap-2 justify-end mt-3">
                        <button onClick={() => setShowNewNote(false)} className="text-sm px-4 py-2 rounded-lg border app-border app-text-muted hover:opacity-80">Cancel</button>
                        <button onClick={createNote} disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Share</button>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {notes.map(note => (
                      <div key={note.id} className={cn("app-surface rounded-xl p-4 border app-border cursor-pointer hover:border-indigo-500/50 transition-all group", note.id.startsWith("temp-") && "opacity-60")}>
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0" onClick={() => setSelectedNote(note)}>
                            <h3 className="font-semibold app-text text-sm truncate">{note.title}</h3>
                            <p className="text-xs app-text-muted mt-0.5">{note.profiles?.full_name ?? "Student"} • {formatTime(note.created_at)}</p>
                            <p className="text-xs app-text-muted mt-1 line-clamp-2">{note.content}</p>
                          </div>
                          {(canModerate || note.user_id === user.id) && (
                            <button onClick={() => deleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:opacity-80 p-1 flex-shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {notes.length === 0 && !showNewNote && (
                      <p className="app-text-muted text-center py-12 text-sm col-span-2">No notes shared yet. Be the first!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar — members (desktop) */}
        {memberSidebarOpen && (
          <aside className="hidden md:flex w-52 flex-shrink-0 app-surface border-l app-border flex-col">
            <div className="p-3 border-b app-border">
              <p className="text-xs app-text-muted uppercase tracking-wider font-semibold">Members — {members.length}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {members.map(member => (
                <a key={member.id} href={`/user/${member.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80 transition-colors">
                  <div className="relative">
                    <Avatar profile={member} size="sm" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-zinc-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm app-text truncate">{member.full_name ?? "Student"}</p>
                    {member.badge_role && <p className="text-xs text-indigo-400 truncate">{member.badge_role}</p>}
                  </div>
                  <BadgeIcon role={member.badge_role} />
                </a>
              ))}
            </div>
          </aside>
        )}

        {/* Mobile members overlay */}
        {mobileSidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
            <aside className="fixed inset-y-0 right-0 w-64 z-60 app-surface border-l app-border flex flex-col md:hidden">
              <div className="p-3 border-b app-border flex items-center justify-between">
                <p className="text-xs app-text-muted uppercase tracking-wider font-semibold">Members — {members.length}</p>
                <button onClick={() => setMobileSidebarOpen(false)} className="app-text-muted hover:opacity-80">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {members.map(member => (
                  <a key={member.id} href={`/user/${member.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80 transition-colors">
                    <div className="relative">
                      <Avatar profile={member} size="sm" />
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-zinc-900" />
                    </div>
                    <p className="text-sm app-text truncate">{member.full_name ?? "Student"}</p>
                    <BadgeIcon role={member.badge_role} />
                  </a>
                ))}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
