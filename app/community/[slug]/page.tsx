import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import CommunityClient from "@/components/community-client"
import { getPublicCommunity, isPublicCommunity } from "@/lib/communities"
import { PROGRAM_SUBJECTS } from "@/lib/subjects"

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, badge_role")
    .eq("id", user.id)
    .single()

  // Determine community type
  let community: { name: string; type: "program" | "subject" | "public"; emoji?: string; description?: string }

  if (isPublicCommunity(decodedSlug)) {
    const pub = getPublicCommunity(decodedSlug)!
    community = { name: pub.name, type: "public", emoji: pub.emoji, description: pub.description }
  } else {
    const programs = Object.keys(PROGRAM_SUBJECTS)
    const allSubjects = Object.values(PROGRAM_SUBJECTS).flat()
    const isProgram = programs.includes(decodedSlug)
    const isSubject = allSubjects.includes(decodedSlug)
    if (isProgram || isSubject) {
      community = {
        name: decodedSlug,
        type: isSubject ? "subject" : "program"
      }
    } else {
      notFound()
    }
  }

  // For public communities, members = anyone who has sent a message or post
  // For program/subject communities, filter by role/membership
  let members: any[] = []

  if (community.type === "public") {
    // Get members who joined (sent messages or posts in this community)
    const { data: memberIds } = await supabase
      .from("community_messages")
      .select("user_id")
      .eq("community_slug", decodedSlug)

    const uniqueIds = [...new Set((memberIds ?? []).map((m: any) => m.user_id))]

    if (uniqueIds.length > 0) {
      const { data: memberProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, badge_role")
        .in("id", uniqueIds)
      members = memberProfiles ?? []
    }
  } else if (community.type === "program") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, badge_role")
      .eq("role", decodedSlug)
    members = data ?? []
  } else {
    const { data: memberships } = await supabase
      .from("subject_memberships")
      .select("user_id")
      .eq("subject", decodedSlug)
    const ids = (memberships ?? []).map((m: any) => m.user_id)
    if (ids.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, badge_role")
        .in("id", ids)
      members = data ?? []
    }
  }

  const [
    { data: forumPosts },
    { data: forumReplies },
    { data: chatMessages },
    { data: notes },
  ] = await Promise.all([
    supabase.from("community_posts").select("id, user_id, title, content, created_at, profiles(full_name, avatar_url, badge_role)").eq("community_slug", decodedSlug).order("created_at", { ascending: false }).limit(50),
    supabase.from("community_post_replies").select("id, post_id, user_id, content, created_at, profiles(full_name, avatar_url, badge_role)").in("post_id", (await supabase.from("community_posts").select("id").eq("community_slug", decodedSlug)).data?.map((p: any) => p.id) ?? []),
    supabase.from("community_messages").select("id, user_id, content, created_at, profiles(full_name, avatar_url, badge_role)").eq("community_slug", decodedSlug).order("created_at", { ascending: true }).limit(100),
    supabase.from("community_notes").select("id, user_id, title, content, created_at, profiles(full_name, avatar_url, badge_role)").eq("community_slug", decodedSlug).order("created_at", { ascending: false }).limit(50),
  ])

  return (
    <CommunityClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      community={community}
      slug={decodedSlug}
      members={members}
      forumPosts={(forumPosts ?? []) as any}
      forumReplies={(forumReplies ?? []) as any}
      chatMessages={(chatMessages ?? []) as any}
      notes={(notes ?? []) as any}
    />
  )
}
