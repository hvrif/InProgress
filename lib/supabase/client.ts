import { createBrowserClient } from "@supabase/ssr";

// Not parameterized with a generated Database type: we don't have a live
// Supabase project to run `supabase gen types typescript` against yet.
// Query results are cast to the interfaces in lib/types.ts at the call site.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
