export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/exames", label: "Exames", icon: "📅" },
  { href: "/drives", label: "Drives", icon: "📁" },
  { href: "/todo", label: "To-do", icon: "✅" },
  { href: "/cadeiras", label: "Cadeiras", icon: "📚" },
  { href: "/progresso", label: "Progresso", icon: "📊" },
  { href: "/definicoes", label: "Definições", icon: "⚙️" },
];
