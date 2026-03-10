import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type NotifType = "like" | "comment" | "message" | "friend_request" | "new_post"

const notifTypeToSettingKey: Record<NotifType, string> = {
  like: "likes",
  comment: "comments",
  message: "messages",
  friend_request: "friend_requests",
  new_post: "new_posts_from_friends",
}

export async function sendNotification({
  toUserId,
  fromUserId,
  type,
  message,
  postId = null,
}: {
  toUserId: string
  fromUserId: string
  type: NotifType
  message: string
  postId?: string | null
}) {
  // Don't notify yourself
  if (toUserId === fromUserId) return

  // Check recipient's notification settings
  const settingKey = notifTypeToSettingKey[type]
  const { data: settings } = await supabase
    .from("notification_settings")
    .select(settingKey)
    .eq("user_id", toUserId)
    .maybeSingle()

  // If settings exist and the specific type is disabled, skip
  if (settings && settings[settingKey] === false) return

  await supabase.from("notifications").insert({
    user_id: toUserId,
    from_user_id: fromUserId,
    type,
    message,
    post_id: postId,
    read: false,
  })
}
