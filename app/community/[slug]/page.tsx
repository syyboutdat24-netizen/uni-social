import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PROGRAM_SUBJECTS } from "@/lib/subjects";
import CommunityClient from "@/components/community-client";

export const dynamic = "force-dynamic";

function getCommunityInfo(slug: string): { name: string; type: "program" | "subject" } | null {
  const decoded = decodeURIComponent(slug)
  if (PROGRAM_SUBJECTS[decoded]) return { name: decoded, type: "program" }
  for (const subjects of Object.values(PROGRAM_SUBJECTS)) {
    if (subjects.includes(decoded)) return { name: decoded, type: "subject" }
  }
  return null
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const community = getCommunityInfo(slug)
  if (!community) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, badge_role")
    .eq("id", user.id)
    .maybeSingle();

  // Get members depending on community type
  let members: any[] = []
  if (community.type === "program") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, badge_role")
      .eq("role", community.name)
    members = data ?? []
  } else {
    const { data } = await supabase
      .from("subject_memberships")
      .select("user_id, profiles:profiles!user_id(id, full_name, avatar_url, role, badge_role)")
      .eq("subject", community.name)
    members = (data ?? []).map((m: any) => m.profiles).filter(Boolean)
  }

  const [
    { data: forumPosts },
    { data: chatMessages },
    { data: notes },
    { data: forumReplies },
  ] = await Promise.all([
    supabase
      .from("community_posts")
      .select("id, user_id, title, content, created_at, profiles:profiles!user_id(full_name, avatar_url, badge_role)")
      .eq("community_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("community_messages")
      .select("id, user_id, content, created_at, profiles:profiles!user_id(full_name, avatar_url, badge_role)")
      .eq("community_slug", slug)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("community_notes")
      .select("id, user_id, title, content, created_at, profiles:profiles!user_id(full_name, avatar_url, badge_role)")
      .eq("community_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("community_post_replies")
      .select("id, post_id, user_id, content, created_at, profiles:profiles!user_id(full_name, avatar_url, badge_role)")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <CommunityClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      community={community}
      slug={slug}
      members={members}
      forumPosts={(forumPosts ?? []) as any[]}
      forumReplies={(forumReplies ?? []) as any[]}
      chatMessages={(chatMessages ?? []) as any[]}
      notes={(notes ?? []) as any[]}
    />
  );
}