import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MessagesClient from "@/components/messages-client"

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: otherId } = await params

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const [
    { data: otherProfile },
    { data: senderProfile },
    { data: messages },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", otherId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(100),
  ])

  // Mark messages from other person as read
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("sender_id", otherId)
    .eq("receiver_id", user.id)
    .eq("read", false)

  return (
    <MessagesClient
      currentUserId={user.id}
      senderName={senderProfile?.full_name ?? "Someone"}
      otherId={otherId}
      otherProfile={otherProfile}
      initialMessages={messages ?? []}
    />
  )
}
