// ── Default configuration template ──────────────────────────────────────
// This is NO LONGER the app's live config. Drives, subjects, folder mappings,
// study topics and the exam calendar now live in per-user Supabase tables
// (see supabase/migrations/0002_user_config.sql). This module only provides:
//   • DEFAULT_TEMPLATE — seed data a user can import into their own profile.
//   • shared, dependency-free helpers (normalize, examMatches).

// ── Matching helpers ────────────────────────────────────────────────────

// Accent-insensitive lowercasing for fuzzy title matching.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// True if an exam title matches any of a subject's keywords (accent-insensitive).
export function examMatches(title: string, keywords: string[]): boolean {
  const t = normalize(title);
  return keywords.some((k) => k && t.includes(normalize(k)));
}

// ── Template shapes ─────────────────────────────────────────────────────

export interface TemplateDrive {
  key: string; // stable handle linking subject folders to a drive in the seed
  name: string;
  folderId: string;
  resourceKey?: string;
  color: string;
}

export interface TemplateSubjectFolder {
  driveKey: string;
  folderId: string;
  resourceKey?: string;
  name?: string;
}

export interface TemplateTopic {
  title: string;
  description: string;
}

export interface TemplateSubject {
  slug: string;
  name: string;
  color: string;
  icon: string;
  examMatch: string[];
  folders: TemplateSubjectFolder[];
  topics: TemplateTopic[];
}

export interface ConfigTemplate {
  examCalendarId: string;
  drives: TemplateDrive[];
  subjects: TemplateSubject[];
}

// ── The L.EM template (the original prototype's setup) ───────────────────
// Legacy NEEM folders (0B7x… IDs) carry resource keys, required to list them.

export const DEFAULT_TEMPLATE: ConfigTemplate = {
  examCalendarId:
    "3dedf14fedcfa1802d7cf9cff01fdc08ee5c0b6e9a60c61f2d6aae0d414d8673@group.calendar.google.com",
  drives: [
    { key: "dna", name: "DNA", folderId: "1QNE0knQxCFRlomaKCKq0oJIg-0O76K4u", color: "#4A90D9" },
    {
      key: "neem",
      name: "NEEM",
      folderId: "124txdIcqPreClmCCk_Pcg1S06QcLxUbQ",
      color: "#7DC67A",
    },
    {
      key: "wannabe",
      name: "Wannabe Apontamentos",
      folderId: "1fjmTUZyOkeE3YwxL97_erIiK6PhPn_VD",
      color: "#E8A838",
    },
  ],
  subjects: [
    {
      slug: "eletricidade",
      name: "Eletricidade",
      color: "#2383e2",
      icon: "⚡",
      examMatch: ["eletric", "electric"],
      folders: [
        { driveKey: "dna", folderId: "1lLHHYDta6cg5CliCKVICb1IdJ_fIFJTA", name: "Eletricidade" },
        {
          driveKey: "neem",
          folderId: "0B7xIfG8giVLkX29NY3Y2Y1o0emc",
          resourceKey: "0-4M3s2pSbmY_XSQe11n3jEQ",
          name: "Eletricidade",
        },
        { driveKey: "wannabe", folderId: "1r8mUvehBHbtkzn3RqQTB7DcCeelwN6Wg", name: "Eletricidade" },
      ],
      topics: [
        { title: "Leis de Kirchhoff", description: "Lei das correntes (nós) e lei das tensões (malhas)" },
        { title: "Circuitos DC — Resistências", description: "Associações série/paralelo, divisores de tensão e corrente" },
        { title: "Teoremas de Thevenin e Norton", description: "Simplificação de circuitos, cálculo de equivalentes" },
        { title: "Condensadores e Dielétricos", description: "Capacidade, energia armazenada, associações" },
        { title: "Indutores e Campo Magnético", description: "Indutância, lei de Faraday, energia no campo magnético" },
        { title: "Circuitos AC — Fasores", description: "Representação fasorial, impedância, admitância" },
        { title: "Ressonância e Filtros", description: "Frequência de ressonância, filtros passa-baixo/alta/banda" },
        { title: "Potência em AC", description: "Potência ativa, reativa e aparente, fator de potência" },
        { title: "Máquinas Elétricas", description: "Transformadores, princípio de funcionamento" },
        { title: "Análise de Malhas e Nós", description: "Métodos sistemáticos de resolução de circuitos" },
        { title: "Transitórios RC e RL", description: "Resposta natural e forçada, constante de tempo" },
        { title: "Semicondutores e Díodos", description: "Modelo do díodo, retificação, circuitos básicos" },
      ],
    },
    {
      slug: "cfac",
      name: "CFAC — Conceção e Fabrico",
      color: "#4caf7d",
      icon: "🛠️",
      examMatch: ["cfac", "concecao", "fabrico"],
      folders: [
        {
          driveKey: "neem",
          folderId: "0B7xIfG8giVLkTW05UENSdTBOSjg",
          resourceKey: "0-HCWgkiaKLdvTaYjRqwGsAQ",
          name: "CFAC",
        },
      ],
      topics: [
        { title: "Modelação 3D — Sólidos", description: "Extrusão, revolução, varrimento; boas práticas de modelação" },
        { title: "Desenho Técnico e Normas", description: "Vistas, cortes, cotagem segundo normas ISO/EN" },
        { title: "Tolerâncias Dimensionais e Geométricas", description: "Sistema ISO de tolerâncias, ajustamentos, GD&T" },
        { title: "Processos de Maquinagem CNC", description: "Torneamento, fresagem, furação; parâmetros de corte" },
        { title: "Programação CNC — Código G", description: "Estrutura de programa, ciclos fixos, compensação de raio" },
        { title: "CAM — Estratégias de Maquinagem", description: "Desbaste, acabamento, geração de trajetórias" },
        { title: "Prototipagem Rápida / Impressão 3D", description: "FDM, SLA; parâmetros e limitações" },
        { title: "Gestão de Assemblagens", description: "Restrições, graus de liberdade, análise de interferências" },
        { title: "Simulação e Análise FEA", description: "Malha, condições de fronteira, interpretação de resultados" },
        { title: "Superfícies NURBS e Modelação de Forma Livre", description: "Criação e edição de superfícies complexas" },
        { title: "Folhas de Conjunto e Explosão", description: "Documentação técnica de montagem" },
      ],
    },
    {
      slug: "materiais-nao-metalicos",
      name: "Materiais Não-Metálicos",
      color: "#e8a838",
      icon: "🧪",
      examMatch: ["materiais", "nao-met", "nao met", "metalic"],
      folders: [
        { driveKey: "dna", folderId: "1SI0EOGa80hIn3yN356wbBQ_bGDx-vXCE", name: "Materiais Não-Metálicos" },
        { driveKey: "neem", folderId: "1wNQj3juuabVnBAUJWoN0q-l5lyNUoQZA", name: "Materiais Não-Metálicos" },
      ],
      topics: [
        { title: "Polímeros — Estrutura e Classificação", description: "Termoplásticos, termoendurecíveis, elastómeros; estrutura molecular" },
        { title: "Propriedades Mecânicas dos Polímeros", description: "Viscoelasticidade, fluência, relaxação de tensões" },
        { title: "Processamento de Polímeros", description: "Injeção, extrusão, sopro, termoformagem" },
        { title: "Materiais Compósitos — Conceitos", description: "Matriz, reforço, interface; regra das misturas" },
        { title: "Compósitos de Fibra", description: "Fibra de vidro, carbono, aramida; laminados" },
        { title: "Cerâmicos — Estrutura e Propriedades", description: "Ligação iónica/covalente, fragilidade, dureza" },
        { title: "Processamento de Cerâmicos", description: "Sinterização, prensagem, conformação por via húmida" },
        { title: "Vidros", description: "Estrutura amorfa, transição vítrea, propriedades óticas" },
        { title: "Ensaios e Caracterização", description: "Tração, dureza, impacto, análise térmica (DSC, TGA)" },
        { title: "Degradação e Durabilidade", description: "Envelhecimento UV, hidrólise, resistência química" },
        { title: "Seleção de Materiais", description: "Índices de desempenho, diagramas de Ashby" },
        { title: "Materiais Avançados e Nanomateriais", description: "Grafeno, nanotubos, aplicações emergentes" },
      ],
    },
    {
      slug: "mecanica-dos-solidos",
      name: "Mecânica dos Sólidos",
      color: "#e05555",
      icon: "🔩",
      examMatch: ["mecanica", "solidos", "mec. solidos"],
      folders: [
        { driveKey: "dna", folderId: "12HjeiNmYndMX-AeecuVs2UFs5hj0D91p", name: "Mecânica dos Sólidos" },
        {
          driveKey: "neem",
          folderId: "0B7xIfG8giVLkczZNd0tLVS1mQWc",
          resourceKey: "0-AxrNs3rExQqNIMgxT7aiZg",
          name: "Mecânica dos Sólidos",
        },
      ],
      topics: [
        { title: "Análise de Tensão — Estado Plano", description: "Tensor de tensões, critério de Mohr, tensões principais" },
        { title: "Análise de Deformação", description: "Extensões, distorções, compatibilidade" },
        { title: "Lei de Hooke Generalizada", description: "Relações tensão-deformação para materiais isotrópicos" },
        { title: "Tração/Compressão e Estaticamente Indeterminado", description: "Método da força, sobreposição" },
        { title: "Torção de Eixos Circulares", description: "Distribuição de tensões, ângulo de torção, eixos compostos" },
        { title: "Flexão Pura e Composta", description: "Equação da linha elástica, momentos fletores e esforços transversos" },
        { title: "Tensões de Corte em Flexão", description: "Distribuição parabólica, perfis abertos e fechados" },
        { title: "Deformações em Vigas", description: "Integração da equação diferencial, método dos momentos de área" },
        { title: "Critérios de Rotura e Cedência", description: "Von Mises, Tresca, Rankine; coeficiente de segurança" },
        { title: "Encurvadura — Coluna de Euler", description: "Cargas críticas, comprimentos efetivos, imperfeições" },
        { title: "Fadiga", description: "Curva S-N, critério de Goodman, concentração de tensões" },
        { title: "Análise de Estruturas Reticuladas", description: "Método dos nós, método das secções" },
      ],
    },
  ],
};

export const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
