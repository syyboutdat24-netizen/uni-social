import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const from = request.nextUrl.searchParams.get("from");
  if (!from) return NextResponse.redirect(new URL("/connections", request.url));

  const { error } = await supabase.from("connections")
    .update({ status: "accepted" })
    .eq("sender_id", from)
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("accept error", error);
    // attempt to debug schema
    const { data: cols, error: colsErr } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "connections");
    if (colsErr) console.error("schema query error", colsErr);
    return NextResponse.json({ success: false, error: error.message, columns: cols }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}