import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { signOut } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, role, badge_role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, role, badge_role")
    .neq("id", user.id);

  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const { data: rawPosts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, badge_role");

  const posts = (rawPosts ?? []).map(post => ({
    ...post,
    profiles: allProfiles?.find(p => p.id === post.user_id) ?? null
  }));

  const { data: likes } = await supabase
    .from("likes")
    .select("*");

  const { data: subjectMemberships } = await supabase
    .from("subject_memberships")
    .select("subject")
    .eq("user_id", user.id);

  const { data: rawReplies } = await supabase
    .from("replies")
    .select("*")
    .order("created_at", { ascending: true });

  const replies = (rawReplies ?? []).map(reply => ({
    ...reply,
    profiles: allProfiles?.find(p => p.id === reply.user_id) ?? null
  }));

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      profiles={profiles ?? []}
      connections={connections ?? []}
      posts={posts}
      likes={likes ?? []}
      replies={replies}
      subjectMemberships={subjectMemberships?.map(m => m.subject) ?? []}
      signOut={signOut}
    />
  );
}