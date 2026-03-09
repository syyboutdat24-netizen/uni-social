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

  const userId = request.nextUrl.searchParams.get("userId");
  const formData = await request.formData();
  const badge_role = formData.get("badge_role") as string;

  console.log("SETTING ROLE:", userId, badge_role);
  const { error } = await supabase.from("profiles").update({
    badge_role: badge_role || null
  }).eq("id", userId!);
  console.log("SET ROLE ERROR:", error);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL("/admin", request.url));
}