import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const from = request.nextUrl.searchParams.get("from");
  if (!from) return NextResponse.redirect(new URL("/connections", request.url));

  await supabase.from("connections")
    .update({ status: "accepted" })
    .eq("sender_id", from)
    .eq("receiver_id", user.id);

  return NextResponse.redirect(new URL("/connections", request.url));
}