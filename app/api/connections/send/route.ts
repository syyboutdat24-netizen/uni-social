import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const to = request.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.redirect(new URL("/connections", request.url));

  await supabase.from("connections").insert({
    sender_id: user.id,
    receiver_id: to,
    status: "pending"
  });

  return NextResponse.redirect(new URL("/connections", request.url));
}