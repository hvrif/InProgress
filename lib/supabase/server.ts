import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Not parameterized with a generated Database type: we don't have a live
// Supabase project to run `supabase gen types typescript` against yet.
// Query results are cast to the interfaces in lib/types.ts at the call site.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore because
            // middleware.ts refreshes the session on every request instead.
          }
        },
      },
    },
  );
}
