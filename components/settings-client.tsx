"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Bell, User, Lock, ChevronLeft, Check, Moon, Sun,
  Shield, Trash2, Eye, EyeOff, Heart, MessageCircle,
  UserPlus, FileText, Save
} from "lucide-react"
import { cn } from "@/lib/utils"

const supabase = createClient()

interface Profile {
  id: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  role: string | null
  badge_role: string | null
}

interface NotifSettings {
  user_id?: string
  likes: boolean
  comments: boolean
  messages: boolean
  friend_requests: boolean
  new_posts_from_friends: boolean
  community_posts: boolean
}

interface SettingsClientProps {
  user: { id: string; email: string }
  profile: Profile | null
  notifSettings: NotifSettings | null
}

const defaultNotifSettings: NotifSettings = {
  likes: true,
  comments: true,
  messages: true,
  friend_requests: true,
  new_posts_from_friends: true,
  community_posts: false,
}

type SettingsTab = "profile" | "notifications" | "privacy" | "account"

export default function SettingsClient({ user, profile, notifSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [bio, setBio] = useState(profile?.bio ?? "")

  // Notification state
  const [notifs, setNotifs] = useState<NotifSettings>(notifSettings ?? defaultNotifSettings)

  // Privacy state
  const [showEmail, setShowEmail] = useState(false)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveProfile = async () => {
    setSaving(true)
    await supabase
      .from("profiles")
      .update({ full_name: fullName, bio })
      .eq("id", user.id)
    setSaving(false)
    showSaved()
  }

  const saveNotifications = async () => {
    setSaving(true)
    const { data: existing } = await supabase
      .from("notification_settings")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from("notification_settings")
        .update({ ...notifs })
        .eq("user_id", user.id)
    } else {
      await supabase
        .from("notification_settings")
        .insert({ user_id: user.id, ...notifs })
    }
    setSaving(false)
    showSaved()
  }

  const toggleNotif = (key: keyof Omit<NotifSettings, "user_id">) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "privacy", label: "Privacy", icon: <Eye className="h-4 w-4" /> },
    { id: "account", label: "Account", icon: <Shield className="h-4 w-4" /> },
  ]

  const notifOptions: { key: keyof Omit<NotifSettings, "user_id">; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: "likes", label: "Likes", desc: "When someone likes your post", icon: <Heart className="h-4 w-4 text-red-400" /> },
    { key: "comments", label: "Comments", desc: "When someone replies to your post", icon: <MessageCircle className="h-4 w-4 text-blue-400" /> },
    { key: "messages", label: "Messages", desc: "When you receive a direct message", icon: <MessageCircle className="h-4 w-4 text-indigo-400" /> },
    { key: "friend_requests", label: "Friend Requests", desc: "When someone sends you a connection request", icon: <UserPlus className="h-4 w-4 text-green-400" /> },
    { key: "new_posts_from_friends", label: "Posts from Friends", desc: "When your friends share something new", icon: <FileText className="h-4 w-4 text-yellow-400" /> },
    { key: "community_posts", label: "Community Posts", desc: "New posts in your communities", icon: <FileText className="h-4 w-4 text-purple-400" /> },
  ]

  return (
    <div className="min-h-screen app-bg app-text">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b app-border app-surface shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <a href="/dashboard" className="flex items-center gap-2 app-text-muted hover:opacity-80 transition-opacity">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:block">Back</span>
          </a>
          <h1 className="text-lg font-bold app-text">Settings</h1>
          {saved && (
            <div className="ml-auto flex items-center gap-2 text-green-400 text-sm font-medium animate-pulse">
              <Check className="h-4 w-4" />
              Saved!
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs */}
        <aside className="w-full md:w-56 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left",
                  activeTab === id
                    ? "bg-indigo-600 text-white"
                    : "app-text-muted hover:opacity-80 app-surface border app-border"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="app-surface rounded-2xl border app-border p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold app-text mb-1">Profile</h2>
                <p className="text-sm app-text-muted">Update your name and bio visible to other students.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold overflow-hidden ring-2 ring-zinc-700 flex-shrink-0">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <img src="/default-avatar.png" alt="" className="w-full h-full object-cover" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium app-text">Profile photo</p>
                  <p className="text-xs app-text-muted mt-0.5">Managed via your Google account</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium app-text mb-1.5">Full Name</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium app-text mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Tell others a bit about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium app-text mb-1.5">Email</label>
                  <input
                    value={user.email}
                    disabled
                    className="w-full app-input-bg app-text-muted border app-border rounded-xl px-4 py-2.5 text-sm outline-none opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs app-text-muted mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium app-text mb-1.5">Program</label>
                  <input
                    value={profile?.role ?? "Not set"}
                    disabled
                    className="w-full app-input-bg app-text-muted border app-border rounded-xl px-4 py-2.5 text-sm outline-none opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs app-text-muted mt-1">Change your program in your <a href="/profile" className="text-indigo-400 hover:underline">profile page</a>.</p>
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="app-surface rounded-2xl border app-border p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold app-text mb-1">Notifications</h2>
                <p className="text-sm app-text-muted">Choose what activity sends you a notification.</p>
              </div>

              <div className="space-y-2">
                {notifOptions.map(({ key, label, desc, icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 app-input-bg rounded-xl border app-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg app-surface border app-border flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium app-text">{label}</p>
                        <p className="text-xs app-text-muted">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleNotif(key)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                        notifs[key] ? "bg-indigo-600" : "bg-zinc-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                          notifs[key] ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={saveNotifications}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div className="app-surface rounded-2xl border app-border p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold app-text mb-1">Privacy</h2>
                <p className="text-sm app-text-muted">Control what others can see about you.</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Profile visible to all students", desc: "Your profile can be found and viewed by any Sunway Connect user", defaultOn: true },
                  { label: "Show program/role on profile", desc: "Display your program (e.g. CIMP, A-Level) publicly", defaultOn: true },
                  { label: "Allow direct messages from non-friends", desc: "Students you haven't connected with can still message you", defaultOn: false },
                ].map(({ label, desc, defaultOn }) => {
                  const [on, setOn] = useState(defaultOn)
                  return (
                    <div key={label} className="flex items-center justify-between p-4 app-input-bg rounded-xl border app-border">
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-medium app-text">{label}</p>
                        <p className="text-xs app-text-muted mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setOn(v => !v)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                          on ? "bg-indigo-600" : "bg-zinc-600"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                          on ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 border-t app-border">
                <p className="text-xs app-text-muted">
                  Privacy settings are saved automatically. Sunway Connect only allows verified Sunway email addresses.
                </p>
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div className="app-surface rounded-2xl border app-border p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold app-text mb-1">Account</h2>
                  <p className="text-sm app-text-muted">Manage your account details.</p>
                </div>

                <div className="p-4 app-input-bg rounded-xl border app-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm app-text-muted">Email</span>
                    <span className="text-sm app-text font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm app-text-muted">Badge</span>
                    <span className="text-sm app-text font-medium">{profile?.badge_role ?? "Student"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm app-text-muted">Program</span>
                    <span className="text-sm app-text font-medium">{profile?.role ?? "Not set"}</span>
                  </div>
                </div>
              </div>

              <div className="app-surface rounded-2xl border border-red-500/20 p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-red-400 mb-1">Danger Zone</h2>
                  <p className="text-sm app-text-muted">These actions are permanent and cannot be undone.</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                      alert("Please contact an admin to delete your account.")
                    }
                  }}
                  className="flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
