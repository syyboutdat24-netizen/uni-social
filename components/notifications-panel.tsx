"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, Heart, MessageCircle, UserPlus, FileText, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const supabase = createClient()

export interface Notification {
  id: string
  user_id: string
  type: "like" | "comment" | "message" | "friend_request" | "new_post"
  message: string
  from_user_id: string | null
  post_id: string | null
  read: boolean
  created_at: string
  from_profile?: { full_name: string | null; avatar_url: string | null } | null
}

const formatTime = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const notifIcon = (type: Notification["type"]) => {
  switch (type) {
    case "like": return <Heart className="h-3.5 w-3.5 text-red-400" />
    case "comment": return <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
    case "message": return <MessageCircle className="h-3.5 w-3.5 text-indigo-400" />
    case "friend_request": return <UserPlus className="h-3.5 w-3.5 text-green-400" />
    case "new_post": return <FileText className="h-3.5 w-3.5 text-yellow-400" />
  }
}

interface NotificationsPanelProps {
  userId: string
}

export default function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const hasUnread = unreadCount > 0

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Fetch notifications when opened
  const fetchNotifications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) {
      // Fetch from_profile for each notification that has from_user_id
      const withProfiles = await Promise.all(
        data.map(async (n: Notification) => {
          if (!n.from_user_id) return n
          const { data: p } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", n.from_user_id)
            .maybeSingle()
          return { ...n, from_profile: p }
        })
      )
      setNotifications(withProfiles)
    }
    setLoading(false)
  }

  // Real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const n = payload.new as Notification
          // Fetch the from_profile
          let from_profile = null
          if (n.from_user_id) {
            const { data: p } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", n.from_user_id)
              .maybeSingle()
            from_profile = p
          }
          setNotifications(prev => [{ ...n, from_profile }, ...prev])
        }
      )
      .subscribe()

    // Initial count fetch (just to show red dot on load)
    supabase
      .from("notifications")
      .select("id, read")
      .eq("user_id", userId)
      .eq("read", false)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Just set minimal data so dot shows
          setNotifications(prev => prev.length === 0 ? data.map(d => ({ ...d } as Notification)) : prev)
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open) fetchNotifications()
  }

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const getLink = (n: Notification) => {
    if (n.type === "message") return `/messages/${n.from_user_id}`
    if (n.type === "friend_request") return `/dashboard`
    if (n.post_id) return `/dashboard`
    return `/dashboard`
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 app-text-muted"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-900 animate-pulse" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 app-surface border app-border rounded-2xl shadow-xl shadow-black/30 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b app-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm app-text">Notifications</h3>
              {hasUnread && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasUnread && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:opacity-80 px-2 py-1 rounded-lg flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="app-text-muted hover:opacity-80 p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-sm app-text-muted">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 app-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-sm app-text-muted">No notifications yet</p>
              </div>
            )}
            {!loading && notifications.filter(n => n.message).map((n) => (
              <a
                key={n.id}
                href={getLink(n)}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:opacity-80 transition-opacity border-b app-border last:border-b-0",
                  !n.read && "bg-indigo-500/5"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center text-sm font-bold">
                    {n.from_profile?.avatar_url
                      ? <img src={n.from_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <img src="/default-avatar.png" alt="" className="w-full h-full object-cover" />
                    }
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full app-surface border app-border flex items-center justify-center">
                    {notifIcon(n.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm app-text leading-snug">{n.message}</p>
                  <p className="text-xs app-text-muted mt-0.5">{formatTime(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                )}
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t app-border">
            <a href="/settings?tab=notifications" className="text-xs text-indigo-400 hover:opacity-80">
              Manage notification settings →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
