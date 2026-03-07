# Step 2: Dashboard & Student Profiles — Setup

You now have:

- A **dashboard** at `/dashboard` that users see right after logging in.
- A **profile page** at `/profile` where students can add a photo URL, name, and bio and see other students.
- A **Supabase `profiles` table** (you just need to run the SQL below once).

Follow these steps and you’ll be ready to use it.

---

## 1. Create the `profiles` table in Supabase

1. Go to the [Supabase dashboard](https://supabase.com) and open your project.
2. In the left menu, click **SQL**.
3. Click **New query**.
4. On your computer, open this file:

   - `supabase/profiles.sql`

5. Copy everything from that file and paste it into the SQL editor.
6. Click **Run**.

If it succeeds, your database now has a `public.profiles` table with:

- `full_name` (name)
- `avatar_url` (profile photo URL)
- `bio` (short description)
- Safe **Row Level Security** so students can only create/update **their own** profile, but can **view all** students.

You only need to do this once per Supabase project.

---

## 2. How the dashboard works (`/dashboard`)

After you log in:

- The `signIn` action in `app/(auth)/actions.ts` redirects you to **`/dashboard`**.
- The page at `app/dashboard/page.tsx`:
  - Uses Supabase to check who is logged in.
  - If **not logged in**, it sends you back to `/login`.
  - If logged in, it:
    - Shows a **welcome card** with your name (or your email prefix).
    - Shows how many profiles exist in the `profiles` table.
    - Links to:
      - **Profile** (`/profile`) to edit your info.
      - **Browse students** (`/profile#students`) to see others.
    - Has a **Log out** button that calls the `signOut` server action.

You don’t need to change any code here; just use it in the browser.

---

## 3. How the profile page works (`/profile`)

The main files:

- `app/profile/page.tsx` — server component that:
  - Checks you’re logged in (otherwise redirects to `/login`).
  - Fetches **your profile row** from `public.profiles`.
  - Fetches **other students’ profiles** to list on the right.
  - Renders:
    - A **left card**: “Your profile” edit form.
    - A **right card**: “Students” list (other students).

- `app/profile/actions.ts` — server action `updateProfile`:
  - Called when you submit the profile form.
  - Uses `supabase.from("profiles").upsert(...)` to:
    - Create a new row if you don’t have one yet.
    - Or update your existing row.
  - Only writes to the row where `id = auth.uid()` (enforced by RLS).
  - Calls `revalidatePath("/profile")` and `revalidatePath("/dashboard")` so updated data shows immediately.

- `app/profile/ProfileForm.tsx` — client component:
  - Uses `useActionState` to call `updateProfile` and show:
    - Errors (e.g. if the save fails).
    - A “Profile saved.” success message.
  - Lets you edit:
    - **Profile photo URL** (any https image link).
    - **Full name**.
    - **Bio**.
  - Shows:
    - A **round avatar preview**.
    - If you don’t have a photo yet, a circle with your first initial.

On the right, “Students” shows other profiles:

- Each student has:
  - A small circular avatar (photo or initial).
  - Their name (or “Student” as fallback).
  - A short bio or a placeholder.

---

## 4. How to use it (step by step)

1. **Run the SQL once** in `supabase/profiles.sql` (see step 1).
2. In your project folder, start the dev server:

   ```bash
   npm run dev
   ```

3. In the browser, go to:

   - `http://localhost:3000/login` — log in with your university email and password.
   - You should be redirected to `http://localhost:3000/dashboard`.

4. From the dashboard:

   - Click **Edit profile** → this goes to `/profile`.
   - On `/profile`:
     - Paste an image URL in **Profile photo URL** (for now any public image URL is fine).
     - Fill in **Full name**.
     - Add a short **Bio** (what you study, interests, clubs, etc.).
     - Click **Save profile**.

5. Open a second test account (another university email), repeat the same steps:

   - Log in as the second user.
   - Go to `/profile`.
   - Set a different name & bio.
   - Now each user should see the other in the **Students** list.

---

## 5. Where to look in the code (for reference)

| Path | Purpose |
|------|---------|
| `app/dashboard/page.tsx` | Logged-in home/dashboard with welcome card and navigation. |
| `app/profile/page.tsx` | Profile + “Students” list page with auth check. |
| `app/profile/ProfileForm.tsx` | Client-side profile form (photo URL, name, bio). |
| `app/profile/actions.ts` | `updateProfile` server action that upserts into `public.profiles`. |
| `app/(auth)/actions.ts` | `signIn` now redirects to `/dashboard`; `signOut` logs out. |
| `supabase/profiles.sql` | SQL to create the `profiles` table + RLS policies and trigger. |

Once you’ve done this, you have a working **dashboard + student profile system**.  
Next we can build **connections/friends** and then **real-time messaging** on top of this. 

