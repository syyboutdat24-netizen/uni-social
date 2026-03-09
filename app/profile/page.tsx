import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { ProfileForm } from "./ProfileForm";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string | null;
  updated_at: string | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: myProfileData } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, role, updated_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-6">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <a href="/dashboard" className="text-indigo-400 font-bold text-lg">Sunway Connect</a>
          <div className="flex items-center gap-3">
            <a href="/dashboard"
              className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 transition">
              Dashboard
            </a>
            <form action={signOut}>
              <button type="submit"
                className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition">
                Log out
              </button>
            </form>
          </div>
        </header>
        <ProfileForm initialProfile={myProfileData ?? null} />
      </div>
    </div>
  );
}