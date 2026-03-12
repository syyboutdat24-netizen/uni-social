"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send } from "lucide-react"
import { SunwayLogo } from "@/components/SunwayLogo"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Real-time: ONLY listen for messages from the other person
  // Never handle our own sends here — those stay via optimistic update
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
          // Strictly ignore anything we sent
          if (newMsg.sender_id !== currentUserId) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherId, supabase])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || sending) return

    const optimisticId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      receiver_id: otherId,
      content,
      created_at: new Date().toISOString(),
    }

    // Add optimistic message and clear input immediately
    setMessages((prev) => [...prev, optimistic])
    setInput("")
    setSending(true)

    const { data, error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: otherId,
      content,
      read: false,
    }).select().single()

    console.log("INSERT result:", { data, error })

    if (error) {
      console.error("Failed to send:", error)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(content)
    } else if (data) {
      console.log("Replacing optimistic with:", data)
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

  return (
    <div style={{ minHeight: "100vh" }} className="w-full app-bg app-text flex flex-col">
      <div className="flex-shrink-0 app-surface px-4 py-3 flex items-center gap-3 border-b app-border">
        <a href="/messages" className="app-text-muted hover:opacity-80 text-lg">←</a>
        <a href={`/user/${otherId}`} className="font-semibold app-text hover:underline">
          {otherProfile?.full_name ?? "Student"}
        </a>
        <a href="/dashboard" className="ml-auto">
          <SunwayLogo size="sm" />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 app-bg">
        {messages.length === 0 && (
          <p className="app-text-muted text-center mt-20 text-sm">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words transition-opacity ${
              msg.sender_id === currentUserId
                ? "bg-indigo-600 text-white self-end rounded-br-sm"
                : "app-input-bg app-text self-start rounded-bl-sm"
            } ${msg.id.startsWith("temp-") ? "opacity-60" : "opacity-100"}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 p-3 app-surface border-t app-border">
        <div className="flex gap-2">
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
            disabled={!input.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}