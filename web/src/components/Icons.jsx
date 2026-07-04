/** Shared stroke icon set (no emoji-as-icons — checklist rule). 24px grid, currentColor. */

function Base({ size = 20, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconSun = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </Base>
);

export const IconMoon = (p) => (
  <Base {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />
  </Base>
);

export const IconChat = (p) => (
  <Base {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5 7.9 20z" />
  </Base>
);

export const IconList = (p) => (
  <Base {...p}>
    <path d="M10 6h11M10 12h11M10 18h11" />
    <path d="M3 5.5 4.5 7 7 4.5M3 11.5 4.5 13 7 10.5M3 17.5 4.5 19 7 16.5" />
  </Base>
);

export const IconScale = (p) => (
  <Base {...p}>
    <path d="M12 3v18M8.5 21h7M4 7h16" />
    <path d="M6.5 7 3.5 13a3.2 3.2 0 0 0 6 0L6.5 7zM17.5 7l-3 6a3.2 3.2 0 0 0 6 0l-3-6z" />
  </Base>
);

export const IconWind = (p) => (
  <Base {...p}>
    <path d="M3 8h9.5a2.5 2.5 0 1 0-2.4-3.2M3 12h13.5a2.5 2.5 0 1 1-2.4 3.2M3 16h6.5a2 2 0 1 1-1.9 2.6" />
  </Base>
);

export const IconSettings = (p) => (
  <Base {...p}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h13" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="19" cy="17" r="2" />
  </Base>
);

export const IconHome = (p) => (
  <Base {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M10 21v-5.5h4V21" />
  </Base>
);

export const IconMic = (p) => (
  <Base {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </Base>
);

export const IconSend = (p) => (
  <Base {...p}>
    <path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z" />
  </Base>
);

export const IconSpeaker = (p) => (
  <Base {...p}>
    <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5z" />
    <path d="M15 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
  </Base>
);

export const IconStop = (p) => (
  <Base {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none" />
  </Base>
);

export const IconTrash = (p) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
  </Base>
);

export const IconBack = (p) => (
  <Base {...p} className="rtl:-scale-x-100">
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconArrow = (p) => (
  <Base {...p} className="rtl:-scale-x-100">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const IconPlus = (p) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconX = (p) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const IconMenu = (p) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const IconSparkle = (p) => (
  <Base {...p}>
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
  </Base>
);
