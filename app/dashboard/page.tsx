import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: connectionCount } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const displayName =
    profile?.full_name || user.email?.split("@")[0] || "Student";

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Uni Social
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/connections"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Connections
            </Link>
            <Link
              href="/profile"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Profile
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

        <main className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Welcome back
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              This is your home base on Uni Social. Complete your profile so
              other students can find and connect with you.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Edit profile
              </Link>
              <Link
                href="/connections"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Find students
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Overview
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Students on Uni Social
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{count ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Your connections
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{connectionCount ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">
                Next steps
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Fill in your name and bio on the Profile page.</li>
                <li>Upload or link a profile photo.</li>
                <li>Find other students and send connection requests.</li>
                <li>Message your connections directly.</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
