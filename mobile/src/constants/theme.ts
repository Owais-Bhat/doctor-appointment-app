import { Platform } from 'react-native';

/**
 * MedFlow design tokens — same palette as the web app (src/app/globals.css):
 * Apple-blue accent, indigo secondary, paper-white / near-black surfaces.
 */
export const Colors = {
  light: {
    bg: '#fcfcfc',
    bg2: '#f4f6fa',
    card: 'rgba(255,255,255,0.72)',
    cardSolid: '#ffffff',
    ink: '#0a0a0a',
    ink2: 'rgba(10,10,10,0.62)',
    ink3: 'rgba(10,10,10,0.42)',
    line: 'rgba(10,10,10,0.08)',
    line2: 'rgba(10,10,10,0.14)',
    accent: '#007AFF',
    accent2: '#5856d6',
    accentInk: '#ffffff',
    good: '#10b981',
    warn: '#f59e0b',
    bad: '#ef4444',
    blob1: 'rgba(0,122,255,0.30)',
    blob2: 'rgba(88,86,214,0.26)',
    blob3: 'rgba(16,185,129,0.18)',
    blur: 'light' as const,
  },
  dark: {
    bg: '#050505',
    bg2: '#0c0e14',
    card: 'rgba(28,28,30,0.62)',
    cardSolid: '#141416',
    ink: '#f5f5f7',
    ink2: 'rgba(245,245,247,0.66)',
    ink3: 'rgba(245,245,247,0.42)',
    line: 'rgba(255,255,255,0.08)',
    line2: 'rgba(255,255,255,0.14)',
    accent: '#0a84ff',
    accent2: '#7d7aff',
    accentInk: '#ffffff',
    good: '#30d158',
    warn: '#ffb340',
    bad: '#ff6961',
    blob1: 'rgba(10,132,255,0.34)',
    blob2: 'rgba(125,122,255,0.28)',
    blob3: 'rgba(48,209,88,0.16)',
    blur: 'dark' as const,
  },
} as const;

export type ThemeColors = (typeof Colors)[keyof typeof Colors];

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Radius = { card: 24, field: 16, pill: 999 } as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  default: { sans: 'normal', rounded: 'normal' },
  web: { sans: 'Inter, ui-sans-serif, system-ui, sans-serif', rounded: 'Inter, ui-sans-serif, system-ui, sans-serif' },
})!;

/** Height of the floating tab bar, used as bottom padding on scrollable screens. */
export const TAB_BAR_SPACE = 112;

export const MaxContentWidth = 560;
