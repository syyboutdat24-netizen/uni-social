// components/PublicCommunitiesTab.tsx
"use client"

import { useState } from "react"
import { PUBLIC_COMMUNITIES, PUBLIC_COMMUNITY_CATEGORIES } from "@/lib/communities"
import { Search } from "lucide-react"
import Link from "next/link"

export function PublicCommunitiesTab() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered = PUBLIC_COMMUNITIES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["All", ...PUBLIC_COMMUNITY_CATEGORIES]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold app-text">Public Communities</h1>
        <p className="app-text-muted text-sm mt-1">Join any community — open to all Sunway students</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 app-text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search communities..."
          className="w-full app-input-bg app-text rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-indigo-600 text-white"
                : "app-input-bg app-text-muted hover:opacity-80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Community grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(community => (
          <Link
            key={community.slug}
            href={`/community/${community.slug}`}
            className="app-surface border app-border rounded-xl p-4 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{community.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm app-text truncate">{community.name}</p>
                <p className="text-xs app-text-muted truncate">{community.description}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs app-text-muted bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
                {community.category}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="app-text-muted text-center py-12">No communities found</p>
      )}
    </div>
  )
}
