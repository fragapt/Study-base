import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ConfigProvider from "@/lib/config/ConfigProvider";
import { HAS_SUPABASE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loadUserConfig } from "@/lib/userConfig";

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

  const config = await loadUserConfig();

  return (
    <ConfigProvider initial={config}>
      <AppShell>{children}</AppShell>
    </ConfigProvider>
  );
}
