import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log("AUTH USER:", user?.id, "AUTH ERROR:", authError);
  
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const to = request.nextUrl.searchParams.get("to");
  console.log("SENDING TO:", to);

  const formData = await request.formData();
  const content = formData.get("content") as string;
  console.log("CONTENT:", content);

  if (!content?.trim()) {
    return NextResponse.redirect(new URL(`/messages/${to}`, request.url));
  }

  const { data, error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: to,
    content: content.trim(),
    read: false
  });

  console.log("INSERT RESULT:", data, "INSERT ERROR:", error);

  revalidatePath(`/messages/${to}`);
  return NextResponse.redirect(new URL(`/messages/${to}`, request.url));
}