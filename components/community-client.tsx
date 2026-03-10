"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Send, Hash, MessageCircle, BookOpen, Users, X, Plus, ChevronLeft, FileText, Menu } from "lucide-react"

const supabase = createClient()

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
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface ForumReply {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface ChatMessage {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface Note {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null; badge_role: string | null } | null
}

interface CommunityClientProps {
  user: { id: string; email: string }
  profile: Profile | null
  community: { name: string; type: "program" | "subject" }
  slug: string
  members: Profile[]
  forumPosts: ForumPost[]
  forumReplies: ForumReply[]
  chatMessages: ChatMessage[]
  notes: Note[]
}

const Avatar = ({ profile, size = "sm" }: { profile: { full_name?: string | null; avatar_url?: string | null } | null; size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-base", lg: "w-12 h-12 text-lg" }
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "S"
  return (
    <div className={cn("rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0", sizes[size])}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initial}
    </div>
  )
}

export default function CommunityClient({
  user, profile, community, slug, members: initialMembers,
  forumPosts: initialForumPosts, forumReplies: initialForumReplies,
  chatMessages: initialChatMessages, notes: initialNotes,
}: CommunityClientProps) {
  const [activeSection, setActiveSection] = useState<"forum" | "chat" | "notes">("chat")
  const [memberSidebarOpen, setMemberSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages)
  const [chatInput, setChatInput] = useState("")
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Forum state
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(initialForumPosts)
  const [forumReplies, setForumReplies] = useState<ForumReply[]>(initialForumReplies)
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [replyInput, setReplyInput] = useState("")

  // Notes state
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  const initial = profile?.full_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Real-time chat
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

  // Send chat message
  const sendChat = async () => {
    const content = chatInput.trim()
    if (!content) return
    setChatInput("")
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`, user_id: user.id, content,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setChatMessages(prev => [...prev, optimistic])
    const { data } = await supabase.from("community_messages")
      .insert({ community_slug: slug, user_id: user.id, content })
      .select().single()
    if (data) setChatMessages(prev => prev.map(m => m.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : m))
  }

  // Create forum post
  const createPost = async () => {
    const title = newPostTitle.trim()
    const content = newPostContent.trim()
    if (!title || !content) return
    setNewPostTitle(""); setNewPostContent(""); setShowNewPost(false)
    const optimistic: ForumPost = {
      id: `temp-${Date.now()}`, user_id: user.id, title, content,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setForumPosts(prev => [optimistic, ...prev])
    const { data } = await supabase.from("community_posts")
      .insert({ community_slug: slug, user_id: user.id, title, content })
      .select().single()
    if (data) setForumPosts(prev => prev.map(p => p.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : p))
  }

  // Reply to forum post
  const sendReply = async (postId: string) => {
    const content = replyInput.trim()
    if (!content) return
    setReplyInput("")
    const optimistic: ForumReply = {
      id: `temp-${Date.now()}`, post_id: postId, user_id: user.id, content,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setForumReplies(prev => [...prev, optimistic])
    const { data } = await supabase.from("community_post_replies")
      .insert({ post_id: postId, user_id: user.id, content })
      .select().single()
    if (data) setForumReplies(prev => prev.map(r => r.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : r))
  }

  // Create note
  const createNote = async () => {
    const title = newNoteTitle.trim()
    const content = newNoteContent.trim()
    if (!title || !content) return
    setNewNoteTitle(""); setNewNoteContent(""); setShowNewNote(false)
    const optimistic: Note = {
      id: `temp-${Date.now()}`, user_id: user.id, title, content,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, badge_role: profile?.badge_role ?? null }
    }
    setNotes(prev => [optimistic, ...prev])
    const { data } = await supabase.from("community_notes")
      .insert({ community_slug: slug, user_id: user.id, title, content })
      .select().single()
    if (data) setNotes(prev => prev.map(n => n.id === optimistic.id ? { ...data, profiles: optimistic.profiles } : n))
  }

  const getRepliesForPost = useCallback((postId: string) => forumReplies.filter(r => r.post_id === postId), [forumReplies])

  const sections = [
    { id: "chat" as const, icon: <Hash className="h-4 w-4" />, label: "General Chat" },
    { id: "forum" as const, icon: <MessageCircle className="h-4 w-4" />, label: "Forum" },
    { id: "notes" as const, icon: <BookOpen className="h-4 w-4" />, label: "Notes" },
  ]

  return (
    <div className="flex h-screen flex-col app-bg app-text overflow-hidden">

      {/* Top bar */}
      <header className="flex-shrink-0 app-surface border-b app-border px-4 h-14 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="app-text-muted hover:opacity-80">
            <ChevronLeft className="h-5 w-5" />
          </a>
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Hash className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-sm app-text leading-none">{community.name}</p>
            <p className="text-xs app-text-muted">{community.type === "program" ? "Program" : "Subject"} • {initialMembers.length} members</p>
          </div>
        </div>
        <button onClick={() => setMemberSidebarOpen(v => !v)}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:opacity-80 app-text-muted">
          <Users className="h-4 w-4" />
        </button>
        <button onClick={() => setMobileSidebarOpen(v => !v)}
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:opacity-80 app-text-muted">
          <Users className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — sections */}
        <aside className="w-48 flex-shrink-0 app-surface border-r app-border flex flex-col hidden md:flex">
          <div className="p-3 border-b app-border">
            <p className="text-xs app-text-muted uppercase tracking-wider font-semibold px-2">Channels</p>
          </div>
          <div className="flex-1 p-2 space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeSection === s.id ? "bg-indigo-600/20 text-indigo-400" : "app-text-muted hover:opacity-80 hover:app-surface"
                )}>
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
          <div className="p-3 border-t app-border">
            <div className="flex items-center gap-2">
              <Avatar profile={profile} size="sm" />
              <p className="text-xs app-text truncate">{profile?.full_name ?? "You"}</p>
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav for sections */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 app-surface border-t app-border flex">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                activeSection === s.id ? "text-indigo-400" : "app-text-muted"
              )}>
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* CHAT SECTION */}
          {activeSection === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
                {chatMessages.length === 0 && (
                  <p className="app-text-muted text-center mt-20 text-sm">No messages yet. Start the conversation!</p>
                )}
                {chatMessages.map((msg, i) => {
                  const prevMsg = chatMessages[i - 1]
                  const sameUser = prevMsg?.user_id === msg.user_id
                  return (
                    <div key={msg.id} className={cn("flex gap-3", sameUser && "mt-0.5")}>
                      {!sameUser
                        ? <Avatar profile={msg.profiles} size="sm" />
                        : <div className="w-8 flex-shrink-0" />
                      }
                      <div>
                        {!sameUser && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold app-text">{msg.profiles?.full_name ?? "Student"}</span>
                            <span className="text-xs app-text-muted">{formatTime(msg.created_at)}</span>
                          </div>
                        )}
                        <p className={cn("text-sm app-text leading-relaxed break-words", msg.id.startsWith("temp-") && "opacity-60")}>{msg.content}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatBottomRef} />
              </div>
              <div className="flex-shrink-0 p-3 app-surface border-t app-border mb-12 md:mb-0">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                    placeholder={`Message #${community.name.toLowerCase()}`}
                    className="flex-1 app-input-bg app-text rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={sendChat} disabled={!chatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FORUM SECTION */}
          {activeSection === "forum" && (
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
              {selectedPost ? (
                <div>
                  <button onClick={() => setSelectedPost(null)}
                    className="flex items-center gap-2 app-text-muted hover:opacity-80 text-sm mb-4">
                    <ChevronLeft className="h-4 w-4" /> Back to Forum
                  </button>
                  <div className="app-surface rounded-xl p-5 border app-border mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar profile={selectedPost.profiles} size="sm" />
                      <div>
                        <p className="font-semibold text-sm app-text">{selectedPost.profiles?.full_name ?? "Student"}</p>
                        <p className="text-xs app-text-muted">{formatTime(selectedPost.created_at)}</p>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold app-text mb-2">{selectedPost.title}</h2>
                    <p className="text-sm app-text leading-relaxed">{selectedPost.content}</p>
                  </div>
                  <div className="space-y-3 mb-4">
                    {getRepliesForPost(selectedPost.id).map(reply => (
                      <div key={reply.id} className={cn("flex gap-3", reply.id.startsWith("temp-") && "opacity-60")}>
                        <Avatar profile={reply.profiles} size="sm" />
                        <div className="flex-1 app-input-bg rounded-xl px-4 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold app-text">{reply.profiles?.full_name ?? "Student"}</span>
                            <span className="text-xs app-text-muted">{formatTime(reply.created_at)}</span>
                          </div>
                          <p className="text-sm app-text">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                    {getRepliesForPost(selectedPost.id).length === 0 && (
                      <p className="app-text-muted text-sm text-center py-4">No replies yet. Be the first!</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Avatar profile={profile} size="sm" />
                    <input
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(selectedPost.id) } }}
                      placeholder="Write a reply..."
                      className="flex-1 app-input-bg app-text rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => sendReply(selectedPost.id)} disabled={!replyInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold app-text">Forum</h2>
                    <button onClick={() => setShowNewPost(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" /> New Post
                    </button>
                  </div>

                  {showNewPost && (
                    <div className="app-surface rounded-xl p-4 border app-border mb-4">
                      <p className="font-semibold app-text mb-3">New Post</p>
                      <input
                        value={newPostTitle}
                        onChange={e => setNewPostTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                      />
                      <textarea
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        placeholder="What's on your mind?"
                        rows={4}
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3 resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowNewPost(false)}
                          className="text-sm px-4 py-2 rounded-lg border app-border app-text-muted hover:opacity-80">
                          Cancel
                        </button>
                        <button onClick={createPost} disabled={!newPostTitle.trim() || !newPostContent.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {forumPosts.map(post => (
                      <div key={post.id} onClick={() => setSelectedPost(post)}
                        className={cn("app-surface rounded-xl p-4 border app-border cursor-pointer hover:border-indigo-500/50 transition-all", post.id.startsWith("temp-") && "opacity-60")}>
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar profile={post.profiles} size="sm" />
                          <div>
                            <p className="text-sm font-semibold app-text">{post.profiles?.full_name ?? "Student"}</p>
                            <p className="text-xs app-text-muted">{formatTime(post.created_at)}</p>
                          </div>
                        </div>
                        <h3 className="font-semibold app-text mb-1">{post.title}</h3>
                        <p className="text-sm app-text-muted line-clamp-2">{post.content}</p>
                        <p className="text-xs app-text-muted mt-2">{getRepliesForPost(post.id).length} replies</p>
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

          {/* NOTES SECTION */}
          {activeSection === "notes" && (
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
              {selectedNote ? (
                <div>
                  <button onClick={() => setSelectedNote(null)}
                    className="flex items-center gap-2 app-text-muted hover:opacity-80 text-sm mb-4">
                    <ChevronLeft className="h-4 w-4" /> Back to Notes
                  </button>
                  <div className="app-surface rounded-xl p-5 border app-border">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar profile={selectedNote.profiles} size="sm" />
                      <div>
                        <p className="font-semibold text-sm app-text">{selectedNote.profiles?.full_name ?? "Student"}</p>
                        <p className="text-xs app-text-muted">{formatTime(selectedNote.created_at)}</p>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold app-text mb-4">{selectedNote.title}</h2>
                    <p className="text-sm app-text leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold app-text">Shared Notes</h2>
                    <button onClick={() => setShowNewNote(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Share Notes
                    </button>
                  </div>

                  {showNewNote && (
                    <div className="app-surface rounded-xl p-4 border app-border mb-4">
                      <p className="font-semibold app-text mb-3">Share Notes</p>
                      <input
                        value={newNoteTitle}
                        onChange={e => setNewNoteTitle(e.target.value)}
                        placeholder="Title (e.g. Chapter 3 Summary)"
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                      />
                      <textarea
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        placeholder="Paste your notes here..."
                        rows={8}
                        className="w-full app-input-bg app-text rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3 resize-none font-mono"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowNewNote(false)}
                          className="text-sm px-4 py-2 rounded-lg border app-border app-text-muted hover:opacity-80">
                          Cancel
                        </button>
                        <button onClick={createNote} disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
                          Share
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {notes.map(note => (
                      <div key={note.id} onClick={() => setSelectedNote(note)}
                        className={cn("app-surface rounded-xl p-4 border app-border cursor-pointer hover:border-indigo-500/50 transition-all", note.id.startsWith("temp-") && "opacity-60")}>
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold app-text text-sm truncate">{note.title}</h3>
                            <p className="text-xs app-text-muted mt-0.5">{note.profiles?.full_name ?? "Student"} • {formatTime(note.created_at)}</p>
                            <p className="text-xs app-text-muted mt-1 line-clamp-2">{note.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notes.length === 0 && !showNewNote && (
                      <p className="app-text-muted text-center py-12 text-sm col-span-2">No notes shared yet. Be the first to share!</p>
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
              <p className="text-xs app-text-muted uppercase tracking-wider font-semibold">Members — {initialMembers.length}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {initialMembers.map(member => (
                <a key={member.id} href={`/user/${member.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80 transition-colors">
                  <div className="relative">
                    <Avatar profile={member} size="sm" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-zinc-900" />
                  </div>
                  <p className="text-sm app-text truncate">{member.full_name ?? "Student"}</p>
                </a>
              ))}
            </div>
          </aside>
        )}

        {/* Mobile members sidebar overlay */}
        {mobileSidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
            <aside className="fixed inset-y-0 right-0 w-64 z-60 app-surface border-l app-border flex flex-col md:hidden">
              <div className="p-3 border-b app-border flex items-center justify-between">
                <p className="text-xs app-text-muted uppercase tracking-wider font-semibold">Members — {initialMembers.length}</p>
                <button onClick={() => setMobileSidebarOpen(false)} className="app-text-muted hover:opacity-80">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {initialMembers.map(member => (
                  <a key={member.id} href={`/user/${member.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80 transition-colors">
                    <div className="relative">
                      <Avatar profile={member} size="sm" />
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-zinc-900" />
                    </div>
                    <p className="text-sm app-text truncate">{member.full_name ?? "Student"}</p>
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