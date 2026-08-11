"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "@/components/ui/icons";
import { useTheme } from "@/components/providers/theme-provider";
import { ACCENTS, type Accent, type Theme } from "@/lib/theme";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Sidebar account switcher. Expands into the profile card with the
 * "Change Theme", "Color Mode" and "Settings" rows shown in the design.
 */
export function UserMenu() {
  const { theme, accent, setTheme, setAccent } = useTheme();
  const { user, logout } = useAuth();
  const activeAccent = ACCENTS.find((a) => a.id === accent) ?? ACCENTS[1];
  const currentUser = {
    name: user?.name ?? "Guest",
    avatar: user?.avatar ?? null,
  };

  return (
    <Menu className="w-full">
      <MenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--hover)]">
        <Avatar name={currentUser.name} src={currentUser.avatar} size="md" />
        <span className="flex-1 truncate text-[13px] font-medium text-[var(--text)]">
          {currentUser.name}
        </span>
        <ChevronsUpDownIcon size={14} className="shrink-0 text-[var(--text-subtle)]" />
      </MenuTrigger>

      <MenuContent className="w-[218px] p-0" sideOffset={4}>
        {/* Profile summary */}
        <div className="flex flex-col items-center gap-1 border-b border-[var(--border)] px-3 py-4">
          <Avatar name={currentUser.name} src={currentUser.avatar} size="xl" />
          <span className="mt-1 text-[13px] font-medium text-[var(--text)]">
            {currentUser.name}
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            {currentUser.name.toLowerCase()}@gmail.com
          </span>
        </div>

        <div className="p-1">
          <MenuSub
            label="Change Theme"
            icon={theme === "dark" ? <MoonIcon size={14} /> : <SunIcon size={14} />}
          >
            <MenuLabel>Theme</MenuLabel>
            {(
              [
                { id: "light", label: "Light", icon: <SunIcon size={14} /> },
                { id: "dark", label: "Dark", icon: <MoonIcon size={14} /> },
              ] as { id: Theme; label: string; icon: React.ReactNode }[]
            ).map((option) => (
              <MenuItem
                key={option.id}
                icon={option.icon}
                selected={theme === option.id}
                onSelect={() => setTheme(option.id)}
              >
                {option.label}
              </MenuItem>
            ))}
          </MenuSub>

          <MenuSub
            label="Color Mode"
            icon={
              <span
                className="h-3 w-3 rounded-[3px]"
                style={{ backgroundColor: activeAccent.swatch }}
              />
            }
          >
            <MenuLabel>Color Mode</MenuLabel>
            {ACCENTS.map((option) => (
              <MenuItem
                key={option.id}
                icon={
                  <span
                    className="h-3 w-3 rounded-[3px]"
                    style={{ backgroundColor: option.swatch }}
                  />
                }
                selected={accent === option.id}
                onSelect={() => setAccent(option.id as Accent)}
              >
                {option.label}
              </MenuItem>
            ))}
          </MenuSub>

          <Link
            href="/settings"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
          >
            <span className="flex w-4 shrink-0 justify-center text-[var(--text-muted)]">
              <SettingsIcon size={14} />
            </span>
            Settings
          </Link>

          <MenuSeparator />

          <MenuItem icon={<LogOutIcon size={14} />} onSelect={logout}>
            Log out
          </MenuItem>
        </div>
      </MenuContent>
    </Menu>
  );
}
