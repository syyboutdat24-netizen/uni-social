import { redirect } from "next/navigation";
import { VerifyForm } from "@/app/(auth)/VerifyForm";

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email;
  if (!email) redirect("/signup");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            <span className="text-indigo-600">Sunway</span> Connect
          </h1>
          <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            We sent a 6-digit code to
          </p>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100 text-sm">
            {decodeURIComponent(email)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Enter the code below to verify your account
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <VerifyForm email={decodeURIComponent(email)} />
        </div>
      </div>
    </div>
  );
}
