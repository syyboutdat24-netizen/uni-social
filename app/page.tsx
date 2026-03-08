import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // If user is logged in, redirect to dashboard
    redirect("/dashboard");
  } else {
    // If not logged in, redirect to login
    redirect("/login");
  }
}