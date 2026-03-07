# Step 1: Sign-up & Login (University Email Only) — Setup

You now have sign-up and login pages that **only allow your university email domain**. Here’s what was added and how to finish setup.

---

## What was built

1. **Supabase connection**  
   - Browser and server Supabase clients so the app can talk to Supabase from the frontend and backend.  
   - Middleware that refreshes the auth session on each request so users stay logged in.

2. **University-only emails**  
   - Only emails ending with your configured domain (e.g. `@youruniversity.edu`) can sign up or log in.  
   - This is checked on the server so it can’t be bypassed from the browser.

3. **Pages**  
   - **Home (`/`)** – Links to Log in and Sign up.  
   - **Login (`/login`)** – Email + password, university domain required.  
   - **Sign up (`/signup`)** – Same; after sign-up Supabase sends a confirmation email.

4. **Auth flow**  
   - Sign up → Supabase sends a confirmation email → user clicks the link → they can log in with the same email and password.

---

## What you need to do

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).  
2. Click **New project**, choose your org, name the project (e.g. `uni-social`), set a database password, and create the project.  
3. Wait until the project is ready.

### 2. Get your project URL and key

1. In the Supabase dashboard, open your project.  
2. Go to **Settings** (gear icon) → **API**.  
3. Copy:  
   - **Project URL**  
   - **anon public** key (under “Project API keys”).

### 3. Create `.env.local` in the project root

In the `uni-social` folder (same level as `package.json`), create a file named `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=paste-your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
ALLOWED_EMAIL_DOMAIN=youruniversity.edu
```

- Replace the URL and key with the values from step 2.  
- Replace `youruniversity.edu` with your real university email domain (e.g. `stanford.edu`, `mit.edu`). Use only the domain part, **no** `@`.

### 4. Turn on Email auth in Supabase (if needed)

1. In the dashboard go to **Authentication** → **Providers**.  
2. Make sure **Email** is enabled.  
3. Under **Authentication** → **Email Templates** you can edit the “Confirm signup” email if you want (optional).

### 5. Run the app and test

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see:

- Home with “Log in” and “Sign up”.  
- **Sign up** with a `@youruniversity.edu` email (or whatever you set in `ALLOWED_EMAIL_DOMAIN`).  
- After sign-up, check that email and confirm.  
- **Log in** with the same email and password.  
- Using a different domain (e.g. `@gmail.com`) should show an error that only your university domain is allowed.

---

## File overview (for reference)

| Path | Purpose |
|------|--------|
| `lib/supabase/client.ts` | Supabase client for the browser (e.g. Client Components). |
| `lib/supabase/server.ts` | Supabase client for the server (Server Components, Server Actions). |
| `lib/supabase/middleware.ts` | Refreshes the auth session on each request. |
| `lib/auth.ts` | University email domain check and allowed domain helper. |
| `middleware.ts` | Runs the Supabase session refresh for every request. |
| `app/(auth)/actions.ts` | Server actions: `signUp` and `signIn` (with domain check). |
| `app/(auth)/login/page.tsx` | Login page. |
| `app/(auth)/signup/page.tsx` | Sign-up page. |
| `app/(auth)/LoginForm.tsx` | Client form for login (shows errors from server). |
| `app/(auth)/SignupForm.tsx` | Client form for sign-up (shows errors from server). |
| `.env.local.example` | Example env vars; copy to `.env.local` and fill in. |

When you’re ready, we can move on to **Step 2: Student profile page** (photo, name, bio).
