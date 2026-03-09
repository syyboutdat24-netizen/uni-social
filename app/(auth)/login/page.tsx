import Link from "next/link";
import { LoginForm } from "../LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Log in to Sunway Connect
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Use your Sunway email to continue.
      </p>

      {message && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {message}
        </p>
      )}

      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don’t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
