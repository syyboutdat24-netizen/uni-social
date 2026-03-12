"use server";

import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { redirect } from "next/navigation";

export type AuthResult = { error: string } | { success: true } | { needsVerification: true; email: string };

export async function signUp(_prev: unknown, formData: FormData): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  if (!isAllowedEmail(email)) {
    const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "youruniversity.edu";
    return { error: `Only @${domain} email addresses can sign up.` };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  // Use signUp with email OTP — Supabase sends a 6-digit code
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined, // disable magic link, use OTP only
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "This email is already registered. Please log in." };
    }
    return { error: error.message };
  }

  // Redirect to verify page with email in query param
  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyOtp(_prev: unknown, formData: FormData): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();
  const token = (formData.get("token") as string)?.trim().replace(/\s/g, "");

  if (!email || !token) {
    return { error: "Please enter the verification code." };
  }

  if (token.length !== 6 || !/^\d+$/.test(token)) {
    return { error: "Please enter the 6-digit code from your email." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    if (error.message.includes("expired") || error.message.includes("invalid")) {
      return { error: "Invalid or expired code. Please request a new one." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function resendOtp(_prev: unknown, formData: FormData): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();

  if (!email) return { error: "Email is required." };

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function signIn(_prev: unknown, formData: FormData): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  if (!isAllowedEmail(email)) {
    const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "youruniversity.edu";
    return { error: `Only @${domain} email addresses can log in.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      redirect(`/verify?email=${encodeURIComponent(email)}`);
    }
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
