import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const to = request.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.redirect(new URL("/connections", request.url));

  // check for existing request or connection between these users
  const { data: existing } = await supabase
    .from("connections")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${to}),and(sender_id.eq.${to},receiver_id.eq.${user.id}))`)
    .single();

  if (existing) {
    // if there's a pending request from the other person, accept it
    if (existing.status === "pending" && existing.receiver_id === user.id) {
      await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", existing.id);
    }
    // otherwise do nothing (already pending/accepted)
    return NextResponse.redirect(new URL("/connections", request.url));
  }

  // no prior connection, create a pending request
  const { error } = await supabase.from("connections").insert({
    sender_id: user.id,
    receiver_id: to,
    status: "pending"
  });

  if (error) {
    console.error("send error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}