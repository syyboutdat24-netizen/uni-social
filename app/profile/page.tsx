import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { ProfileForm } from "./ProfileForm";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: myProfileData } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, updated_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: others } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, updated_at")
    .neq("id", user.id)
    .order("updated_at", { ascending: false })
    .limit(24);

  const otherProfiles = (others as ProfileRow[] | null) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            Uni Social
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Dashboard
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Log out
              </button>
            </form>
          </nav>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,3fr)]">
          <ProfileForm initialProfile={myProfileData ?? null} />

          <section
            id="students"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Students
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing up to 24 most recently updated profiles.
              </p>
            </div>

            {otherProfiles.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                No other students have set up their profiles yet. Share Uni
                Social with your classmates!
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {otherProfiles.map((profile) => {
                  const name = profile.full_name ?? "Student";
                  const initial = name[0]?.toUpperCase() ?? "S";
                  const bio =
                    profile.bio ??
                    "This student hasn’t written a bio yet.";

                  return (
                    <li
                      key={profile.id}
                      className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatar_url}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {bio}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

