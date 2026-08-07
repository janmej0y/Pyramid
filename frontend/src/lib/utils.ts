/** Joins conditional class names, dropping falsy entries. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "12 Sep 2026" — the long form used by the list/table views.
 *
 * Formatted manually rather than with Intl: en-GB abbreviates September as
 * "Sept", but the design consistently uses three-letter months.
 */
export function formatDateLong(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "29 Jul" — the compact form used by board card due-date chips. */
export function formatDateShort(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${MONTHS_SHORT[date.getMonth()]}`;
}

/**
 * Initials fallback for avatars without an image. Multi-word names use one
 * letter per word ("Ankit Dutta" -> "AD"); a single token that is already an
 * initialism is kept as-is ("CN" -> "CN").
 */
export function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
