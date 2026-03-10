import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SettingsClient from "@/components/settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, role, badge_role")
    .eq("id", user.id)
    .maybeSingle()

  // Fetch notification settings if they exist
  const { data: notifSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      notifSettings={notifSettings}
    />
  )
}
