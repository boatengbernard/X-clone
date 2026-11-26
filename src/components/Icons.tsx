import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { filled?: boolean };

// `filled` is read by each icon itself; never pass it through to the <svg>.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const base = ({ filled: _filled, ...props }: P) => ({
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const Logo = (p: P) => (
  <svg width={14} height={20} viewBox="0 0 12 17" aria-hidden="true" {...p}>
    <rect x="4.5" y="0" width="3" height="17" rx="1" fill="currentColor" />
    <rect x="0" y="5" width="12" height="3" rx="1" fill="currentColor" />
  </svg>
);
export const HomeIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
export const CirclesIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} strokeWidth={filled ? 2.4 : 1.8}>
    <circle cx="12" cy="6.5" r="2.5" fill={filled ? 'currentColor' : 'none'} />
    <circle cx="6" cy="16" r="2.5" fill={filled ? 'currentColor' : 'none'} />
    <circle cx="18" cy="16" r="2.5" fill={filled ? 'currentColor' : 'none'} />
    <path d="M9.6 8.4 7.4 13.6M14.4 8.4l2.2 5.2M8.6 17.5h6.8" />
  </svg>
);
export const SearchIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} strokeWidth={filled ? 2.6 : 1.8}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const BellIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10.3 20a2 2 0 0 0 3.4 0" />
  </svg>
);
export const BookmarkIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
);
export const UserIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6z" />
  </svg>
);
export const ReplyIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.2-4.6A8 8 0 1 1 21 12z" />
  </svg>
);
export const RepostIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />
  </svg>
);
export const HeartIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} width={18} height={18} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />
  </svg>
);
export const ChartIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
export const ShareIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);
export const BackIcon = (p: P) => (
  <svg {...base(p)} width={20} height={20}>
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
);
export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);
export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const FeatherIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 4c-8 0-14 6-14 14v2h2c8 0 14-6 14-14V4zM4 20L14 10" />
  </svg>
);
export const CalendarIcon = (p: P) => (
  <svg {...base(p)} width={16} height={16}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const PinIcon = (p: P) => (
  <svg {...base(p)} width={16} height={16}>
    <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
export const LinkIcon = (p: P) => (
  <svg {...base(p)} width={16} height={16}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
export const VerifiedBadge = (p: P) => (
  <svg width={17} height={17} viewBox="0 0 24 24" aria-label="Verified" {...p}>
    <path
      fill="var(--accent)"
      d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3L2.6 15.8l1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z"
    />
    <path d="M8 12.2l2.7 2.7L16.3 9" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const AmenIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} width={18} height={18} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 21l-1-9.5c-.2-1.6.4-4.5 1-6.5.6 2 1.2 4.9 1 6.5z" />
    <path d="M11 11.5L7 7.5c-.8-.8-2-.8-2.6.1-.5.7-.3 1.6.3 2.2L9 14.5 9.5 21M13 11.5l4-4c.8-.8 2-.8 2.6.1.5.7.3 1.6-.3 2.2L15 14.5 14.5 21" />
  </svg>
);
export const CandleIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M12 3c1.6 1.8 2 3 2 4a2 2 0 0 1-4 0c0-1 .4-2.2 2-4z" fill={filled ? 'currentColor' : 'none'} />
    <rect x="8.5" y="11" width="7" height="10" rx="1" fill={filled ? 'currentColor' : 'none'} />
  </svg>
);
export const FlagIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
);
export const LogoutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(p)} width={16} height={16} fill="currentColor" stroke="none">
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);
/** Keep: a Bible with a ribbon marker. */
export const KeepIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M5 19.5V5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 1.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19" />
    <path d="M14 3v7l-1.75-1.3L10.5 10V3" fill={filled ? 'currentColor' : 'none'} />
  </svg>
);
/** Pass it on: an open hand offering something forward. */
export const PassIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <path d="M3 15h3c1.5 0 2.5-1.5 4-1.5h4a1.6 1.6 0 0 1 0 3.2h-3" />
    <path d="M14 16.7l4.6-2.9a1.6 1.6 0 0 1 2 2.4l-4.8 4a4 4 0 0 1-2.6.8H3" />
    <path d="M15 3.5l2.5 2.5L15 8.5M8 6h9.5" />
  </svg>
);
export const JournalIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" fill={filled ? 'currentColor' : 'none'} />
    <path d="M9 3v18M12.5 8H16M12.5 12H16" stroke={filled ? 'var(--bg)' : 'currentColor'} />
  </svg>
);
export const MoreIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18} fill="currentColor" stroke="none">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);
export const ImageIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
);
export const SendIcon = (p: P) => (
  <svg {...base(p)} width={18} height={18}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21a7 7 0 0 1 12.5-4.3M17 14v6M14 17h6" />
  </svg>
);

export const EyeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M3 3l18 18" />
  </svg>
);
