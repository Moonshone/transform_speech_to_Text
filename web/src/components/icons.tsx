import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MicrophoneIcon(props: IconProps) {
  return <svg {...defaults} {...props}><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7" /></svg>;
}

export function SettingsIcon(props: IconProps) {
  return <svg {...defaults} {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.58 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.58 1.7 1.7 0 0 0 10 3V3h4v.08A1.7 1.7 0 0 0 15.05 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.42 9 1.7 1.7 0 0 0 21 10v4h-.08A1.7 1.7 0 0 0 19.4 15Z" /></svg>;
}

export function CopyIcon(props: IconProps) { return <svg {...defaults} {...props}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>; }
export function TrashIcon(props: IconProps) { return <svg {...defaults} {...props}><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></svg>; }
export function DownloadIcon(props: IconProps) { return <svg {...defaults} {...props}><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" /></svg>; }
export function EmailIcon(props: IconProps) { return <svg {...defaults} {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>; }
export function ShieldIcon(props: IconProps) { return <svg {...defaults} {...props}><path d="M12 3 5.5 5.5v5.75c0 4.3 2.7 7.75 6.5 9.75 3.8-2 6.5-5.45 6.5-9.75V5.5L12 3Z" /><path d="m9 12 2 2 4-4" /></svg>; }
