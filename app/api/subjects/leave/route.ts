import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const subject = request.nextUrl.searchParams.get("subject");
  if (!subject) return NextResponse.redirect(new URL("/subjects", request.url));

  await supabase.from("subject_memberships")
    .delete()
    .eq("user_id", user.id)
    .eq("subject", subject);

  revalidatePath("/subjects");
  return NextResponse.redirect(new URL("/subjects", request.url));
}