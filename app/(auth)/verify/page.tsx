import { redirect } from "next/navigation";
import { VerifyForm } from "@/app/(auth)/verify/VerifyForm";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ? decodeURIComponent(params.email) : null;

  if (!email) redirect("/signup");

  return (
    <>
      <div className="mb-8 text-center">
        <a href="/login" className="inline-block">
          <img src="/logo-dark.png" alt="Sunway Connect" className="h-10 w-auto object-contain mx-auto hidden dark:block" />
          <img src="/logo-light.png" alt="Sunway Connect" className="h-10 w-auto object-contain mx-auto block dark:hidden" />
        </a>
        <h2 className="mt-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          We sent a 6-digit code to
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {email}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Enter it below to activate your account
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <VerifyForm email={email} />
      </div>
    </>
  );
}
