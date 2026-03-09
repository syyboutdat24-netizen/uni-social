import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessagesClient from "@/components/messages-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: otherId } = await params;

  const [{ data: otherProfile }, { data: messages }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", otherId)
      .single(),
    supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  return (
    <MessagesClient
      currentUserId={user.id}
      otherId={otherId}
      otherProfile={otherProfile}
      initialMessages={messages ?? []}
    />
  );
}