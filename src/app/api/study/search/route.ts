import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gatherFolders } from "@/lib/gather";
import { extractFromTargets } from "@/lib/extract";
import { looksInformative } from "@/lib/milestones";
import { buildRetrievalPrompt } from "@/lib/studyPrompts";
import { parseRetrieval } from "@/lib/studyContent";
import { getAiCredentials, callAiAgent } from "@/lib/ai";
import { normalize } from "@/lib/constants";
import type { MaterialTarget } from "@/lib/files";
import type { SubjectRow, SubjectFolderRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/study/search → which subject materials cover a topic/query.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    subjectId?: string;
    query?: string;
  };
  const { subjectId, query = "" } = body;
  if (!subjectId || !query.trim()) {
    return NextResponse.json(
      { error: "subjectId e query são obrigatórios" },
      { status: 400 },
    );
  }

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .maybeSingle();
  if (!subject) {
    return NextResponse.json({ error: "Cadeira não encontrada" }, { status: 404 });
  }

  const creds = await getAiCredentials(user.id);
  if (!creds) {
    return NextResponse.json(
      { error: "Configura a chave e o channel ID de IA em Configuração." },
      { status: 400 },
    );
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

  const { entries, targets } = await gatherFolders(folderRows);
  const keywords = normalize(query).split(/\s+/).filter((w) => w.length >= 4);
  const matches = (t: MaterialTarget) => {
    const n = normalize(t.name);
    return keywords.some((k) => n.includes(k)) || looksInformative(t.name);
  };
  const prioritised = [...targets.filter(matches), ...targets.filter((t) => !matches(t))];
  const snippets = await extractFromTargets(prioritised);

  const subjectName = (subject as Pick<SubjectRow, "name">).name;
  const prompt = buildRetrievalPrompt(subjectName, query.trim(), entries, snippets);

  let raw: string;
  try {
    raw = await callAiAgent(prompt, creds);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro de IA" },
      { status: 502 },
    );
  }

  return NextResponse.json({ hits: parseRetrieval(raw) });
}
