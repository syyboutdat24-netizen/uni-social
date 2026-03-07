import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in the browser (e.g. in Client Components).
 * Use this when you need to call Supabase from client-side code.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
