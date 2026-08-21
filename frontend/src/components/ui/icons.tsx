import type { SVGProps } from "react";

/**
 * Icon set matching the design. All icons share a 24x24 viewBox with 1.5–2
 * stroke weight so they stay optically consistent at any rendered size.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const ColumnsIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    <path d="M15 4v16" />
  </Icon>
);

export const FilterIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const MoreHorizontalIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const ChevronsUpDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </Icon>
);

/** Caret used by the collapsible group headers ("To Do", "Doing", ...). */
export const CaretDownIcon = ({ size = 14, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...p}
  >
    <path d="M6 9h12l-6 7z" />
  </svg>
);

export const CaretRightIcon = ({ size = 14, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...p}
  >
    <path d="M9 6v12l7-6z" />
  </svg>
);

export const SidebarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9.5 4v16" />
  </Icon>
);

export const LayoutGridIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </Icon>
);

export const ListIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3.5 6h.01" />
    <path d="M3.5 12h.01" />
    <path d="M3.5 18h.01" />
  </Icon>
);

export const BoardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    <path d="M15 4v16" />
  </Icon>
);

/** Sidebar "Tasks" glyph. */
export const TasksIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="7" height="7" rx="1.5" />
    <rect x="14" y="4" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="6" rx="1.5" />
    <rect x="14" y="14" width="7" height="6" rx="1.5" />
  </Icon>
);

/** Sidebar "Projects" glyph. */
export const ProjectsIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M3 11h18" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
  </Icon>
);

export const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12.5V4.8A1.8 1.8 0 0 1 4.8 3h7.7a1.8 1.8 0 0 1 1.27.53l6.7 6.7a1.8 1.8 0 0 1 0 2.54l-7.7 7.7a1.8 1.8 0 0 1-2.54 0l-6.7-6.7A1.8 1.8 0 0 1 3 12.5Z" />
    <circle cx="7.8" cy="7.8" r="1.3" />
  </Icon>
);

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </Icon>
);

export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15.5 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20" />
    <circle cx="9.25" cy="8" r="3.4" />
    <path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3" />
    <path d="M15.5 4.9a3.4 3.4 0 0 1 0 6.2" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 20v-1.8a4.2 4.2 0 0 0-4.2-4.2H9.2A4.2 4.2 0 0 0 5 18.2V20" />
    <circle cx="12" cy="7.5" r="3.6" />
  </Icon>
);

export const CircleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-.97 1.47V21a2 2 0 1 1-4 0v-.09A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.47-.97H3a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 .97-1.47V3a2 2 0 1 1 4 0v.09A1.6 1.6 0 0 0 15 4.6a1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9v0a1.6 1.6 0 0 0 1.47.97H21a2 2 0 1 1 0 4h-.09a1.6 1.6 0 0 0-1.47.97Z" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.9 4.9 1.4 1.4" />
    <path d="m17.7 17.7 1.4 1.4" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.3 17.7-1.4 1.4" />
    <path d="m19.1 4.9-1.4 1.4" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p} strokeWidth={2.25}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const ShareIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="18" cy="5.5" r="2.6" />
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="18.5" r="2.6" />
    <path d="m8.3 10.8 7.4-4.1" />
    <path d="m8.3 13.2 7.4 4.1" />
  </Icon>
);

export const PanelRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M14.5 4v16" />
  </Icon>
);

export const PaperclipIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11.5 12.3 19.2a4.5 4.5 0 0 1-6.4-6.4l7.7-7.7a3 3 0 0 1 4.3 4.3l-7.7 7.7a1.5 1.5 0 0 1-2.2-2.2l7.1-7.1" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.5 3.5 11 13" />
    <path d="M20.5 3.5 14.5 20.5l-3.4-7.6-7.6-3.4Z" />
  </Icon>
);

export const SmileIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 14.2a4.2 4.2 0 0 0 7 0" />
    <path d="M9 9.5h.01" />
    <path d="M15 9.5h.01" />
  </Icon>
);

export const AtSignIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M15.6 8.4v4.5a2.7 2.7 0 0 0 5.4 0V12a9 9 0 1 0-3.6 7.2" />
  </Icon>
);

export const LogOutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="m15.5 16.5 4.5-4.5-4.5-4.5" />
    <path d="M20 12H9" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M5.5 7l1 12.2A1.8 1.8 0 0 0 8.3 21h7.4a1.8 1.8 0 0 0 1.8-1.8L18.5 7" />
    <path d="M9 7V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V7" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4l10.5-10.5a2.83 2.83 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h16" />
    <path d="m14 6 6 6-6 6" />
  </Icon>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12H4" />
    <path d="m10 6-6 6 6 6" />
  </Icon>
);

export const GripVerticalIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
  </Icon>
);

export const UndoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7v6h6" />
    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
  </Icon>
);

export const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

/**
 * Priority glyph — ascending bars, like a signal indicator. Filled bars encode
 * the level (urgent = 3, high = 2, medium = 2 mid, low = 1).
 */
export function PriorityIcon({
  level,
  size = 14,
  ...props
}: IconProps & { level: "urgent" | "high" | "medium" | "low" | "none" }) {
  const filled = { urgent: 3, high: 3, medium: 2, low: 1, none: 0 }[level];
  const bars = [
    { x: 4, y: 14, h: 6 },
    { x: 9.5, y: 10, h: 10 },
    { x: 15, y: 6, h: 14 },
  ];

  if (level === "none") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <rect x="4" y="17" width="4" height="3" rx="1" fill="currentColor" opacity={0.85} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {bars.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="4"
          height={bar.h}
          rx="1"
          fill="currentColor"
          opacity={i < filled ? 1 : 0.28}
        />
      ))}
    </svg>
  );
}

/** Pyramid brand mark — white droplet/triangle on a rounded black tile. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#18181b" />
      <path
        d="M12 5.5c2.6 3 4.4 5.2 4.4 7.5a4.4 4.4 0 1 1-8.8 0c0-2.3 1.8-4.5 4.4-7.5Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.9 3c2.3-2.1 3.5-5.2 3.5-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1 7.9-2.8l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2-6.6-4.8l-4 3.1C3.4 21.3 7.4 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.6c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L1.3 7.1C.5 8.6 0 10.3 0 12.4s.5 3.8 1.3 5.3l4.1-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c2.2 0 3.7.9 4.6 1.7l3.4-3.3C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.3 6.6l4.1 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
