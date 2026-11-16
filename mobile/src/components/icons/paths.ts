/**
 * MedFlow icon set — drawn on a 24×24 grid, round caps and joins.
 * Every icon is duotone: the main outline uses the icon colour, `a` parts are
 * drawn in the accent colour, and `f` parts also get a soft accent tint fill.
 */
export type IconPart = { d: string; a?: boolean; f?: boolean };

const p = (d: string, flags: Partial<Omit<IconPart, 'd'>> = {}): IconPart => ({ d, ...flags });

export const ICONS = {
  home: [
    p('M4 11.5 12 4l8 7.5'),
    p('M6 10v8.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V10'),
    p('M10 20v-5a2 2 0 0 1 4 0v5', { a: true, f: true }),
  ],
  calendar: [
    p('M5 6.5h14A1.5 1.5 0 0 1 20.5 8v10.5A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 5 6.5Z'),
    p('M8 4v4M16 4v4M3.5 11h17'),
    p('M9 15.5l2 2 4-4', { a: true }),
  ],
  calendarPlus: [
    p('M5 6.5h14A1.5 1.5 0 0 1 20.5 8v10.5A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 5 6.5Z'),
    p('M8 4v4M16 4v4M3.5 11h17'),
    p('M12 13.5v5M9.5 16h5', { a: true }),
  ],
  stethoscope: [
    p('M6 3v6a4 4 0 0 0 8 0V3M5 3h2M13 3h2'),
    p('M10 13v2.5a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4V15'),
    p('M17 13a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z', { a: true, f: true }),
  ],
  user: [p('M4.5 20.5a7.5 7.5 0 0 1 15 0'), p('M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', { a: true, f: true })],
  bell: [
    p('M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z'),
    p('M10 20.5a2 2 0 0 0 4 0', { a: true }),
  ],
  heart: [
    p('M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20Z'),
    p('M8 12.5h2l1.2-2.2 1.6 4 1.2-1.8H16', { a: true }),
  ],
  pulse: [p('M3 12h4l2.5-6 4 12 2.5-6H21', { a: true })],
  pill: [
    p('M4.95 13.95 13.95 4.95A3.6 3.6 0 0 1 19.05 10.05L10.05 19.05A3.6 3.6 0 0 1 4.95 13.95Z'),
    p('M9.45 9.45 14.55 14.55', { a: true }),
    p('M9.45 9.45 4.95 13.95A3.6 3.6 0 0 0 10.05 19.05L14.55 14.55Z', { a: true, f: true }),
  ],
  video: [
    p('M4.5 6.5h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z'),
    p('M15.5 10.5l5-3v9l-5-3', { a: true, f: true }),
  ],
  phone: [
    p('M6.6 3.5h2.2l1.4 3.6-1.7 1.3a10 10 0 0 0 4.6 4.6l1.3-1.7 3.6 1.4v2.2a2 2 0 0 1-2 2A13.5 13.5 0 0 1 4.6 5.5a2 2 0 0 1 2-2Z'),
    p('M15 5.5a4 4 0 0 1 3.5 3.5M15 2.5a7 7 0 0 1 6.5 6.5', { a: true }),
  ],
  hospital: [
    p('M5 20.5v-14A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v14M3.5 20.5h17'),
    p('M10 20.5v-3h4v3'),
    p('M12 8v4.5M9.75 10.25h4.5', { a: true }),
  ],
  clock: [p('M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z'), p('M12 7.5V12l3 2', { a: true })],
  search: [p('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z'), p('M16.5 16.5 21 21', { a: true })],
  check: [p('M5 12.5l4.5 4.5L19 7.5', { a: true })],
  chevronRight: [p('M9.5 5.5 16 12l-6.5 6.5')],
  chevronLeft: [p('M14.5 5.5 8 12l6.5 6.5')],
  close: [p('M6 6l12 12M18 6 6 18')],
  plus: [p('M12 5v14M5 12h14', { a: true })],
  shield: [
    p('M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-2.5Z'),
    p('M9 12l2.2 2.2L15 10.5', { a: true }),
  ],
  star: [p('M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z', { a: true, f: true })],
  pin: [
    p('M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z'),
    p('M9.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z', { a: true, f: true }),
  ],
  logout: [
    p('M9.5 20.5h-4A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5h4'),
    p('M15 8l4 4-4 4M19 12H9.5', { a: true }),
  ],
  mail: [
    p('M4 6h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 18H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 6Z'),
    p('M3 8l9 6 9-6', { a: true }),
  ],
  lock: [
    p('M6 11h12a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 6 11Z'),
    p('M8 11V8a4 4 0 0 1 8 0v3'),
    p('M12 14.5v2', { a: true }),
  ],
  eye: [
    p('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'),
    p('M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z', { a: true, f: true }),
  ],
  eyeOff: [
    p('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z'),
    p('M4 4l16 16', { a: true }),
  ],
  sliders: [
    p('M4 7h8M18 7h2M4 17h2M12 17h8'),
    p('M12 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z', { a: true, f: true }),
    p('M6 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z', { a: true, f: true }),
  ],
  fileText: [
    p('M6.5 3.5h7L19 9v10.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-14A1.5 1.5 0 0 1 6.5 3.5Z'),
    p('M13.5 3.5V9H19'),
    p('M8.5 13h7M8.5 16.5h5', { a: true }),
  ],
  droplet: [
    p('M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5Z'),
    p('M9.5 14.5a2.7 2.7 0 0 0 2 2.4', { a: true }),
  ],
  sparkles: [
    p('M11 4l1.8 4.7 4.7 1.8-4.7 1.8L11 17l-1.8-4.7-4.7-1.8 4.7-1.8L11 4Z'),
    p('M18 15v4M16 17h4', { a: true }),
  ],
  wallet: [
    p('M4.5 7h13A2 2 0 0 1 19.5 9v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z'),
    p('M4.5 7l11-3.2A1.5 1.5 0 0 1 17.4 5.3V7'),
    p('M15.5 14H20v-3h-4.5a1.5 1.5 0 0 0 0 3Z', { a: true, f: true }),
  ],
  smile: [
    p('M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z'),
    p('M8.5 14a4 4 0 0 0 7 0'),
    p('M9 9.75h.01M15 9.75h.01', { a: true }),
  ],
  info: [p('M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z'), p('M12 11v5.5M12 7.75h.01', { a: true })],
  alert: [
    p('M10.3 4.6 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z'),
    p('M12 10v4M12 17h.01', { a: true }),
  ],
} satisfies Record<string, IconPart[]>;

export type IconName = keyof typeof ICONS;

/** Specialty → icon, so every specialty gets its own mark. */
export const SPECIALTY_ICON: Record<string, IconName> = {
  'General Medicine': 'stethoscope',
  Cardiology: 'heart',
  Dermatology: 'droplet',
  Pediatrics: 'smile',
  Gynecology: 'user',
  Orthopedics: 'pulse',
  Neurology: 'sparkles',
  ENT: 'bell',
  Ophthalmology: 'eye',
  Psychiatry: 'shield',
  Gastroenterology: 'pill',
  Dentistry: 'star',
};

export const specialtyIcon = (s: string): IconName => SPECIALTY_ICON[s] ?? 'stethoscope';
