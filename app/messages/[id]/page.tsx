import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MessagesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const otherId = params.id;

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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center gap-4 border-b border-gray-800">
        <a href="/dashboard" className="text-indigo-500 font-semibold text-lg">
          Sunway Connect
        </a>
        <span className="text-gray-600">|</span>
        <a href="/connections" className="text-gray-400 hover:text-white text-sm">← Back</a>
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold overflow-hidden">
          {otherProfile?.avatar_url
            ? <img src={otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            : (otherProfile?.full_name?.[0] ?? "S")}
        </div>
        <p className="font-semibold">{otherProfile?.full_name ?? "Student"}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {messages?.map((msg) => (
          <div key={msg.id} className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
            msg.sender_id === user.id
              ? "bg-indigo-600 self-end"
              : "bg-gray-800 self-start"
          }`}>
            {msg.content}
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <p className="text-gray-500 text-center mt-20">No messages yet. Say hello!</p>
        )}
      </div>

      {/* Message input */}
      <form method="POST" action={`/api/messages/send?to=${otherId}`}
        className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3">
        <input
          name="content"
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl">
          Send
        </button>
      </form>
    </div>
  );
}