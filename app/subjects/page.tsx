import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PROGRAM_SUBJECTS } from "@/lib/subjects";

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("subject_memberships")
    .select("subject")
    .eq("user_id", user.id);

  const joinedSubjects = new Set(memberships?.map(m => m.subject) ?? []);
  const userProgram = profile?.role ?? "";
  const availableSubjects = PROGRAM_SUBJECTS[userProgram] ?? [];

  return (
    <div className="min-h-screen app-bg app-text">
      <div className="app-surface border-b app-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-indigo-500 font-bold text-lg">Sunway Connect</a>
          <span className="app-text-muted">|</span>
          <span className="app-text font-semibold">Subject Communities</span>
        </div>
        <a href="/dashboard" className="app-text-muted hover:opacity-80 text-sm">← Back to Dashboard</a>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {availableSubjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="app-text-muted text-lg mb-2">No subjects available</p>
            <p className="app-text-muted text-sm">You need a program role assigned to access subject communities.</p>
            <p className="app-text-muted text-sm mt-1">Ask an admin to set your program in your profile.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1 app-text">{userProgram} Subject Communities</h1>
            <p className="app-text-muted mb-8">{availableSubjects.length} subjects available</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableSubjects.map((subject) => {
                const joined = joinedSubjects.has(subject)
                return (
                  <div key={subject} className="app-surface rounded-xl p-4 border app-border flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm app-text">{subject}</p>
                      {joined && <p className="text-xs text-indigo-500 mt-0.5">Joined</p>}
                    </div>
                    <form method="POST" action={joined ? `/api/subjects/leave?subject=${encodeURIComponent(subject)}` : `/api/subjects/join?subject=${encodeURIComponent(subject)}`}>
                      <button type="submit"
                        className={joined
                          ? "text-sm px-4 py-1.5 rounded-lg border app-border hover:opacity-80 app-text-muted"
                          : "text-sm px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                        }>
                        {joined ? "Leave" : "Join"}
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}