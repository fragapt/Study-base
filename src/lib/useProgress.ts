"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";

// Tracks which checklist topics are done for a subject (keyed by topic title).
export function useProgress(subjectSlug: string) {
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
        .from("progress")
        .select("topic_key, done")
        .eq("subject_slug", subjectSlug);
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((r: { topic_key: string; done: boolean }) => {
        map[r.topic_key] = r.done;
      });
      setDone(map);
    } finally {
      setLoading(false);
    }
  }, [subjectSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (topicKey: string, value: boolean) => {
      setDone((prev) => ({ ...prev, [topicKey]: value }));
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("progress").upsert(
        {
          user_id: user.id,
          subject_slug: subjectSlug,
          topic_key: topicKey,
          done: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,subject_slug,topic_key" },
      );
    },
    [subjectSlug],
  );

  return { done, loading, ready, toggle };
}
