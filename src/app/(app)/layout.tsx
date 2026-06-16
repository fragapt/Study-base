import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { HAS_SUPABASE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce auth once Supabase is configured. Middleware also guards, but this
  // keeps Server Components from rendering for signed-out users.
  if (HAS_SUPABASE) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
