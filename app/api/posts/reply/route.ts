import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const formData = await request.formData();
  const content = formData.get("content") as string;
  const postId = formData.get("postId") as string;

  if (!content?.trim() || !postId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  await supabase.from("replies").insert({
    user_id: user.id,
    post_id: postId,
    content: content.trim()
  });

  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL("/dashboard", request.url));
}