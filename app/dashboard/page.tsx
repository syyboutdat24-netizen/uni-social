import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { signOut } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const [
    { data: profile },
    { data: profiles },
    { data: connections },
    { data: allConnections },
    { data: rawPosts },
    { data: subjectMemberships },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, bio, avatar_url, role, badge_role").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("id, full_name, bio, avatar_url, role, badge_role").neq("id", user.id),
    supabase.from("connections").select("id, sender_id, receiver_id, status").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase.from("connections").select("sender_id, receiver_id").eq("status", "accepted"),
    supabase.from("posts").select("id, user_id, content, created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("subject_memberships").select("subject").eq("user_id", user.id),
  ]);

  const postIds = (rawPosts ?? []).map((p: any) => p.id);
  const allProfileIds = (rawPosts ?? []).map((p: any) => p.user_id);

  const [
    { data: postProfiles },
    { data: likes },
    { data: rawReplies },
  ] = await Promise.all([
    allProfileIds.length > 0
      ? supabase.from("profiles").select("id, full_name, avatar_url, role, badge_role").in("id", allProfileIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("likes").select("id, user_id, post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("replies").select("id, user_id, post_id, parent_reply_id, content, created_at").in("post_id", postIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const posts = (rawPosts ?? []).map((post: any) => ({
    ...post,
    profiles: (postProfiles ?? []).find((p: any) => p.id === post.user_id) ?? null,
  }));

  const replies = (rawReplies ?? []).map((reply: any) => ({
    ...reply,
    profiles: (postProfiles ?? []).find((p: any) => p.id === reply.user_id) ?? null,
  }));

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      profiles={profiles ?? []}
      connections={connections ?? []}
      allConnections={allConnections ?? []}
      posts={posts}
      likes={likes ?? []}
      replies={replies}
      subjectMemberships={subjectMemberships?.map((m: any) => m.subject) ?? []}
      signOut={signOut}
    />
  );
}