"use client";

import { useRef, useState } from "react";
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
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type Section = "profile" | "theme" | "color";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <UserIcon size={14} /> },
  { id: "theme", label: "Theme", icon: <SunIcon size={14} /> },
  { id: "color", label: "Color", icon: null },
];

/**
 * Editable field row from the Profile card. Saves on blur/Enter so there is no
 * separate save button — the design shows none.
 */
function Field({
  label,
  hint,
  value,
  onSave,
  showPencil,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onSave: (next: string) => Promise<void>;
  showPencil?: boolean;
  type?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Adopt a new upstream value during render, so a refetch doesn't cause a
  // second cascading render.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  async function commit() {
    if (draft.trim() === value.trim()) {
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[12.5px] text-[var(--text)]">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{hint}</p> : null}
        {error ? (
          <p role="alert" className="mt-0.5 text-[11px] text-[var(--danger-fg)]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <input
          ref={inputRef}
          type={type}
          value={draft}
          disabled={saving}
          aria-label={label}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            }
            if (e.key === "Escape") {
              setDraft(value);
              setError(null);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            "w-[168px] rounded-md bg-[var(--hover)] px-3 py-1.5 text-[12.5px] text-[var(--text)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-60",
            showPencil && "bg-transparent text-right text-[var(--text-muted)]",
          )}
        />
        {showPencil ? (
          <button
            type="button"
            aria-label={`Edit ${label}`}
            onClick={() => inputRef.current?.focus()}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <PencilIcon size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsView() {
  const [section, setSection] = useState<Section>("profile");
  const [query, setQuery] = useState("");
  const { theme, accent, setTheme, setAccent } = useTheme();
  const { user, logout } = useAuth();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const currentUser = {
    name: user?.name ?? "Guest",
    avatar: user?.avatar ?? null,
  };

  const { data: profile, reload: reloadProfile } = useAsync(() => api.me(), []);

  async function saveProfile(patch: Parameters<typeof api.updateProfile>[0]) {
    await api.updateProfile(patch);
    reloadProfile();
  }

  const visibleNav = NAV.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const activeAccent = ACCENTS.find((a) => a.id === accent) ?? ACCENTS[1];

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      {confirmLeave ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmLeave(false);
          }}
        >
          <div className="w-full max-w-[340px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-menu)]">
            <h2 id="leave-title" className="text-[14px] font-semibold text-[var(--text)]">
              Leave workspace?
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              You will be signed out and returned to the login screen.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="h-8 rounded-md border border-[var(--border)] px-3 text-[12.5px] text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={logout}
                className="h-8 rounded-md bg-[var(--danger-bg)] px-3 text-[12.5px] font-medium text-[var(--danger-fg)] transition-opacity hover:opacity-90"
              >
                Leave Workspace
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

                <Field
                  label="Email"
                  type="email"
                  value={profile?.email ?? ""}
                  showPencil
                  onSave={(email) => saveProfile({ email })}
                />
                <Field
                  label="Full name"
                  value={profile?.name ?? currentUser.name}
                  onSave={(name) => saveProfile({ name })}
                />
                <Field
                  label="Title"
                  hint="Your job title or role"
                  value={profile?.title ?? ""}
                  onSave={(title) => saveProfile({ title })}
                />
                <Field
                  label="Username"
                  hint="One word, like a nickname or first name"
                  value={profile?.username ?? ""}
                  onSave={(username) => saveProfile({ username })}
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
                  onClick={() => setConfirmLeave(true)}
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
