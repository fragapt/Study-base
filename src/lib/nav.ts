export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Painel", icon: "🏠" },
  { href: "/exames", label: "Exames", icon: "📅" },
  { href: "/drives", label: "Drives", icon: "📁" },
  { href: "/todo", label: "Tarefas", icon: "✅" },
  { href: "/cadeiras", label: "Cadeiras", icon: "📚" },
  { href: "/progresso", label: "Progresso", icon: "📊" },
  { href: "/biblioteca", label: "Biblioteca", icon: "📖" },
  { href: "/configuracao", label: "Configuração", icon: "🛠️" },
  { href: "/definicoes", label: "Definições", icon: "⚙️" },
];
