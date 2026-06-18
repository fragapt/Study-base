"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// Phone bottom tab bar. Drop the lowest-priority items to keep it readable.
const MOBILE_ITEMS = NAV.filter((n) =>
  ["/", "/exames", "/cadeiras", "/biblioteca", "/todo"].includes(n.href),
);

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-edge2 bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      {MOBILE_ITEMS.map((item) => {
        const on = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
              on ? "text-accent" : "text-muted",
            ].join(" ")}
          >
            <span className="text-[18px] leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
