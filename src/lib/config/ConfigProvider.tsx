"use client";

import {
  createContext as makeContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import { EMPTY_CONFIG, type UserConfig } from "./types";
import type {
  DriveRow,
  SubjectRow,
  SubjectFolderRow,
  ProgressTopicRow,
  AppSettingsRow,
} from "@/lib/supabase/types";

interface ConfigContextValue {
  config: UserConfig;
  reload: () => Promise<void>;
}

const ConfigContext = makeContext<ConfigContextValue | null>(null);

// Re-fetches the full config with the browser client (RLS-scoped). Used after
// any mutation on the Configuração page.
async function fetchConfig(): Promise<UserConfig> {
  if (!HAS_SUPABASE) return EMPTY_CONFIG;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_CONFIG;

  const [drives, subjects, subjectFolders, topics, settings] = await Promise.all([
    supabase.from("drives").select("*").order("position", { ascending: true }),
    supabase.from("subjects").select("*").order("position", { ascending: true }),
    supabase.from("subject_folders").select("*"),
    supabase.from("progress_topics").select("*").order("position", { ascending: true }),
    // Never select ai_api_key here — it must not reach the browser.
    supabase
      .from("app_settings")
      .select("exam_calendar_id, ai_channel_id, ai_key_present, write_calendar_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const s = settings.data as Pick<
    AppSettingsRow,
    "exam_calendar_id" | "ai_channel_id" | "ai_key_present" | "write_calendar_id"
  > | null;

  return {
    examCalendarId: s?.exam_calendar_id ?? null,
    writeCalendarId: s?.write_calendar_id ?? null,
    aiKeyPresent: s?.ai_key_present ?? false,
    aiChannelId: s?.ai_channel_id ?? null,
    drives: (drives.data as DriveRow[] | null) ?? [],
    subjects: (subjects.data as SubjectRow[] | null) ?? [],
    subjectFolders: (subjectFolders.data as SubjectFolderRow[] | null) ?? [],
    topics: (topics.data as ProgressTopicRow[] | null) ?? [],
  };
}

export default function ConfigProvider({
  initial,
  children,
}: {
  initial: UserConfig;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<UserConfig>(initial);

  const reload = useCallback(async () => {
    setConfig(await fetchConfig());
  }, []);

  return (
    <ConfigContext.Provider value={{ config, reload }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return ctx;
}
