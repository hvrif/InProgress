import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// DEV-ONLY login shortcut. Skips the email magic link by minting a session for
// one fixed user. Disabled outside `next dev` and unless DEV_LOGIN_EMAIL and
// SUPABASE_SERVICE_ROLE_KEY are set in .env.local. The real /login is untouched.
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { origin } = new URL(request.url);
  const email = process.env.DEV_LOGIN_EMAIL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!email || !serviceKey) {
    return new NextResponse(
      "Set DEV_LOGIN_EMAIL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
      { status: 500 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } },
  );

  // generateLink creates the user if missing and does NOT send an email.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.properties?.hashed_token) {
    return new NextResponse(`Dev login failed: ${error?.message ?? "no token"}`, {
      status: 500,
    });
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) {
    return new NextResponse(`Dev login failed: ${verifyError.message}`, {
      status: 500,
    });
  }

  return NextResponse.redirect(`${origin}/`);
}
