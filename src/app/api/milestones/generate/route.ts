import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listDriveFolder } from "@/lib/google";
import { listRepoContents } from "@/lib/github";
import { folderTarget, mimeFromName } from "@/lib/files";
import {
  looksInformative,
  buildTasksPrompt,
  buildMilestonesPrompt,
  type MaterialEntry,
} from "@/lib/milestones";
import { extractFromTargets, type ExtractTarget } from "@/lib/extract";
import { getAiCredentials, callAiForMilestones } from "@/lib/ai";
import type { SubjectRow, SubjectFolderRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Gathered {
  entries: MaterialEntry[];
  targets: ExtractTarget[];
}

// Lists each attached folder's immediate children (Drive + GitHub) → material
// entries (for deterministic titles) and readable file targets (for AI).
async function gather(folders: SubjectFolderRow[]): Promise<Gathered> {
  const entries: MaterialEntry[] = [];
  const targets: ExtractTarget[] = [];

  for (const f of folders) {
    if (f.provider === "github") {
      let items;
      try {
        items = await listRepoContents(f.repo_full ?? "", f.folder_id, f.git_ref ?? undefined);
      } catch {
        continue;
      }
      for (const it of items) {
        const isFolder = it.type === "dir";
        entries.push({ name: it.name, isFolder });
        if (!isFolder && it.downloadUrl) {
          targets.push({
            provider: "github",
            name: it.name,
            mimeType: mimeFromName(it.name),
            downloadUrl: it.downloadUrl,
          });
        }
      }
    } else {
      let files;
      try {
        files = await listDriveFolder(f.folder_id, f.resource_key ?? undefined);
      } catch {
        continue;
      }
      for (const file of files) {
        const isFolder = Boolean(folderTarget(file));
        entries.push({ name: file.name, isFolder });
        const isShortcut = file.mimeType.includes("shortcut");
        if (!isFolder && !isShortcut) {
          targets.push({
            provider: "drive",
            name: file.name,
            mimeType: file.mimeType,
            fileId: file.id,
            resourceKey: file.resourceKey,
          });
        }
      }
    }
  }
  return { entries, targets };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    subjectId?: string;
    mode?: "tasks" | "milestones";
  };
  const { subjectId, mode = "tasks" } = body;
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

  const { entries, targets } = await gather(folderRows);
  // Prioritise files whose names suggest useful info.
  const prioritised = [
    ...targets.filter((t) => looksInformative(t.name)),
    ...targets.filter((t) => !looksInformative(t.name)),
  ];
  const snippets = await extractFromTargets(prioritised);
  const subjectName = (subject as Pick<SubjectRow, "name">).name;
  const prompt =
    kind === "milestone"
      ? buildMilestonesPrompt(subjectName, entries, snippets)
      : buildTasksPrompt(subjectName, entries, snippets);

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
