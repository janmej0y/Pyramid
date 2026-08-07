"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeftIcon,
  CheckIcon,
  MoonIcon,
  PencilIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from "@/components/ui/icons";
import { useTheme } from "@/components/providers/theme-provider";
import { ACCENTS, type Accent, type Theme } from "@/lib/theme";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

type Section = "profile" | "theme" | "color";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <UserIcon size={14} /> },
  { id: "theme", label: "Theme", icon: <SunIcon size={14} /> },
  { id: "color", label: "Color", icon: null },
];

/** Read-only field row from the Profile card. */
function Field({
  label,
  hint,
  value,
  editable,
}: {
  label: string;
  hint?: string;
  value: string;
  editable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[12.5px] text-[var(--text)]">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{hint}</p> : null}
      </div>

      {editable ? (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[12.5px] text-[var(--text-muted)]">{value}</span>
          <button
            type="button"
            aria-label={`Edit ${label}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <PencilIcon size={13} />
          </button>
        </div>
      ) : (
        <div className="w-[168px] shrink-0 rounded-md bg-[var(--hover)] px-3 py-1.5 text-[12.5px] text-[var(--text-muted)]">
          {value}
        </div>
      )}
    </div>
  );
}

export function SettingsView() {
  const [section, setSection] = useState<Section>("profile");
  const [query, setQuery] = useState("");
  const { theme, accent, setTheme, setAccent } = useTheme();
  const { user } = useAuth();
  const currentUser = {
    name: user?.name ?? "Guest",
    avatar: user?.avatar ?? null,
  };

  const visibleNav = NAV.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const activeAccent = ACCENTS.find((a) => a.id === accent) ?? ACCENTS[1];

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      {/* Settings sidebar */}
      <aside className="hidden w-[210px] shrink-0 border-r border-[var(--border)] px-3 py-3 md:block">
        <Link
          href="/tasks"
          className="mb-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <ArrowLeftIcon size={14} />
          Back to app
        </Link>

        <div className="mb-3 flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5">
          <SearchIcon size={13} className="shrink-0 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search settings"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
          />
        </div>

        <nav className="flex flex-col gap-0.5">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors",
                section === item.id
                  ? "bg-[var(--hover)] font-medium text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
              )}
            >
              <span className="flex w-4 shrink-0 justify-center">
                {item.id === "color" ? (
                  <span
                    className="h-3 w-3 rounded-[3px]"
                    style={{ backgroundColor: activeAccent.swatch }}
                  />
                ) : (
                  item.icon
                )}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 overflow-auto px-4 py-8 sm:px-8">
        {/* Mobile section switcher */}
        <div className="mb-5 flex gap-1.5 md:hidden">
          <Link
            href="/tasks"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-[12px] text-[var(--text-muted)]"
          >
            <ArrowLeftIcon size={13} />
            Back
          </Link>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "h-8 rounded-md border px-2.5 text-[12px] transition-colors",
                section === item.id
                  ? "border-[var(--border-strong)] bg-[var(--hover)] font-medium text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-muted)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-[600px]">
          {section === "profile" ? (
            <>
              <h1 className="mb-5 text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]">
                Profile
              </h1>

              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3.5">
                  <p className="text-[12.5px] text-[var(--text)]">Profile picture</p>
                  <Avatar name={currentUser.name} src={currentUser.avatar} size="lg" />
                </div>

                <Field label="Email" value="dexter@gmail.com" editable />
                <Field label="Full name" value={currentUser.name} />
                <Field label="Title" hint="Your job title or role" value="Designer" />
                <Field
                  label="Username"
                  hint="One word, like a nickname or first name"
                  value="Dexuser"
                />
              </div>

              <h2 className="mb-3 mt-8 text-[14px] font-medium text-[var(--text)]">
                Workspace access
              </h2>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                <p className="text-[12.5px] text-[var(--text-muted)]">
                  Remove yourself from the workspace
                </p>
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-[var(--danger-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--danger-fg)] transition-opacity hover:opacity-90"
                >
                  Leave Workspace
                </button>
              </div>
            </>
          ) : null}

          {section === "theme" ? (
            <>
              <h1 className="mb-5 text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]">
                Theme
              </h1>
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {(
                  [
                    { id: "light", label: "Light", icon: <SunIcon size={14} /> },
                    { id: "dark", label: "Dark", icon: <MoonIcon size={14} /> },
                  ] as { id: Theme; label: string; icon: React.ReactNode }[]
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[var(--hover)]"
                  >
                    <span className="text-[var(--text-muted)]">{option.icon}</span>
                    <span className="flex-1 text-[12.5px] text-[var(--text)]">{option.label}</span>
                    {theme === option.id ? <CheckIcon size={15} /> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {section === "color" ? (
            <>
              <h1 className="mb-5 text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]">
                Color
              </h1>
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {ACCENTS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAccent(option.id as Accent)}
                    className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[var(--hover)]"
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-[4px]"
                      style={{ backgroundColor: option.swatch }}
                    />
                    <span className="flex-1 text-[12.5px] text-[var(--text)]">{option.label}</span>
                    {accent === option.id ? <CheckIcon size={15} /> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
