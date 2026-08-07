"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  BoardIcon,
  CalendarIcon,
  CircleIcon,
  FilterIcon,
  ColumnsIcon,
  ListIcon,
  PlusIcon,
  PriorityIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { FieldKey, Priority, ViewMode } from "@/lib/types";

/** Field rows in the Fields menu, in design order (Members appears twice). */
export const FIELD_ITEMS: { key: FieldKey; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "members", label: "Members" },
  { key: "dueDate", label: "Due Date" },
  { key: "assignees", label: "Members" },
  { key: "labels", label: "Labels" },
  { key: "status", label: "Status" },
  { key: "reporter", label: "Reporter" },
];

const PRIORITY_OPTIONS: { id: Priority; label: string; color: string }[] = [
  { id: "none", label: "No Priority", color: "var(--priority-none)" },
  { id: "urgent", label: "Urgent", color: "var(--priority-urgent)" },
  { id: "high", label: "High", color: "var(--priority-high)" },
  { id: "medium", label: "Medium", color: "var(--priority-medium)" },
  { id: "low", label: "Low", color: "var(--priority-low)" },
];

export type ToolbarProps = {
  title: string;
  addLabel: string;
  /** Board toggle is only offered on Tasks; Projects is list-only. */
  showViewSwitch?: boolean;
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  fields: Record<FieldKey, boolean>;
  onFieldChange: (key: FieldKey, value: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  filterPriority: Priority | null;
  onFilterPriorityChange: (priority: Priority | null) => void;
};

export function PageToolbar({
  title,
  addLabel,
  showViewSwitch = false,
  view = "list",
  onViewChange,
  fields,
  onFieldChange,
  search,
  onSearchChange,
  searchOpen,
  onSearchOpenChange,
  filterPriority,
  onFilterPriorityChange,
}: ToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // ⌘F / Ctrl+F opens the inline search field, matching the shortcut hint.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        onSearchOpenChange(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onSearchOpenChange]);

  return (
    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
      {searchOpen ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[420px]">
          <div className="flex h-8 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5">
            <SearchIcon size={14} className="shrink-0 text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => {
                if (!search) onSearchOpenChange(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onSearchChange("");
                  onSearchOpenChange(false);
                }
              }}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
            />
            <kbd className="hidden shrink-0 text-[11px] text-[var(--text-subtle)] sm:block">⌘F</kbd>
          </div>
        </div>
      ) : (
        <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--text)]">
          {title}
        </h1>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {!searchOpen ? (
          <Button
            size="icon"
            aria-label="Search"
            onClick={() => onSearchOpenChange(true)}
            className="text-[var(--text-muted)]"
          >
            <SearchIcon size={14} />
          </Button>
        ) : null}

        {/* Fields: view switch + column visibility */}
        <Menu>
          <MenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--hover)]">
            <ColumnsIcon size={14} className="text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Fields</span>
          </MenuTrigger>

          <MenuContent align="end" width={196}>
            {showViewSwitch ? (
              <>
                <div className="mb-1 grid grid-cols-2 gap-1 rounded-lg bg-[var(--hover)] p-1">
                  {(
                    [
                      { id: "list", label: "List", icon: <ListIcon size={13} /> },
                      { id: "board", label: "Board", icon: <BoardIcon size={13} /> },
                    ] as { id: ViewMode; label: string; icon: React.ReactNode }[]
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onViewChange?.(option.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md py-1 text-[12px] font-medium transition-colors",
                        view === option.id
                          ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text)]",
                      )}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
                <MenuSeparator />
              </>
            ) : null}

            {FIELD_ITEMS.map((item, index) => (
              <MenuCheckboxItem
                key={`${item.key}-${index}`}
                checked={fields[item.key]}
                onCheckedChange={(checked) => onFieldChange(item.key, checked)}
              >
                {item.label}
              </MenuCheckboxItem>
            ))}
          </MenuContent>
        </Menu>

        {/* Filter: grouped properties with a priority flyout */}
        <Menu>
          <MenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)]">
            <FilterIcon size={14} />
          </MenuTrigger>

          <MenuContent align="end" width={168}>
            <MenuItem icon={<CircleIcon size={14} />} hasSubmenu>
              Status
            </MenuItem>

            <MenuSub label="Priority" icon={<PriorityIcon level="high" size={14} />}>
              <MenuLabel>Priority</MenuLabel>
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem
                  key={option.id}
                  selected={filterPriority === option.id}
                  onSelect={() =>
                    onFilterPriorityChange(filterPriority === option.id ? null : option.id)
                  }
                  icon={
                    <span style={{ color: option.color }}>
                      <PriorityIcon level={option.id} size={14} />
                    </span>
                  }
                >
                  <span style={{ color: option.color }}>{option.label}</span>
                </MenuItem>
              ))}
            </MenuSub>

            <MenuItem icon={<UsersIcon size={14} />} hasSubmenu>
              Members
            </MenuItem>
            <MenuItem icon={<CalendarIcon size={14} />} hasSubmenu>
              Due Date
            </MenuItem>
            <MenuItem icon={<UsersIcon size={14} />} hasSubmenu>
              Teams
            </MenuItem>
            <MenuItem icon={<TagIcon size={14} />} hasSubmenu>
              Labels
            </MenuItem>
            <MenuItem icon={<UserIcon size={14} />} hasSubmenu>
              Reporter
            </MenuItem>
          </MenuContent>
        </Menu>

        <Button variant="primary" size="md" className="gap-1">
          <PlusIcon size={14} />
          <span className="hidden sm:inline">{addLabel}</span>
        </Button>
      </div>
    </div>
  );
}
