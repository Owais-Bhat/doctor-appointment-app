import { Platform } from 'react-native';

/**
 * MedFlow design tokens — same palette as the web app (src/app/globals.css):
 * Apple-blue accent, indigo secondary, paper-white / near-black surfaces.
 */
export const Colors = {
  light: {
    bg: '#eef1fb',
    bg2: '#e4e9f7',
    // Glass surfaces (see components/ui/GlassSurface)
    card: 'rgba(255,255,255,0.40)',
    cardSolid: 'rgba(255,255,255,0.86)',
    glassFill: 'rgba(255,255,255,0.34)',
    glassStrong: 'rgba(255,255,255,0.58)',
    edgeA: 'rgba(255,255,255,0.98)',
    edgeB: 'rgba(255,255,255,0.28)',
    sheen: 'rgba(255,255,255,0.70)',
    lens: 'rgba(255,255,255,0.92)',
    shadow: 'rgba(52,70,140,0.22)',
    ink: '#0b1020',
    ink2: 'rgba(11,16,32,0.66)',
    ink3: 'rgba(11,16,32,0.44)',
    line: 'rgba(11,16,32,0.08)',
    line2: 'rgba(11,16,32,0.15)',
    accent: '#0a7aff',
    accent2: '#6a4cff',
    accentInk: '#ffffff',
    good: '#12b886',
    warn: '#f59f00',
    bad: '#f03e5f',
    blob1: 'rgba(10,122,255,0.62)',
    blob2: 'rgba(138,92,255,0.55)',
    blob3: 'rgba(34,211,190,0.50)',
    blob4: 'rgba(255,110,170,0.42)',
    blur: 'light' as const,
  },
  dark: {
    bg: '#04050c',
    bg2: '#0a0c18',
    card: 'rgba(255,255,255,0.08)',
    cardSolid: 'rgba(30,32,48,0.88)',
    glassFill: 'rgba(255,255,255,0.07)',
    glassStrong: 'rgba(255,255,255,0.13)',
    edgeA: 'rgba(255,255,255,0.46)',
    edgeB: 'rgba(255,255,255,0.06)',
    sheen: 'rgba(255,255,255,0.20)',
    lens: 'rgba(255,255,255,0.22)',
    shadow: 'rgba(0,0,0,0.60)',
    ink: '#f4f6ff',
    ink2: 'rgba(244,246,255,0.70)',
    ink3: 'rgba(244,246,255,0.46)',
    line: 'rgba(255,255,255,0.09)',
    line2: 'rgba(255,255,255,0.17)',
    accent: '#3d94ff',
    accent2: '#8a7bff',
    accentInk: '#ffffff',
    good: '#34d399',
    warn: '#fbbf24',
    bad: '#ff6b81',
    blob1: 'rgba(30,120,255,0.60)',
    blob2: 'rgba(130,92,255,0.52)',
    blob3: 'rgba(32,200,190,0.34)',
    blob4: 'rgba(255,60,150,0.34)',
    blur: 'dark' as const,
  },
} as const;

export type ThemeColors = (typeof Colors)[keyof typeof Colors];

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Radius = { card: 30, field: 20, pill: 999 } as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  default: { sans: 'normal', rounded: 'normal' },
  web: { sans: 'Inter, ui-sans-serif, system-ui, sans-serif', rounded: 'Inter, ui-sans-serif, system-ui, sans-serif' },
})!;

/** Height of the floating tab bar, used as bottom padding on scrollable screens. */
export const TAB_BAR_SPACE = 112;

export const MaxContentWidth = 560;
