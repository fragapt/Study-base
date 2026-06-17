import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  looksInformative,
  buildTasksPrompt,
  buildMilestonesPrompt,
} from "@/lib/milestones";
import { gatherFolders } from "@/lib/gather";
import { extractFromTargets } from "@/lib/extract";
import { getAiCredentials, callAiForMilestones } from "@/lib/ai";
import type { SubjectRow, SubjectFolderRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    subjectId?: string;
    mode?: "tasks" | "milestones";
    objective?: string;
  };
  const { subjectId, mode = "tasks", objective = "" } = body;
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId é obrigatório" }, { status: 400 });
  }
  const kind = mode === "milestones" ? "milestone" : "task";

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .maybeSingle();
  if (!subject) {
    return NextResponse.json({ error: "Cadeira não encontrada" }, { status: 404 });
  }

  const { data: folders } = await supabase
    .from("subject_folders")
    .select("*")
    .eq("subject_id", subjectId);
  const folderRows = (folders as SubjectFolderRow[] | null) ?? [];
  if (folderRows.length === 0) {
    return NextResponse.json(
      { error: "Liga pastas a esta cadeira primeiro." },
      { status: 400 },
    );
  }

  // Both modes use the AI agent and read file contents.
  const creds = await getAiCredentials(user.id);
  if (!creds) {
    return NextResponse.json(
      { error: "Configura a chave e o channel ID de IA em Configuração." },
      { status: 400 },
    );
  }

  const { entries, targets } = await gatherFolders(folderRows);
  // Prioritise files whose names suggest useful info.
  const prioritised = [
    ...targets.filter((t) => looksInformative(t.name)),
    ...targets.filter((t) => !looksInformative(t.name)),
  ];
  const snippets = await extractFromTargets(prioritised);
  const subjectName = (subject as Pick<SubjectRow, "name">).name;
  const prompt =
    kind === "milestone"
      ? buildMilestonesPrompt(subjectName, entries, snippets, objective)
      : buildTasksPrompt(subjectName, entries, snippets, objective);

  let items: { title: string; description?: string }[] = [];
  try {
    items = await callAiForMilestones(prompt, creds);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro de IA" },
      { status: 502 },
    );
  }

  if (items.length === 0) {
    return NextResponse.json({ added: 0, kind, reason: "nada gerado" });
  }

  // Skip titles that already exist for this subject + kind (case-insensitive).
  const { data: existingTopics } = await supabase
    .from("progress_topics")
    .select("title")
    .eq("subject_id", subjectId)
    .eq("kind", kind);
  const existing = new Set(
    ((existingTopics as { title: string }[] | null) ?? []).map((t) =>
      t.title.trim().toLowerCase(),
    ),
  );

  const rows = items
    .filter((m) => !existing.has(m.title.trim().toLowerCase()))
    .map((m, i) => ({
      user_id: user.id,
      subject_id: subjectId,
      title: m.title,
      description: m.description ?? null,
      position: Date.now() / 1000 + i,
      source: "ai",
      kind,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ added: 0, kind, reason: "já existem" });
  }

  const { error } = await supabase.from("progress_topics").insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ added: rows.length, kind });
}
