"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileResult } from "./actions";

type ProfileFormProps = {
  initialProfile: {
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  } | null;
};

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [state, formAction] = useActionState<ProfileResult | null, FormData>(
    updateProfile,
    null,
  );

  const fullNameDefault = initialProfile?.full_name ?? "";
  const bioDefault = initialProfile?.bio ?? "";
  const avatarDefault = initialProfile?.avatar_url ?? "";

  const avatarPreview = avatarDefault || null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold tracking-tight">Your profile</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        This is what other students will see. Use a real name and a short,
        friendly bio.
      </p>

      {state && "error" in state && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {state.error}
        </p>
      )}

      {state && "success" in state && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          Profile saved.
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {fullNameDefault
                  ? fullNameDefault[0]?.toUpperCase()
                  : "U"}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paste a link to a square image (for example from Supabase Storage
            or another image host). You’ll see a preview here.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="avatar_url"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Profile photo URL
          </label>
          <input
            id="avatar_url"
            name="avatar_url"
            type="url"
            defaultValue={avatarDefault}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={fullNameDefault}
            placeholder="Your name"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={bioDefault}
            placeholder="What are you studying? What are you interested in?"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}

