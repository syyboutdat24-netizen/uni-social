import Link from "next/link";
import { getAllowedDomain } from "@/lib/auth";
import { SignupForm } from "../SignupForm";

export default function SignupPage() {
  const domain = getAllowedDomain();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create an account
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Only @{domain} email addresses can sign up.
      </p>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
