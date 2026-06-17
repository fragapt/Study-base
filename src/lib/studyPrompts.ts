// Pure prompt builders for the study-content generator and material retrieval.
// No server imports — the API routes compose these and send them to the IAedu
// agent. Each builder embeds the user's free-text objective and a strict,
// kind-specific JSON (or Markdown) output instruction.

import type { MaterialEntry } from "@/lib/milestones";
import type { StudyKind } from "@/lib/studyContent";

export interface Snippet {
  name: string;
  text: string;
}

// What the generation is focused on: selected topic titles and/or document names.
export interface Focus {
  topics: string[];
  documents: string[];
}

function focusBlock(focus: Focus): string {
  const lines: string[] = [];
  if (focus.topics.length) {
    lines.push(`Tópicos selecionados:\n- ${focus.topics.join("\n- ")}`);
  }
  if (focus.documents.length) {
    lines.push(`Documentos selecionados:\n- ${focus.documents.join("\n- ")}`);
  }
  return lines.join("\n\n");
}

function materialsBlock(entries: MaterialEntry[], snippets: Snippet[]): string {
  const toc = entries
    .map((e) => `${e.isFolder ? "[pasta]" : "[ficheiro]"} ${e.name}`)
    .join("\n");
  const extracts = snippets
    .map((s) => `### ${s.name}\n${s.text}`)
    .join("\n\n")
    .slice(0, 14000);
  return [
    toc ? `Materiais disponíveis:\n${toc}` : "",
    snippets.length ? `\nExtratos dos materiais relevantes:\n${extracts}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function objectiveBlock(objective: string): string {
  const o = objective.trim();
  return o ? `Objetivo do utilizador: ${o}` : "";
}

function header(
  subjectName: string,
  focus: Focus,
  objective: string,
  entries: MaterialEntry[],
  snippets: Snippet[],
): string {
  return [
    `Cadeira: ${subjectName}`,
    objectiveBlock(objective),
    focusBlock(focus),
    "",
    materialsBlock(entries, snippets),
  ]
    .filter(Boolean)
    .join("\n");
}

const RESUMO_INSTRUCTION =
  "Escreve um RESUMO de estudo claro e bem estruturado em Markdown (títulos, " +
  "listas, negrito quando útil), focado nos tópicos/documentos selecionados e " +
  "no objetivo. Sem preâmbulos nem despedidas — apenas o resumo.";

const FLASHCARDS_INSTRUCTION =
  'Responde APENAS com JSON válido: um array de objetos {"front": string, ' +
  '"back": string} (pergunta/conceito na frente, resposta/explicação no verso). ' +
  "Entre 8 e 30 cartões, em português. Sem texto fora do JSON.";

const QUIZ_INSTRUCTION =
  'Responde APENAS com JSON válido: um array de objetos {"question": string, ' +
  '"options": string[] (3 a 4), "answerIndex": number (índice 0-based da opção ' +
  'correta), "explanation": string}. Entre 5 e 15 perguntas, em português. ' +
  "Sem texto fora do JSON.";

const MINDMAP_INSTRUCTION =
  'Responde APENAS com JSON válido: um objeto {"title": string, "children": ' +
  '[{"title": string, "children": [...]}]} representando um mapa mental ' +
  "hierárquico (até 4 níveis), em português. Sem texto fora do JSON.";

export function buildStudyPrompt(
  kind: StudyKind,
  subjectName: string,
  focus: Focus,
  objective: string,
  entries: MaterialEntry[],
  snippets: Snippet[],
): string {
  const instruction =
    kind === "resumo"
      ? RESUMO_INSTRUCTION
      : kind === "flashcards"
        ? FLASHCARDS_INSTRUCTION
        : kind === "quiz"
          ? QUIZ_INSTRUCTION
          : MINDMAP_INSTRUCTION;
  return [
    "És um assistente de estudo. Com base nos materiais da cadeira indicados,",
    "gera conteúdo de estudo focado na seleção e no objetivo do utilizador.",
    instruction,
    "",
    header(subjectName, focus, objective, entries, snippets),
  ].join("\n");
}

// Asks the agent which of the listed materials are relevant to a search query.
export function buildRetrievalPrompt(
  subjectName: string,
  query: string,
  entries: MaterialEntry[],
  snippets: Snippet[],
): string {
  return [
    "És um assistente de estudo. Indica QUAIS dos materiais listados abordam o",
    `tópico procurado e porquê. Tópico/pesquisa: "${query}".`,
    'Responde APENAS com JSON válido: um array de objetos {"name": string (nome ' +
      'exato do ficheiro), "reason": string (porque é relevante, 1 frase)}. ' +
      "Inclui apenas materiais relevantes. Sem texto fora do JSON.",
    "",
    `Cadeira: ${subjectName}`,
    "",
    materialsBlock(entries, snippets),
  ].join("\n");
}
