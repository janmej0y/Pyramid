"use client";

import { cn } from "@/lib/utils";

/**
 * Shimmer block. Every skeleton below composes this so the animation and
 * surface colour stay consistent, and `prefers-reduced-motion` disables the
 * sweep in one place (see globals.css).
 */
export function Skeleton({
  className,
  width,
}: {
  className?: string;
  width?: number | string;
}) {
  return (
    <span
      aria-hidden="true"
      style={width ? { width } : undefined}
      className={cn("block rounded bg-[var(--skeleton)] animate-[shimmer_1.4s_ease-in-out_infinite]", className)}
    />
  );
}

/**
 * Placeholder matching TaskTable's real row geometry.
 *
 * Row heights are deliberately identical to the loaded state (md:py-2.5 on a
 * 13px line, py-3 stacked on mobile) so content arriving does not shift layout.
 */
export function TaskTableSkeleton({
  rows = 3,
  fields,
  itemLabel = "Task",
}: {
  rows?: number;
  fields: { priority: boolean; members: boolean; dueDate: boolean };
  itemLabel?: string;
}) {
  return (
    <section className="mb-5">
      <div className="mb-1.5 flex items-center gap-1.5 px-0.5 py-0.5">
        <Skeleton className="h-3 w-3 rounded-sm" />
        <Skeleton className="h-[13px] w-20" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="hidden items-center gap-3 border-b border-[var(--border)] bg-[var(--table-head-bg)] px-4 py-2.5 text-[12px] font-medium text-[var(--text-muted)] md:flex">
          <span className="min-w-0 flex-1">{itemLabel}</span>
          {fields.priority ? <span className="w-[88px] shrink-0">Priority</span> : null}
          {fields.members ? <span className="w-[76px] shrink-0">Members</span> : null}
          {fields.dueDate ? <span className="w-[104px] shrink-0">Due Date</span> : null}
          <span className="w-[52px] shrink-0 text-right">Actions</span>
        </div>

        <ul>
          {Array.from({ length: rows }, (_, index) => (
            <li key={index} className="border-b border-[var(--border)] last:border-b-0">
              {/* Desktop */}
              <div className="hidden items-center gap-3 px-4 py-2.5 md:flex">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-[13px]" width={`${52 + ((index * 17) % 30)}%`} />
                </div>
                {fields.priority ? (
                  <div className="w-[88px] shrink-0">
                    <Skeleton className="h-[13px] w-14" />
                  </div>
                ) : null}
                {fields.members ? (
                  <div className="w-[76px] shrink-0">
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                ) : null}
                {fields.dueDate ? (
                  <div className="w-[104px] shrink-0">
                    <Skeleton className="h-[13px] w-[86px]" />
                  </div>
                ) : null}
                <div className="flex w-[52px] shrink-0 justify-end">
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              </div>

              {/* Mobile — mirrors the stacked card */}
              <div className="flex items-start gap-3 px-3 py-3 md:hidden">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-[13px]" width={`${58 + ((index * 13) % 26)}%`} />
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {fields.priority ? <Skeleton className="h-[12px] w-12" /> : null}
                    {fields.dueDate ? <Skeleton className="h-[12px] w-[74px]" /> : null}
                    {fields.members ? <Skeleton className="h-4 w-4 rounded-full" /> : null}
                  </div>
                </div>
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Projects placeholder. The projects table is a single ungrouped card, so it
 * renders without the collapsible group header the task tables carry.
 */
export function ProjectsTableSkeleton({
  rows = 4,
  fields,
}: {
  rows?: number;
  fields: { priority: boolean; members: boolean; dueDate: boolean };
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="hidden items-center gap-3 border-b border-[var(--border)] bg-[var(--table-head-bg)] px-4 py-2.5 text-[12px] font-medium text-[var(--text-muted)] md:flex">
        <span className="min-w-0 flex-1">Projects</span>
        {fields.priority ? <span className="w-[88px] shrink-0">Priority</span> : null}
        {fields.members ? <span className="w-[76px] shrink-0">Lead</span> : null}
        {fields.dueDate ? <span className="w-[104px] shrink-0">Due Date</span> : null}
        <span className="w-[52px] shrink-0 text-right">Actions</span>
      </div>

      <ul>
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="border-b border-[var(--border)] last:border-b-0">
            <div className="hidden items-center gap-3 px-4 py-2.5 md:flex">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-[13px]" width={`${48 + ((index * 19) % 32)}%`} />
              </div>
              {fields.priority ? (
                <div className="w-[88px] shrink-0">
                  <Skeleton className="h-[13px] w-14" />
                </div>
              ) : null}
              {fields.members ? (
                <div className="w-[76px] shrink-0">
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              ) : null}
              {fields.dueDate ? (
                <div className="w-[104px] shrink-0">
                  <Skeleton className="h-[13px] w-[86px]" />
                </div>
              ) : null}
              <div className="flex w-[52px] shrink-0 justify-end">
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>

            <div className="flex items-start gap-3 px-3 py-3 md:hidden">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-[13px]" width={`${56 + ((index * 15) % 28)}%`} />
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {fields.priority ? <Skeleton className="h-[12px] w-12" /> : null}
                  {fields.dueDate ? <Skeleton className="h-[12px] w-[74px]" /> : null}
                  {fields.members ? <Skeleton className="h-4 w-4 rounded-full" /> : null}
                </div>
              </div>
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Board placeholder — four columns at the real 248px width. */
export function TaskBoardSkeleton({ columns = 4 }: { columns?: number }) {
  const cardsPerColumn = [3, 2, 3, 2];

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-6 sm:px-5">
      {Array.from({ length: columns }, (_, columnIndex) => (
        <section
          key={columnIndex}
          className="flex w-[248px] shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]"
        >
          <header className="flex items-center gap-1.5 px-2.5 py-2">
            <Skeleton className="h-3 w-3 rounded-sm" />
            <Skeleton className="h-[12.5px] w-20 flex-1" />
            <Skeleton className="h-[11px] w-3" />
          </header>

          <div className="flex flex-col gap-2 px-2 pb-2">
            {Array.from({ length: cardsPerColumn[columnIndex % 4] }, (_, cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
              >
                <Skeleton className="h-[13px]" width={`${64 + ((cardIndex * 19) % 28)}%`} />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-[11.5px] w-12" />
                  </span>
                  <Skeleton className="h-[18px] w-14 rounded-md" />
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Skeleton className="h-[19px] w-16 rounded-md" />
                  <Skeleton className="h-[19px] w-14 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Detail-page placeholder — title, description, metadata rows, side panel. */
export function TaskDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-5 sm:px-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[26px] w-[58%]" />
        <div className="mt-3 flex flex-col gap-1.5">
          <Skeleton className="h-[13px] w-[92%]" />
          <Skeleton className="h-[13px] w-[64%]" />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {["Properties", "Labels", "Resources"].map((row) => (
            <div key={row} className="flex items-center gap-4">
              <Skeleton className="h-[13px] w-[72px] shrink-0" />
              <Skeleton className="h-[22px] w-[180px] rounded-md" />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Skeleton className="h-[13px] w-20" />
          <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)]">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0"
              >
                <Skeleton className="h-[13px] flex-1" width={`${44 + ((index * 21) % 24)}%`} />
                <Skeleton className="h-[13px] w-14 shrink-0" />
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <Skeleton className="h-[13px] w-[86px] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-[300px]">
        <div className="rounded-xl border border-[var(--border)] p-3">
          <Skeleton className="h-[13px] w-16" />
          <div className="mt-3 flex flex-col gap-3">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-[12px] w-[64px] shrink-0" />
                <Skeleton className="h-[18px] flex-1" width={`${40 + ((index * 23) % 40)}%`} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
