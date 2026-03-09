"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileResult } from "./actions";

type ProfileFormProps = {
  initialProfile: {
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    role: string | null;
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
  const roleDefault = initialProfile?.role ?? "";

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <h2 className="text-xl font-bold text-white">Your Profile</h2>
      <p className="mt-1 text-sm text-zinc-400">
        This is what other Sunway students will see.
      </p>

      {state && "error" in state && (
        <p className="mt-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="mt-4 rounded-lg bg-emerald-900/30 p-3 text-sm text-emerald-300">Profile saved!</p>
      )}

      <form action={formAction} className="mt-6 space-y-5">
        {/* Avatar Preview */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-lg font-bold text-white">
            {avatarDefault
              ? <img src={avatarDefault} alt="Profile" className="h-full w-full object-cover" />
              : <span>{fullNameDefault ? fullNameDefault[0]?.toUpperCase() : "S"}</span>}
          </div>
          <p className="text-xs text-zinc-400">Paste a link to a square image for your profile photo.</p>
        </div>

        {/* Avatar URL */}
        <div className="space-y-1">
          <label htmlFor="avatar_url" className="block text-sm font-medium text-zinc-300">Profile photo URL</label>
          <input
            id="avatar_url" name="avatar_url" type="url"
            defaultValue={avatarDefault} placeholder="https://..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-300">Full name</label>
          <input
            id="full_name" name="full_name" type="text"
            defaultValue={fullNameDefault} placeholder="Your name"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label htmlFor="bio" className="block text-sm font-medium text-zinc-300">Bio</label>
          <textarea
            id="bio" name="bio" rows={4}
            defaultValue={bioDefault}
            placeholder="What are you studying? What are you interested in?"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Role */}
        <div className="space-y-1">
          <label htmlFor="role" className="block text-sm font-medium text-zinc-300">Program</label>
          <select
            id="role" name="role" defaultValue={roleDefault}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select your program</option>
            <option value="CIMP">CIMP</option>
            <option value="AUSMAT">AUSMAT</option>
            <option value="MUFY">MUFY</option>
            <option value="FIA">FIA</option>
            <option value="A-Levels">A-Levels</option>
            <option value="FIS">FIS</option>
            <option value="PhD">PhD</option>
            <option value="Master's">Master's</option>
            <option value="ADP">ADP</option>
            <option value="Bachelor's">Bachelor's</option>
            <option value="Diploma">Diploma</option>
          </select>
        </div>

        <button type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-sm font-medium transition">
          Save profile
        </button>
      </form>
    </div>
  );
}