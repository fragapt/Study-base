import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storeRefreshToken } from "@/lib/googleOAuth";

// OAuth redirect target: exchange the code for a session cookie, then continue.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // When the user consented to the Calendar scope, Google returns a refresh
      // token — persist it (encrypted) so the app can write to their calendar.
      const userId = data.user?.id ?? data.session?.user?.id;
      const refresh = data.session?.provider_refresh_token;
      if (userId && refresh) {
        try {
          await storeRefreshToken(userId, refresh, "calendar");
        } catch {
          // Non-fatal: login still succeeds without calendar write.
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
