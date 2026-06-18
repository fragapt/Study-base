"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";

export interface ResourceMeta {
  id: string;
  subject_id: string;
  kind: string;
  title: string;
  created_at: string;
}

// Loads only the lightweight metadata of every saved resource (no content jsonb)
// for the Biblioteca landing counts + the dashboard "recent content" block.
export function useStudyResourceCounts() {
  const [items, setItems] = useState<ResourceMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!HAS_SUPABASE) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("study_resources")
        .select("id, subject_id, kind, title, created_at")
        .order("created_at", { ascending: false });
      setItems((data as ResourceMeta[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countBySubject = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of items) m.set(r.subject_id, (m.get(r.subject_id) ?? 0) + 1);
    return m;
  }, [items]);

  return { items, loading, countBySubject, reload: load };
}
