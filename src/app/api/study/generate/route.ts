import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gatherFolders } from "@/lib/gather";
import { extractFromTargets } from "@/lib/extract";
import { looksInformative } from "@/lib/milestones";
import { buildStudyPrompt, type Focus } from "@/lib/studyPrompts";
import {
  parseStudyContent,
  STUDY_KINDS,
  type StudyKind,
} from "@/lib/studyContent";
import { getAiCredentials, callAiAgent } from "@/lib/ai";
import { normalize } from "@/lib/constants";
import type { MaterialTarget } from "@/lib/files";
import type { SubjectRow, SubjectFolderRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID: StudyKind[] = ["resumo", "flashcards", "quiz", "mindmap"];

interface Body {
  subjectId?: string;
  kind?: StudyKind;
  objective?: string;
  topicIds?: string[];
  documents?: MaterialTarget[];
}

// Keeps targets whose filename matches any focus keyword, then everything else —
// so AI extraction prioritises the most relevant files within the budget.
function prioritise(targets: MaterialTarget[], keywords: string[]): MaterialTarget[] {
  const matches = (t: MaterialTarget) => {
    const n = normalize(t.name);
    return keywords.some((k) => k.length >= 4 && n.includes(k)) || looksInformative(t.name);
  };
  return [...targets.filter(matches), ...targets.filter((t) => !matches(t))];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const { subjectId, kind, objective = "", topicIds = [], documents = [] } = body;
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId é obrigatório" }, { status: 400 });
  }
  if (!kind || !VALID.includes(kind)) {
    return NextResponse.json({ error: "Tipo de conteúdo inválido" }, { status: 400 });
  }

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .maybeSingle();
  if (!subject) {
    return NextResponse.json({ error: "Cadeira não encontrada" }, { status: 404 });
  }
  const subjectName = (subject as Pick<SubjectRow, "name">).name;

  // Resolve the focus: selected topic titles + selected document names.
  let topicTitles: string[] = [];
  if (topicIds.length) {
    const { data: topics } = await supabase
      .from("progress_topics")
      .select("title")
      .eq("subject_id", subjectId)
      .in("id", topicIds);
    topicTitles = ((topics as { title: string }[] | null) ?? []).map((t) => t.title);
  }
  const focus: Focus = { topics: topicTitles, documents: documents.map((d) => d.name) };

  const creds = await getAiCredentials(user.id);
  if (!creds) {
    return NextResponse.json(
      { error: "Configura a chave e o channel ID de IA em Configuração." },
      { status: 400 },
    );
  }

  // Material context: explicit documents win; otherwise scan the subject folders.
  let entries: { name: string; isFolder: boolean }[] = [];
  let targets: MaterialTarget[] = [];
  if (documents.length) {
    targets = documents;
    entries = documents.map((d) => ({ name: d.name, isFolder: false }));
  } else {
    const { data: folders } = await supabase
      .from("subject_folders")
      .select("*")
      .eq("subject_id", subjectId);
    const folderRows = (folders as SubjectFolderRow[] | null) ?? [];
    if (folderRows.length === 0) {
      return NextResponse.json(
        { error: "Liga pastas a esta cadeira ou seleciona documentos." },
        { status: 400 },
      );
    }
    const gathered = await gatherFolders(folderRows);
    entries = gathered.entries;
    const keywords = topicTitles.flatMap((t) => normalize(t).split(/\s+/));
    targets = prioritise(gathered.targets, keywords);
  }

  const snippets = await extractFromTargets(targets, documents.length ? 8 : undefined);
  const prompt = buildStudyPrompt(kind, subjectName, focus, objective, entries, snippets);

  let raw: string;
  try {
    raw = await callAiAgent(prompt, creds);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro de IA" },
      { status: 502 },
    );
  }

  const content = parseStudyContent(kind, raw);
  if (!content) {
    return NextResponse.json(
      { error: "A IA não devolveu conteúdo utilizável. Tenta de novo." },
      { status: 502 },
    );
  }

  const label = STUDY_KINDS.find((k) => k.kind === kind)?.label ?? kind;
  const base =
    objective.trim() || topicTitles[0] || focus.documents[0] || subjectName;
  const title = `${label} — ${base}`.slice(0, 140);

  const sources = [
    ...topicTitles.map((t) => ({ type: "topic" as const, name: t })),
    ...documents.map((d) => ({ type: "document" as const, name: d.name, provider: d.provider })),
  ];

  const { data: inserted, error } = await supabase
    .from("study_resources")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      kind,
      title,
      objective: objective.trim() || null,
      content,
      sources,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ resource: inserted });
}
