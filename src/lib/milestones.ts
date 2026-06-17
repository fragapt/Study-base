// Pure, testable helpers for turning a subject's materials into AI prompts for
// study tasks or learning-path milestones.

import { normalize } from "@/lib/constants";

export interface MaterialEntry {
  name: string;
  isFolder: boolean;
}

// File names that suggest a file holds syllabus / overview / index information
// worth reading first for AI generation.
const INFORMATIVE = [
  "programa", "ementa", "syllabus", "indice", "sumario", "plano",
  "conteudo", "conteudos", "overview", "readme", "outline", "toc",
  "topicos", "objetivos", "cronograma", "index", "introducao", "introduction",
  "guia", "manual",
];

export function looksInformative(name: string): boolean {
  const n = normalize(name);
  return INFORMATIVE.some((k) => n.includes(k));
}

const JSON_INSTRUCTION =
  'Responde APENAS com JSON válido: um array de objetos {"title": string, "description": string}. ' +
  "Máximo 25 itens. Títulos curtos e claros, em português. Sem texto fora do JSON.";

function materialsBlock(
  subjectName: string,
  entries: MaterialEntry[],
  snippets: { name: string; text: string }[],
  objective = "",
): string {
  const toc = entries
    .map((e) => `${e.isFolder ? "[pasta]" : "[ficheiro]"} ${e.name}`)
    .join("\n");
  const extracts = snippets
    .map((s) => `### ${s.name}\n${s.text}`)
    .join("\n\n")
    .slice(0, 12000);
  return [
    `Cadeira: ${subjectName}`,
    objective.trim() ? `Objetivo do utilizador: ${objective.trim()}` : ``,
    ``,
    `Lista de materiais (estrutura de pastas/ficheiros):`,
    toc,
    snippets.length ? `\nExtratos de ficheiros relevantes:\n${extracts}` : ``,
  ]
    .filter((l) => l !== ``)
    .join("\n");
}

// Prompt for an editable checklist of actionable study tasks.
export function buildTasksPrompt(
  subjectName: string,
  entries: MaterialEntry[],
  snippets: { name: string; text: string }[],
  objective = "",
): string {
  return [
    "És um assistente de estudo. Com base nos materiais de uma cadeira, cria uma",
    "lista de TAREFAS de estudo acionáveis e concretas (coisas para fazer/estudar).",
    JSON_INSTRUCTION,
    "",
    materialsBlock(subjectName, entries, snippets, objective),
  ].join("\n");
}

// Prompt for an ordered learning path (sequential milestones).
export function buildMilestonesPrompt(
  subjectName: string,
  entries: MaterialEntry[],
  snippets: { name: string; text: string }[],
  objective = "",
): string {
  return [
    "És um assistente de estudo. Analisa os materiais de uma cadeira e devolve um",
    "PERCURSO DE APRENDIZAGEM: etapas (milestones) ORDENADAS e sequenciais, do",
    "básico ao avançado, seguindo a progressão sugerida pelos materiais. Cada etapa",
    "representa um marco do percurso e a sua descrição diz o que dominar nessa fase.",
    "A ordem do array É a ordem do percurso.",
    JSON_INSTRUCTION,
    "",
    materialsBlock(subjectName, entries, snippets, objective),
  ].join("\n");
}
