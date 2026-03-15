// components/MediaAttachment.tsx
// Reusable file picker + preview for posts, replies, chat

"use client"

import { useRef, useState } from "react"
import { ImageIcon, X, Film } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export interface MediaFile {
  url: string
  type: "image" | "video"
}

interface MediaAttachmentProps {
  onAttach: (file: MediaFile) => void
  onRemove: () => void
  current: MediaFile | null
  uploading: boolean
  setUploading: (v: boolean) => void
  bucket?: string
  folder?: string
}

export function MediaAttachment({
  onAttach, onRemove, current, uploading, setUploading,
  bucket = "post-media", folder = "posts"
}: MediaAttachmentProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const isVideo = file.type.startsWith("video/")
    const ext = file.name.split(".").pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      onAttach({ url: urlData.publicUrl, type: isVideo ? "video" : "image" })
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
      {current ? (
        <div className="relative inline-block mt-2">
          {current.type === "image" ? (
            <img src={current.url} alt="" className="max-h-48 rounded-xl object-cover" />
          ) : (
            <video src={current.url} controls className="max-h-48 rounded-xl" />
          )}
          <button onClick={onRemove}
            className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-xs app-text-muted hover:text-indigo-400 transition-colors mt-1">
          <ImageIcon className="h-4 w-4" />
          {uploading ? "Uploading..." : "Photo / Video"}
        </button>
      )}
    </div>
  )
}

// Display media in a post/message
export function MediaDisplay({ url, type }: { url: string; type?: string }) {
  if (!url) return null
  const isVideo = type === "video" || url.match(/\.(mp4|mov|webm|ogg)$/i)
  if (isVideo) {
    return (
      <div className="mt-2 rounded-2xl overflow-hidden">
        <video src={url} controls className="w-full max-h-96 object-cover" />
      </div>
    )
  }
  return (
    <div className="mt-2 rounded-2xl overflow-hidden cursor-pointer" onClick={() => window.open(url, "_blank")}>
      <img src={url} alt="" className="w-full max-h-96 object-cover hover:opacity-95 transition-opacity" />
    </div>
  )
}
