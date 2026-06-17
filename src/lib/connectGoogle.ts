"use client";

import { createClient } from "@/lib/supabase/client";

// Re-runs the Google OAuth flow requesting the Calendar scope + offline access,
// so Google returns a refresh token that /auth/callback stores. Used by the
// "Ligar Google Calendar" actions.
export async function connectGoogleCalendar(next = "/exames") {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes:
        "openid email profile https://www.googleapis.com/auth/calendar",
      queryParams: { access_type: "offline", prompt: "consent" },
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
}
