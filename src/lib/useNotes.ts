"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import type { NoteRow } from "@/lib/supabase/types";

export interface NoteInput {
  title: string;
  description?: string | null;
  subject_slug?: string | null;
  due_date?: string | null;
}

export function useNotes() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready] = useState(HAS_SUPABASE);

  const load = useCallback(async () => {
    if (!HAS_SUPABASE) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("done", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("position", { ascending: false });
      if (error) throw error;
      setNotes(data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addNote = useCallback(async (input: NoteInput) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Sem sessão");
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description ?? null,
        subject_slug: input.subject_slug ?? null,
        due_date: input.due_date ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    setNotes((prev) => [data as NoteRow, ...prev]);
  }, []);

  const toggleDone = useCallback(async (id: string, done: boolean) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done } : n)));
    const supabase = createClient();
    const { error } = await supabase.from("notes").update({ done }).eq("id", id);
    if (error) await load();
  }, [load]);

  const updateNote = useCallback(
    async (id: string, patch: Partial<NoteInput>) => {
      const supabase = createClient();
      const { error } = await supabase.from("notes").update(patch).eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) await load();
  }, [load]);

  return {
    notes,
    loading,
    error,
    ready,
    addNote,
    toggleDone,
    updateNote,
    deleteNote,
    reload: load,
  };
}
