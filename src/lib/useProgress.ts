"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";

// Tracks which study topics are done for the current user, keyed by topic id
// (topic_progress table). RLS scopes rows to the user, so we load them all.
export function useProgress() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const ready = HAS_SUPABASE;

  const load = useCallback(async () => {
    if (!HAS_SUPABASE) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("topic_progress")
        .select("topic_id, done");
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((r: { topic_id: string; done: boolean }) => {
        map[r.topic_id] = r.done;
      });
      setDone(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(async (topicId: string, value: boolean) => {
    setDone((prev) => ({ ...prev, [topicId]: value }));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("topic_progress").upsert(
      {
        user_id: user.id,
        topic_id: topicId,
        done: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_id" },
    );
  }, []);

  return { done, loading, ready, toggle };
}
