"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Bell, User, Lock, ChevronLeft, Check, Shield, Trash2,
  Eye, Heart, MessageCircle, UserPlus, FileText, Save,
  Instagram, Camera, X, Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PUBLIC_COMMUNITIES } from "@/lib/communities"

const supabase = createClient()

const PROFILE_THEMES = [
  { id: "default", label: "Default", from: "from-indigo-900/50", to: "to-zinc-800" },
  { id: "ocean", label: "Ocean", from: "from-blue-900/60", to: "to-cyan-800/60" },
  { id: "sunset", label: "Sunset", from: "from-orange-900/60", to: "to-pink-800/60" },
  { id: "forest", label: "Forest", from: "from-green-900/60", to: "to-emerald-800/60" },
  { id: "galaxy", label: "Galaxy", from: "from-purple-900/60", to: "to-indigo-800/60" },
  { id: "fire", label: "Fire", from: "from-red-900/60", to: "to-orange-800/60" },
  { id: "midnight", label: "Midnight", from: "from-zinc-900", to: "to-zinc-700" },
  { id: "rose", label: "Rose", from: "from-rose-900/60", to: "to-pink-700/60" },
]

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "@username", icon: "📷" },
  { key: "snapchat", label: "Snapchat", placeholder: "@username", icon: "👻" },
  { key: "twitter", label: "Twitter / X", placeholder: "@username", icon: "🐦" },
  { key: "tiktok", label: "TikTok", placeholder: "@username", icon: "🎵" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/...", icon: "💼" },
  { key: "github", label: "GitHub", placeholder: "@username", icon: "💻" },
  { key: "youtube", label: "YouTube", placeholder: "channel name", icon: "▶️" },
  { key: "discord", label: "Discord", placeholder: "username#0000", icon: "🎮" },
]

const HOBBY_OPTIONS = PUBLIC_COMMUNITIES.map(c => ({ value: c.slug, label: `${c.emoji} ${c.name}` }))

interface Profile {
  id: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  role: string | null
  badge_role: string | null
  socials?: Record<string, string> | null
  hobbies?: string[] | null
  profile_theme?: string | null
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
  likes: true, comments: true, messages: true,
  friend_requests: true, new_posts_from_friends: true, community_posts: false,
}

type SettingsTab = "profile" | "notifications" | "privacy" | "account"

export default function SettingsClient({ user, profile, notifSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [bio, setBio] = useState(profile?.bio ?? "")
  const [role, setRole] = useState(profile?.role ?? "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [socials, setSocials] = useState<Record<string, string>>(
    (profile?.socials as Record<string, string>) ?? {}
  )
  const [hobbies, setHobbies] = useState<string[]>(profile?.hobbies ?? [])
  const [theme, setTheme] = useState(profile?.profile_theme ?? "default")
  const [hobbySearch, setHobbySearch] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Notification state
  const [notifs, setNotifs] = useState<NotifSettings>(notifSettings ?? defaultNotifSettings)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const ext = file.name.split(".").pop()
    const path = `avatars/${user.id}.${ext}`
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })
    if (error) {
      console.error("Upload error:", error.message)
      setAvatarUploading(false)
      return
    }
    if (data) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path)
      const newUrl = urlData.publicUrl
      setAvatarUrl(newUrl)
      // Auto-save avatar_url immediately
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", user.id)
      showSaved()
    }
    setAvatarUploading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    await supabase.from("profiles").update({
      full_name: fullName,
      bio,
      role: role || null,
      avatar_url: avatarUrl || null,
      socials,
      hobbies,
      profile_theme: theme,
    }).eq("id", user.id)
    setSaving(false)
    showSaved()
    // Refresh page so form reflects saved values
  }

  const saveNotifications = async () => {
    setSaving(true)
    const { data: existing } = await supabase.from("notification_settings").select("user_id").eq("user_id", user.id).maybeSingle()
    if (existing) {
      await supabase.from("notification_settings").update({ ...notifs }).eq("user_id", user.id)
    } else {
      await supabase.from("notification_settings").insert({ user_id: user.id, ...notifs })
    }
    setSaving(false)
    showSaved()
  }

  const toggleNotif = (key: keyof Omit<NotifSettings, "user_id">) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleHobby = (slug: string) => {
    setHobbies(prev => prev.includes(slug) ? prev.filter(h => h !== slug) : [...prev, slug])
  }

  const selectedTheme = PROFILE_THEMES.find(t => t.id === theme) ?? PROFILE_THEMES[0]

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

  const filteredHobbies = HOBBY_OPTIONS.filter(h =>
    h.label.toLowerCase().includes(hobbySearch.toLowerCase())
  )

  return (
    <div className="min-h-screen app-bg app-text">
      <header className="sticky top-0 z-50 w-full border-b app-border app-surface shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <a href="/dashboard" className="flex items-center gap-2 app-text-muted hover:opacity-80 transition-opacity">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:block">Back</span>
          </a>
          <h1 className="text-lg font-bold app-text">Settings</h1>
          {saved && (
            <div className="ml-auto flex items-center gap-2 text-green-400 text-sm font-medium">
              <Check className="h-4 w-4" /> Saved!
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-56 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left",
                  activeTab === id ? "bg-indigo-600 text-white" : "app-text-muted hover:opacity-80 app-surface border app-border"
                )}>
                {icon}{label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <>
              {/* Avatar + Basic Info */}
              <div className="app-surface rounded-2xl border app-border p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold app-text mb-1">Profile</h2>
                  <p className="text-sm app-text-muted">Update your profile information.</p>
                </div>

                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-indigo-600 overflow-hidden ring-2 ring-zinc-700">
                      <img src={avatarUrl || "/default-avatar.png"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center border-2 border-zinc-900"
                    >
                      <Camera className="h-3.5 w-3.5 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                  <div>
                    <p className="text-sm font-medium app-text">Profile Photo</p>
                    <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                      className="text-xs text-indigo-400 hover:underline mt-0.5">
                      {avatarUploading ? "Uploading..." : "Choose from files"}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium app-text mb-1.5">Full Name</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium app-text mb-1.5">Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                      className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Tell others a bit about yourself..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium app-text mb-1.5">Program</label>
                    <select value={role} onChange={e => setRole(e.target.value)}
                      className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select your program</option>
                      <option value="CIMP">CIMP</option>
                      <option value="A-Level">A-Level</option>
                      <option value="AUSMAT">AUSMAT</option>
                      <option value="FIA">FIA</option>
                      <option value="FIST">FIST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium app-text mb-1.5">Email</label>
                    <input value={user.email} disabled
                      className="w-full app-input-bg app-text-muted border app-border rounded-xl px-4 py-2.5 text-sm opacity-60 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* Profile Theme */}
              <div className="app-surface rounded-2xl border app-border p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold app-text mb-1">Profile Theme</h2>
                  <p className="text-sm app-text-muted">Choose a banner colour for your profile.</p>
                </div>
                {/* Preview */}
                <div className={cn("h-16 rounded-xl bg-gradient-to-r", selectedTheme.from, selectedTheme.to)} />
                <div className="grid grid-cols-4 gap-2">
                  {PROFILE_THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={cn(
                        "rounded-xl h-10 bg-gradient-to-r transition-all border-2",
                        t.from, t.to,
                        theme === t.id ? "border-indigo-400 scale-105" : "border-transparent"
                      )}>
                      <span className="sr-only">{t.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE_THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors",
                        theme === t.id ? "bg-indigo-600 text-white border-indigo-600" : "app-input-bg app-text-muted border-transparent")}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="app-surface rounded-2xl border app-border p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold app-text mb-1">Social Links</h2>
                  <p className="text-sm app-text-muted">Add your social media handles so others can find you.</p>
                </div>
                <div className="space-y-3">
                  {SOCIAL_PLATFORMS.map(platform => (
                    <div key={platform.key} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg app-input-bg border app-border flex items-center justify-center text-lg flex-shrink-0">
                        {platform.icon}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs app-text-muted mb-1">{platform.label}</label>
                        <input
                          value={socials[platform.key] ?? ""}
                          onChange={e => setSocials(prev => ({ ...prev, [platform.key]: e.target.value }))}
                          placeholder={platform.placeholder}
                          className="w-full app-input-bg app-text border app-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hobbies */}
              <div className="app-surface rounded-2xl border app-border p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold app-text mb-1">Passions & Hobbies</h2>
                  <p className="text-sm app-text-muted">Select what you're into. Shows on your profile.</p>
                </div>

                {/* Selected hobbies */}
                {hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map(slug => {
                      const hobby = HOBBY_OPTIONS.find(h => h.value === slug)
                      if (!hobby) return null
                      return (
                        <span key={slug} className="flex items-center gap-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-sm">
                          {hobby.label}
                          <button onClick={() => toggleHobby(slug)} className="hover:text-white">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Search */}
                <input
                  value={hobbySearch}
                  onChange={e => setHobbySearch(e.target.value)}
                  placeholder="Search hobbies..."
                  className="w-full app-input-bg app-text border app-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Options */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredHobbies.map(hobby => (
                    <button key={hobby.value} onClick={() => toggleHobby(hobby.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                        hobbies.includes(hobby.value)
                          ? "bg-indigo-600/20 text-indigo-400"
                          : "app-input-bg app-text hover:opacity-80"
                      )}>
                      {hobby.label}
                      {hobbies.includes(hobby.value) && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save All Changes"}
              </button>
            </>
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
                  <div key={key} className="flex items-center justify-between p-4 app-input-bg rounded-xl border app-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg app-surface border app-border flex items-center justify-center flex-shrink-0">{icon}</div>
                      <div>
                        <p className="text-sm font-medium app-text">{label}</p>
                        <p className="text-xs app-text-muted">{desc}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleNotif(key)}
                      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                        notifs[key] ? "bg-indigo-600" : "bg-zinc-600")}>
                      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        notifs[key] ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={saveNotifications} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
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
                      <button onClick={() => setOn(v => !v)}
                        className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                          on ? "bg-indigo-600" : "bg-zinc-600")}>
                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                          on ? "translate-x-6" : "translate-x-1")} />
                      </button>
                    </div>
                  )
                })}
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
                  onClick={() => { if (confirm("Are you sure you want to delete your account? This cannot be undone.")) { alert("Please contact an admin to delete your account.") } }}
                  className="flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <Trash2 className="h-4 w-4" /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
