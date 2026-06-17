"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import type { StudyResourceRow } from "@/lib/supabase/types";

// Loads the saved study library for one subject (newest first). RLS scopes rows
// to the user. The generator route inserts directly; call `add` with its result
// to prepend without a refetch.
export function useStudyResources(subjectId: string | null) {
  const [resources, setResources] = useState<StudyResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready] = useState(HAS_SUPABASE);

  const load = useCallback(async () => {
    if (!HAS_SUPABASE || !subjectId) {
      setResources([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("study_resources")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false });
      setResources((data as StudyResourceRow[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback((resource: StudyResourceRow) => {
    setResources((prev) => [resource, ...prev]);
  }, []);

  const remove = useCallback(async (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("study_resources").delete().eq("id", id);
    if (error) await load();
  }, [load]);

  return { resources, loading, ready, add, remove, reload: load };
}
