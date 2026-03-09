import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PROGRAM_SUBJECTS } from "@/lib/subjects";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const subject = request.nextUrl.searchParams.get("subject");
  if (!subject) return NextResponse.redirect(new URL("/subjects", request.url));

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();

  const userProgram = profile?.role ?? "";
  const allowed = PROGRAM_SUBJECTS[userProgram]?.includes(subject) ?? false;

  if (allowed) {
    await supabase.from("subject_memberships").upsert({ user_id: user.id, subject });
  }

  revalidatePath("/subjects");
  return NextResponse.redirect(new URL("/subjects", request.url));
}