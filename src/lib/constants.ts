// ── Static config ported from the original prototype (study-base.html) ──
// These act as seed data for Supabase and as fallbacks before the DB is wired.

export type DriveKey = "dna" | "neem" | "wannabe";

export interface DriveDef {
  key: DriveKey;
  name: string;
  folderId: string;
  color: string;
}

export const DRIVES: DriveDef[] = [
  { key: "dna", name: "DNA", folderId: "1QNE0knQxCFRlomaKCKq0oJIg-0O76K4u", color: "#4A90D9" },
  { key: "neem", name: "NEEM", folderId: "124txdIcqPreClmCCk_Pcg1S06QcLxUbQ", color: "#7DC67A" },
  { key: "wannabe", name: "Wannabe Apontamentos", folderId: "1fjmTUZyOkeE3YwxL97_erIiK6PhPn_VD", color: "#E8A838" },
];

export const DRIVE_BY_KEY: Record<DriveKey, DriveDef> = Object.fromEntries(
  DRIVES.map((d) => [d.key, d]),
) as Record<DriveKey, DriveDef>;

// Public exam calendar (filter events whose title contains "testes").
export const EXAM_CALENDAR_ID =
  "3dedf14fedcfa1802d7cf9cff01fdc08ee5c0b6e9a60c61f2d6aae0d414d8673@group.calendar.google.com";

export const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

// Subject → Drive folder mappings (prototype `SF`).
export type SubjectFolderMap = Partial<Record<DriveKey, string>>;

export interface SubjectDef {
  name: string;
  slug: string;
  color: string;
  icon: string;
  folders: SubjectFolderMap;
  // Accent-insensitive keywords used to match this subject's exam titles.
  examMatch: string[];
}

export const SUBJECTS: SubjectDef[] = [
  {
    name: "Eletricidade",
    slug: "eletricidade",
    color: "#2383e2",
    icon: "⚡",
    folders: {
      dna: "1lLHHYDta6cg5CliCKVICb1IdJ_fIFJTA",
      neem: "0B7xIfG8giVLkX29NY3Y2Y1o0emc",
      wannabe: "1r8mUvehBHbtkzn3RqQTB7DcCeelwN6Wg",
    },
    examMatch: ["eletric", "electric"],
  },
  {
    name: "CFAC — Conceção e Fabrico",
    slug: "cfac",
    color: "#4caf7d",
    icon: "🛠️",
    folders: { neem: "0B7xIfG8giVLkTW05UENSdTBOSjg" },
    examMatch: ["cfac", "concecao", "fabrico"],
  },
  {
    name: "Materiais Não-Metálicos",
    slug: "materiais-nao-metalicos",
    color: "#e8a838",
    icon: "🧪",
    folders: {
      dna: "1SI0EOGa80hIn3yN356wbBQ_bGDx-vXCE",
      neem: "1wNQj3juuabVnBAUJWoN0q-l5lyNUoQZA",
    },
    examMatch: ["materiais", "nao-met", "nao met", "metalic"],
  },
  {
    name: "Mecânica dos Sólidos",
    slug: "mecanica-dos-solidos",
    color: "#e05555",
    icon: "🔩",
    folders: {
      dna: "12HjeiNmYndMX-AeecuVs2UFs5hj0D91p",
      neem: "0B7xIfG8giVLkczZNd0tLVS1mQWc",
    },
    examMatch: ["mecanica", "solidos", "mec. solidos"],
  },
];

// Accent-insensitive substring match of an exam title against a subject.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function examMatchesSubject(title: string, subject: SubjectDef): boolean {
  const t = normalize(title);
  return subject.examMatch.some((k) => t.includes(normalize(k)));
}

export const SUBJECT_BY_SLUG: Record<string, SubjectDef> = Object.fromEntries(
  SUBJECTS.map((s) => [s.slug, s]),
);

// Curated fallback study topics per subject (prototype `FALLBACK`).
export interface TopicSeed { ti: string; de: string }

export const FALLBACK_TOPICS: Record<string, TopicSeed[]> = {
  Eletricidade: [
    { ti: "Leis de Kirchhoff", de: "Lei das correntes (nós) e lei das tensões (malhas)" },
    { ti: "Circuitos DC — Resistências", de: "Associações série/paralelo, divisores de tensão e corrente" },
    { ti: "Teoremas de Thevenin e Norton", de: "Simplificação de circuitos, cálculo de equivalentes" },
    { ti: "Condensadores e Dielétricos", de: "Capacidade, energia armazenada, associações" },
    { ti: "Indutores e Campo Magnético", de: "Indutância, lei de Faraday, energia no campo magnético" },
    { ti: "Circuitos AC — Fasores", de: "Representação fasorial, impedância, admitância" },
    { ti: "Ressonância e Filtros", de: "Frequência de ressonância, filtros passa-baixo/alta/banda" },
    { ti: "Potência em AC", de: "Potência ativa, reativa e aparente, fator de potência" },
    { ti: "Máquinas Elétricas", de: "Transformadores, princípio de funcionamento" },
    { ti: "Análise de Malhas e Nós", de: "Métodos sistemáticos de resolução de circuitos" },
    { ti: "Transitórios RC e RL", de: "Resposta natural e forçada, constante de tempo" },
    { ti: "Semicondutores e Díodos", de: "Modelo do díodo, retificação, circuitos básicos" },
  ],
  "CFAC — Conceção e Fabrico": [
    { ti: "Modelação 3D — Sólidos", de: "Extrusão, revolução, varrimento; boas práticas de modelação" },
    { ti: "Desenho Técnico e Normas", de: "Vistas, cortes, cotagem segundo normas ISO/EN" },
    { ti: "Tolerâncias Dimensionais e Geométricas", de: "Sistema ISO de tolerâncias, ajustamentos, GD&T" },
    { ti: "Processos de Maquinagem CNC", de: "Torneamento, fresagem, furação; parâmetros de corte" },
    { ti: "Programação CNC — Código G", de: "Estrutura de programa, ciclos fixos, compensação de raio" },
    { ti: "CAM — Estratégias de Maquinagem", de: "Desbaste, acabamento, geração de trajetórias" },
    { ti: "Prototipagem Rápida / Impressão 3D", de: "FDM, SLA; parâmetros e limitações" },
    { ti: "Gestão de Assemblagens", de: "Restrições, graus de liberdade, análise de interferências" },
    { ti: "Simulação e Análise FEA", de: "Malha, condições de fronteira, interpretação de resultados" },
    { ti: "Superfícies NURBS e Modelação de Forma Livre", de: "Criação e edição de superfícies complexas" },
    { ti: "Folhas de Conjunto e Explosão", de: "Documentação técnica de montagem" },
  ],
  "Materiais Não-Metálicos": [
    { ti: "Polímeros — Estrutura e Classificação", de: "Termoplásticos, termoendurecíveis, elastómeros; estrutura molecular" },
    { ti: "Propriedades Mecânicas dos Polímeros", de: "Viscoelasticidade, fluência, relaxação de tensões" },
    { ti: "Processamento de Polímeros", de: "Injeção, extrusão, sopro, termoformagem" },
    { ti: "Materiais Compósitos — Conceitos", de: "Matriz, reforço, interface; regra das misturas" },
    { ti: "Compósitos de Fibra", de: "Fibra de vidro, carbono, aramida; laminados" },
    { ti: "Cerâmicos — Estrutura e Propriedades", de: "Ligação iónica/covalente, fragilidade, dureza" },
    { ti: "Processamento de Cerâmicos", de: "Sinterização, prensagem, conformação por via húmida" },
    { ti: "Vidros", de: "Estrutura amorfa, transição vítrea, propriedades óticas" },
    { ti: "Ensaios e Caracterização", de: "Tração, dureza, impacto, análise térmica (DSC, TGA)" },
    { ti: "Degradação e Durabilidade", de: "Envelhecimento UV, hidrólise, resistência química" },
    { ti: "Seleção de Materiais", de: "Índices de desempenho, diagramas de Ashby" },
    { ti: "Materiais Avançados e Nanomateriais", de: "Grafeno, nanotubos, aplicações emergentes" },
  ],
  "Mecânica dos Sólidos": [
    { ti: "Análise de Tensão — Estado Plano", de: "Tensor de tensões, critério de Mohr, tensões principais" },
    { ti: "Análise de Deformação", de: "Extensões, distorções, compatibilidade" },
    { ti: "Lei de Hooke Generalizada", de: "Relações tensão-deformação para materiais isotrópicos" },
    { ti: "Tração/Compressão e Estaticamente Indeterminado", de: "Método da força, sobreposição" },
    { ti: "Torção de Eixos Circulares", de: "Distribuição de tensões, ângulo de torção, eixos compostos" },
    { ti: "Flexão Pura e Composta", de: "Equação da linha elástica, momentos fletores e esforços transversos" },
    { ti: "Tensões de Corte em Flexão", de: "Distribuição parabólica, perfis abertos e fechados" },
    { ti: "Deformações em Vigas", de: "Integração da equação diferencial, método dos momentos de área" },
    { ti: "Critérios de Rotura e Cedência", de: "Von Mises, Tresca, Rankine; coeficiente de segurança" },
    { ti: "Encurvadura — Coluna de Euler", de: "Cargas críticas, comprimentos efetivos, imperfeições" },
    { ti: "Fadiga", de: "Curva S-N, critério de Goodman, concentração de tensões" },
    { ti: "Análise de Estruturas Reticuladas", de: "Método dos nós, método das secções" },
  ],
};
