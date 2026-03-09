import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const ADMIN_IDS = ['3d83119d-1995-46df-9a9f-e975832c8fc3'];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const postId = request.nextUrl.searchParams.get("postId");
  console.log("DELETING POST ID:", postId);

  const { error } = await supabase.from("posts").delete().eq("id", postId!);
  console.log("DELETE ERROR:", error);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL("/admin", request.url));
}