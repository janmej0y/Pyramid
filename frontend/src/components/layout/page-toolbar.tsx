"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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
import { DUE_BUCKETS, toggleIn } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { countFilters, EMPTY_FILTERS } from "@/lib/types";
import type { FieldKey, Filters, Member, Priority, ViewMode } from "@/lib/types";

/**
 * Field rows in the Fields menu.
 *
 * The design shows "Members" twice; the second row governs the assignee column.
 * They are labelled distinctly here because two identical checkboxes toggling
 * different columns is indistinguishable in use.
 */
export const FIELD_ITEMS: { key: FieldKey; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "members", label: "Members" },
  { key: "dueDate", label: "Due Date" },
  { key: "assignees", label: "Assignees" },
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
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  /** Option sources for the filter menu, derived from the loaded data. */
  statusOptions?: readonly string[];
  memberOptions?: Member[];
  labelOptions?: string[];
  teamOptions?: string[];
  /** Focuses the first inline "Add" field on the page. */
  onAdd?: () => void;
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
  filters,
  onFiltersChange,
  statusOptions = [],
  memberOptions = [],
  labelOptions = [],
  teamOptions = [],
  onAdd,
}: ToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const activeCount = countFilters(filters);

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

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4 sm:gap-3 sm:px-5">
      {searchOpen ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[420px]">
          <div className="flex h-8 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 focus-within:border-[var(--accent)]">
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
              aria-label="Search"
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
                      aria-pressed={view === option.id}
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

            {FIELD_ITEMS.map((item) => (
              <MenuCheckboxItem
                key={item.key}
                checked={fields[item.key]}
                onCheckedChange={(checked) => onFieldChange(item.key, checked)}
              >
                {item.label}
              </MenuCheckboxItem>
            ))}
          </MenuContent>
        </Menu>

        {/* Filter: every axis is functional; empty option sets say so. */}
        <Menu>
          <MenuTrigger
            aria-label={activeCount ? `Filter, ${activeCount} active` : "Filter"}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 transition-colors",
              activeCount
                ? "border-[var(--accent)] bg-[var(--accent-soft,var(--hover))] text-[var(--text)]"
                : "w-8 border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--hover)]",
            )}
          >
            <FilterIcon size={14} />
            {activeCount ? (
              <span className="text-[11px] font-medium tabular-nums">{activeCount}</span>
            ) : null}
          </MenuTrigger>

          <MenuContent align="end" width={190}>
            <MenuSub label="Status" icon={<CircleIcon size={14} />}>
              <MenuLabel>Status</MenuLabel>
              {statusOptions.length === 0 ? (
                <MenuItem disabled>No statuses</MenuItem>
              ) : (
                statusOptions.map((status) => (
                  <MenuItem
                    key={status}
                    closeOnSelect={false}
                    selected={filters.status.includes(status)}
                    onSelect={() => set("status", toggleIn(filters.status, status))}
                  >
                    {status}
                  </MenuItem>
                ))
              )}
            </MenuSub>

            <MenuSub label="Priority" icon={<PriorityIcon level="high" size={14} />}>
              <MenuLabel>Priority</MenuLabel>
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem
                  key={option.id}
                  closeOnSelect={false}
                  selected={filters.priority.includes(option.id)}
                  onSelect={() => set("priority", toggleIn(filters.priority, option.id))}
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

            <MenuSub label="Members" icon={<UsersIcon size={14} />}>
              <MenuLabel>Members</MenuLabel>
              {memberOptions.length === 0 ? (
                <MenuItem disabled>No members</MenuItem>
              ) : (
                memberOptions.map((member) => (
                  <MenuItem
                    key={member.id}
                    closeOnSelect={false}
                    selected={filters.memberIds.includes(member.id)}
                    onSelect={() => set("memberIds", toggleIn(filters.memberIds, member.id))}
                    icon={<Avatar name={member.name} src={member.avatar} size="xs" />}
                  >
                    {member.name}
                  </MenuItem>
                ))
              )}
            </MenuSub>

            <MenuSub label="Due Date" icon={<CalendarIcon size={14} />}>
              <MenuLabel>Due Date</MenuLabel>
              {DUE_BUCKETS.map((bucket) => (
                <MenuItem
                  key={bucket.id}
                  closeOnSelect={false}
                  selected={filters.due === bucket.id}
                  onSelect={() => set("due", filters.due === bucket.id ? null : bucket.id)}
                >
                  {bucket.label}
                </MenuItem>
              ))}
            </MenuSub>

            <MenuSub label="Teams" icon={<UsersIcon size={14} />}>
              <MenuLabel>Teams</MenuLabel>
              {teamOptions.length === 0 ? (
                <MenuItem disabled>No teams</MenuItem>
              ) : (
                teamOptions.map((team) => (
                  <MenuItem
                    key={team}
                    closeOnSelect={false}
                    selected={filters.teams.includes(team)}
                    onSelect={() => set("teams", toggleIn(filters.teams, team))}
                  >
                    {team}
                  </MenuItem>
                ))
              )}
            </MenuSub>

            <MenuSub label="Labels" icon={<TagIcon size={14} />}>
              <MenuLabel>Labels</MenuLabel>
              {labelOptions.length === 0 ? (
                <MenuItem disabled>No labels</MenuItem>
              ) : (
                labelOptions.map((label) => (
                  <MenuItem
                    key={label}
                    closeOnSelect={false}
                    selected={filters.labels.includes(label)}
                    onSelect={() => set("labels", toggleIn(filters.labels, label))}
                  >
                    {label}
                  </MenuItem>
                ))
              )}
            </MenuSub>

            <MenuSub label="Reporter" icon={<UserIcon size={14} />}>
              <MenuLabel>Reporter</MenuLabel>
              {memberOptions.length === 0 ? (
                <MenuItem disabled>No reporters</MenuItem>
              ) : (
                memberOptions.map((member) => (
                  <MenuItem
                    key={member.id}
                    closeOnSelect={false}
                    selected={filters.reporterIds.includes(member.id)}
                    onSelect={() => set("reporterIds", toggleIn(filters.reporterIds, member.id))}
                    icon={<Avatar name={member.name} src={member.avatar} size="xs" />}
                  >
                    {member.name}
                  </MenuItem>
                ))
              )}
            </MenuSub>

            {activeCount ? (
              <>
                <MenuSeparator />
                <MenuItem onSelect={() => onFiltersChange(EMPTY_FILTERS)}>
                  Clear all filters
                </MenuItem>
              </>
            ) : null}
          </MenuContent>
        </Menu>

        <Button variant="primary" size="md" className="gap-1" onClick={onAdd}>
          <PlusIcon size={14} />
          <span className="hidden sm:inline">{addLabel}</span>
        </Button>
      </div>
    </div>
  );
}
