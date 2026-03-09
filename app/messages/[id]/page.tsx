import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function MessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: otherId } = await params;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherId)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  return (
    <div style={{minHeight: '100vh'}} className="w-full app-bg app-text flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 app-surface px-4 py-3 flex items-center gap-3 border-b app-border">
        <a href="/messages" className="app-text-muted hover:opacity-80 text-lg">←</a>
        <a href={`/user/${otherId}`} className="font-semibold app-text hover:underline">
          {otherProfile?.full_name ?? "Student"}
        </a>
        <a href="/dashboard" className="ml-auto text-indigo-500 font-bold text-sm">Sunway Connect</a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 app-bg">
        {messages?.map((msg) => (
          <div key={msg.id} className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words ${
            msg.sender_id === user.id
              ? "bg-indigo-600 text-white self-end rounded-br-sm"
              : "app-input-bg app-text self-start rounded-bl-sm"
          }`}>
            {msg.content}
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <p className="app-text-muted text-center mt-20 text-sm">No messages yet. Say hello!</p>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 app-surface border-t app-border">
        <form method="POST" action={`/api/messages/send?to=${otherId}`} className="flex gap-2">
          <input
            name="content"
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 app-input-bg app-text rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
