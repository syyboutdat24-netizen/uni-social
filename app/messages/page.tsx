import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
export default async function MessagesIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: connections } = await supabase.from("connections").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).eq("status", "accepted")
  const connectedIds = (connections ?? []).map(c => c.sender_id === user.id ? c.receiver_id : c.sender_id)
  const { data: connectedProfiles } = connectedIds.length > 0 ? await supabase.from("profiles").select("*").in("id", connectedIds) : { data: [] }
  const { data: messages } = await supabase.from("messages").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false })
  const getLatest = (otherId: string) => messages?.find(m => (m.sender_id === user.id && m.receiver_id === otherId) || (m.sender_id === otherId && m.receiver_id === user.id))
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col">
      <div className="flex-shrink-0 bg-zinc-900 px-4 py-3 flex items-center gap-3 border-b border-zinc-800">
        <a href="/dashboard" className="text-indigo-400 font-bold">← Sunway Connect</a>
        <h1 className="font-semibold text-white text-lg ml-2">Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800">
        {(connectedProfiles ?? []).length === 0 && (
          <p className="text-zinc-500 text-center mt-20 text-sm">No conversations yet. Connect with students to start chatting!</p>
        )}
        {(connectedProfiles ?? []).map((person) => {
          const latest = getLatest(person.id)
          return (
            <a key={person.id} href={`/messages/${person.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                {person.avatar_url ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" /> : (person.full_name?.[0] ?? "S")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{person.full_name ?? "Student"}</p>
                <p className="text-xs text-zinc-400 truncate">{latest ? latest.content : "No messages yet"}</p>
              </div>
              {latest && <p className="text-xs text-zinc-500 flex-shrink-0">{new Date(latest.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</p>}
            </a>
          )
        })}
      </div>
    </div>
  )
}