"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileResult = { error: string } | { success: true };

export async function updateProfile(
  _prev: ProfileResult | null,
  formData: FormData,
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be logged in to update your profile." };
  }

  const fullNameRaw = (formData.get("full_name") as string) ?? "";
  const bioRaw = (formData.get("bio") as string) ?? "";
  const avatarRaw = (formData.get("avatar_url") as string) ?? "";

  const payload = {
    id: user.id,
    full_name: fullNameRaw.trim() === "" ? null : fullNameRaw.trim(),
    bio: bioRaw.trim() === "" ? null : bioRaw.trim(),
    avatar_url: avatarRaw.trim() === "" ? null : avatarRaw.trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return { error: "Could not save profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true };
}

