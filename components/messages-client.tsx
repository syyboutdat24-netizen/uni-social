"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send, ImageIcon, X } from "lucide-react"
import { SunwayLogo } from "@/components/SunwayLogo"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  image_url?: string | null
  created_at: string
}

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface MessagesClientProps {
  currentUserId: string
  senderName: string
  otherId: string
  otherProfile: Profile | null
  initialMessages: Message[]
}

export default function MessagesClient({
  currentUserId,
  senderName,
  otherId,
  otherProfile,
  initialMessages,
}: MessagesClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.sender_id !== currentUserId) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, otherId, supabase])

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const sendMessage = async () => {
    const content = input.trim()
    if ((!content && !imageFile) || sending) return

    const optimisticId = `temp-${Date.now()}`
    const localPreview = imagePreview // save before clearing

    const optimistic: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      receiver_id: otherId,
      content: content || "",
      image_url: localPreview,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimistic])
    setInput("")
    clearImage()
    setSending(true)

    let image_url: string | null = null

    // Upload image if present
    if (imageFile) {
      const ext = imageFile.name.split(".").pop()
      const path = `messages/${currentUserId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("message-images")
        .upload(path, imageFile, { upsert: true })

      if (uploadError) {
        console.error("Image upload failed:", uploadError.message)
      } else if (uploadData) {
        const { data: urlData } = supabase.storage
          .from("message-images")
          .getPublicUrl(uploadData.path)
        image_url = urlData.publicUrl
      }
    }

    const { data, error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: otherId,
      content: content || "",
      image_url,
      read: false,
    }).select().single()

    if (error) {
      console.error("Failed to send:", error)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(content)
    } else if (data) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticId ? { ...data } : m)
      )
    }

    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="fixed inset-0 w-full app-bg app-text flex flex-col" style={{ top: 0, zIndex: 50 }}>

      {/* Top bar — flush to top */}
      <div className="flex-shrink-0 app-surface px-4 py-3 flex items-center gap-3 border-b app-border shadow-sm">
        <a href="/messages" className="app-text-muted hover:opacity-80 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <a href={`/user/${otherId}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-indigo-600 hover:opacity-80 transition-opacity">
              <img src={otherProfile?.avatar_url || "/default-avatar.png"} alt="" className="w-full h-full object-cover" />
            </div>
          </a>
          <a href={`/user/${otherId}`} className="font-semibold text-sm app-text hover:underline truncate">
            {otherProfile?.full_name ?? "Student"}
          </a>
        </div>
        <a href="/dashboard" className="flex-shrink-0">
          <SunwayLogo size="sm" />
        </a>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="app-text-muted text-center mt-20 text-sm">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"} ${msg.id.startsWith("temp-") ? "opacity-60" : "opacity-100"}`}>
              {/* Image */}
              {msg.image_url && (
                <div className={`max-w-[65%] rounded-2xl overflow-hidden ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                  <img
                    src={msg.image_url}
                    alt="image"
                    className="w-full object-cover max-h-64 cursor-pointer"
                    onClick={() => window.open(msg.image_url!, "_blank")}
                  />
                </div>
              )}
              {/* Text */}
              {msg.content && (
                <div className={`max-w-[65%] px-4 py-2 rounded-2xl text-sm break-words ${
                  isMine
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "app-input-bg app-text rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              )}
              <span className="text-xs app-text-muted px-1">{formatTime(msg.created_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview above input */}
      {imagePreview && (
        <div className="flex-shrink-0 px-4 pb-2 app-surface border-t app-border">
          <div className="relative inline-block mt-2">
            <img src={imagePreview} alt="preview" className="h-20 w-auto rounded-xl object-cover" />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-0.5 hover:bg-zinc-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-3 py-3 app-surface border-t app-border">
        <div className="flex items-center gap-2">
          {/* Image pick button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 app-text-muted hover:text-indigo-400 transition-colors p-2"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="hidden"
          />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 app-input-bg app-text rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !imageFile) || sending}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-full transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
