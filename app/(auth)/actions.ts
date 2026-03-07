"use server";

import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { redirect } from "next/navigation";

export type AuthResult = { error: string } | { success: true };

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
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Check your email to confirm your account.");
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
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
