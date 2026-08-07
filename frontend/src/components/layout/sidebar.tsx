"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/user-menu";
import { CaretDownIcon, ProjectsIcon, TasksIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
      <div className="p-2">
        <UserMenu />
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[12px] font-medium text-[var(--text-muted)]">Workspace</span>
          <CaretDownIcon size={12} className="text-[var(--text-subtle)]" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          // Nested routes (e.g. /tasks/b-1) keep the parent item highlighted.
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-[var(--hover)] font-medium text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
              )}
            >
              <Icon size={15} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
