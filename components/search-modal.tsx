"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, X, User, FileText, Users, Calendar, ArrowRight } from "lucide-react"
import { PROGRAM_SUBJECTS } from "@/lib/subjects"
import { cn } from "@/lib/utils"

const supabase = createClient()

const ALL_COMMUNITIES = [
  ...Object.keys(PROGRAM_SUBJECTS),
  ...Object.values(PROGRAM_SUBJECTS).flat(),
]

const EVENTS = [
  { title: "Career Fair 2026", date: "Mar 15 • 10:00 AM", slug: "career-fair" },
  { title: "Study Group", date: "Mar 20 • 2:00 PM", slug: "study-group" },
  { title: "Sports Tournament", date: "Mar 25 • 9:00 AM", slug: "sports-tournament" },
]

interface SearchResult {
  type: "user" | "post" | "community" | "event"
  id: string
  title: string
  subtitle?: string
  href: string
  avatar_url?: string | null
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
  currentUserId: string
}

export function SearchModal({ open, onClose, currentUserId }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)

    const lower = q.toLowerCase()

    // Search users
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, bio")
      .neq("id", currentUserId)
      .or(`full_name.ilike.%${q}%,bio.ilike.%${q}%,role.ilike.%${q}%`)
      .limit(5)

    // Search posts
    const { data: posts } = await supabase
      .from("posts")
      .select("id, content, user_id, profiles:profiles!user_id(full_name)")
      .ilike("content", `%${q}%`)
      .limit(5)

    // Filter communities
    const matchedCommunities = ALL_COMMUNITIES
      .filter(c => c.toLowerCase().includes(lower))
      .slice(0, 4)

    // Filter events
    const matchedEvents = EVENTS.filter(e =>
      e.title.toLowerCase().includes(lower)
    )

    const allResults: SearchResult[] = [
      ...(users ?? []).map(u => ({
        type: "user" as const,
        id: u.id,
        title: u.full_name ?? "Student",
        subtitle: u.role ?? undefined,
        href: `/user/${u.id}`,
        avatar_url: u.avatar_url,
      })),
      ...(posts ?? []).map(p => ({
        type: "post" as const,
        id: p.id,
        title: (p.content as string).slice(0, 80) + ((p.content as string).length > 80 ? "…" : ""),
        subtitle: `by ${(p.profiles as any)?.full_name ?? "Student"}`,
        href: `/dashboard`,
      })),
      ...matchedCommunities.map(c => ({
        type: "community" as const,
        id: c,
        title: c,
        subtitle: Object.keys(PROGRAM_SUBJECTS).includes(c) ? "Program Community" : "Subject Community",
        href: `/community/${encodeURIComponent(c)}`,
      })),
      ...matchedEvents.map(e => ({
        type: "event" as const,
        id: e.slug,
        title: e.title,
        subtitle: e.date,
        href: `/dashboard`,
      })),
    ]

    setResults(allResults)
    setSelected(0)
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200)
    return () => clearTimeout(timeout)
  }, [query, search])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === "Enter" && results[selected]) {
        window.location.href = results[selected].href
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, results, selected, onClose])

  if (!open) return null

  const icons = {
    user: <User className="h-4 w-4" />,
    post: <FileText className="h-4 w-4" />,
    community: <Users className="h-4 w-4" />,
    event: <Calendar className="h-4 w-4" />,
  }

  const typeColors = {
    user: "text-indigo-400",
    post: "text-emerald-400",
    community: "text-violet-400",
    event: "text-amber-400",
  }

  const typeLabels = {
    user: "User",
    post: "Post",
    community: "Community",
    event: "Event",
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl app-surface border app-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b app-border">
          <Search className="h-5 w-5 app-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search users, posts, communities, events..."
            className="flex-1 bg-transparent app-text text-sm outline-none placeholder:app-text-muted"
          />
          {loading && (
            <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
          )}
          <button onClick={onClose} className="app-text-muted hover:opacity-80 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.map((result, i) => (
  
   	        key={`${result.type}-${result.id}`}
                href={result.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  i === selected ? "bg-indigo-600/20" : "hover:opacity-80"
                )}
              >
                {/* Left: avatar or icon */}
                {result.type === "user" && result.avatar_url ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 overflow-hidden flex-shrink-0">
                    <img src={result.avatar_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={cn("w-8 h-8 rounded-lg app-input-bg flex items-center justify-center flex-shrink-0", typeColors[result.type])}>
                    {icons[result.type]}
                  </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium app-text truncate">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs app-text-muted truncate">{result.subtitle}</p>
                  )}
                </div>

                {/* Type badge + arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-xs font-medium", typeColors[result.type])}>
                    {typeLabels[result.type]}
                  </span>
                  <ArrowRight className="h-3 w-3 app-text-muted" />
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query && !loading && results.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="app-text-muted text-sm">No results for "<span className="app-text">{query}</span>"</p>
          </div>
        )}

        {/* Default state */}
        {!query && (
          <div className="px-4 py-6">
            <p className="text-xs app-text-muted uppercase tracking-wider font-semibold mb-3 px-1">Quick Links</p>
            <div className="space-y-1">
              {[
                { label: "Dashboard", href: "/dashboard", icon: <FileText className="h-4 w-4" /> },
                { label: "Messages", href: "/messages", icon: <User className="h-4 w-4" /> },
                { label: "Subjects", href: "/subjects", icon: <Users className="h-4 w-4" /> },
              ].map(link => (
                <a key={link.href} href={link.href} onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 transition-colors">
                  <div className="w-7 h-7 rounded-lg app-input-bg flex items-center justify-center text-indigo-400">
                    {link.icon}
                  </div>
                  <span className="text-sm app-text">{link.label}</span>
                </a>
              ))}
            </div>
            <p className="text-xs app-text-muted mt-4 px-1">
              <kbd className="px-1.5 py-0.5 rounded app-input-bg border app-border text-xs">↑↓</kbd> navigate &nbsp;
              <kbd className="px-1.5 py-0.5 rounded app-input-bg border app-border text-xs">↵</kbd> open &nbsp;
              <kbd className="px-1.5 py-0.5 rounded app-input-bg border app-border text-xs">esc</kbd> close
            </p>
          </div>
        )}
      </div>
    </div>
  )
}