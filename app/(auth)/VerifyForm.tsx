"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { verifyOtp, resendOtp } from "./actions";

interface VerifyFormProps {
  email: string;
}

export function VerifyForm({ email }: VerifyFormProps) {
  const [state, formAction] = useActionState(verifyOtp, null);
  const [resendState, resendAction] = useActionState(resendOtp, null);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Reset countdown after resend
  useEffect(() => {
    if (resendState && "success" in resendState) {
      setCountdown(60);
      setCanResend(false);
    }
  }, [resendState]);

  const handleDigit = (index: number, value: string) => {
    // Handle paste of full code
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      const newDigits = [...digits];
      cleaned.split("").forEach((d, i) => { if (i < 6) newDigits[i] = d; });
      setDigits(newDigits);
      inputRefs.current[Math.min(cleaned.length, 5)]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const token = digits.join("");

  return (
    <div className="space-y-6">
      {/* Error */}
      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {state.error}
        </p>
      )}

      {/* Resend success */}
      {resendState && "success" in resendState && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-200">
          New code sent! Check your email.
        </p>
      )}
      {resendState && "error" in resendState && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {resendState.error}
        </p>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />

        {/* 6-digit input boxes */}
        <div className="flex justify-center gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={e => e.target.select()}
              className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-zinc-300 bg-white text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={token.length !== 6}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Verify Email
        </button>
      </form>

      {/* Resend */}
      <div className="text-center">
        {canResend ? (
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400 font-medium"
            >
              Resend code
            </button>
          </form>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Resend code in <span className="font-medium text-zinc-700 dark:text-zinc-300">{countdown}s</span>
          </p>
        )}
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Wrong email?{" "}
        <a href="/signup" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Go back
        </a>
      </p>
    </div>
  );
}
