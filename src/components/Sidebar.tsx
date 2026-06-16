"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex w-[216px] shrink-0 flex-col overflow-y-auto border-r border-edge2 bg-sidebar py-2.5">
      <div className="mb-1.5 flex items-center gap-2.5 border-b border-edge2 px-3.5 pb-3 pt-2 text-sm font-bold">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[5px] bg-accent text-sm">
          📚
        </span>
        Base de Estudo
      </div>

      {NAV.map((item) => {
        const on = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-2.5 px-3.5 py-[7px] text-[13.5px] transition-colors",
              on
                ? "bg-accentSoft text-accent"
                : "text-muted hover:bg-card2 hover:text-fg",
            ].join(" ")}
          >
            <span className="w-5 text-center text-[15px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
