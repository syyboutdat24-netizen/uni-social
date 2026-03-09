import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { signOut } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  // Run all independent queries IN PARALLEL instead of one by one
  const [
    { data: profile },
    { data: profiles },
    { data: connections },
    { data: rawPosts },
    { data: subjectMemberships },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, bio, avatar_url, role, badge_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, bio, avatar_url, role, badge_role")
      .neq("id", user.id),
    supabase
      .from("connections")
      .select("id, sender_id, receiver_id, status")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase
      .from("posts")
      .select(`
        id, user_id, content, created_at,
        profiles:profiles!user_id (full_name, avatar_url, role, badge_role)
      `)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("subject_memberships")
      .select("subject")
      .eq("user_id", user.id),
  ]);

  // Get post IDs so we only fetch relevant likes & replies
  const postIds = (rawPosts ?? []).map(p => p.id);

  const [
    { data: likes },
    { data: rawReplies },
  ] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from("likes")
          .select("id, user_id, post_id")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase
          .from("replies")
          .select(`
            id, user_id, post_id, content, created_at,
            profiles:profiles!user_id (full_name, avatar_url, role, badge_role)
          `)
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      profiles={profiles ?? []}
      connections={connections ?? []}
      posts={rawPosts ?? []}
      likes={likes ?? []}
      replies={rawReplies ?? []}
      subjectMemberships={subjectMemberships?.map(m => m.subject) ?? []}
      signOut={signOut}
    />
  );
}