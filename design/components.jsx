// components.jsx — shared UI primitives + icons for the MedFlow prototype
// All icons are inline SVG (Feather-style stroked) so we don't need a library.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 1.8, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d}
  </svg>
);
const I = {
  search:    (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  cal:       (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>}/>,
  clock:     (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  heart:     (p) => <Icon {...p} d={<path d="M12 21s-7-4.5-9.5-9C.8 8.6 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.7 3.6 4 7-2.5 4.5-9.5 9-9.5 9z"/>}/>,
  brain:     (p) => <Icon {...p} d={<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5 3 3 0 0 0 1 5v1a3 3 0 0 0 3 3h0v-3M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5 3 3 0 0 1-1 5v1a3 3 0 0 1-3 3v-3M9 4v18M15 4v18"/>}/>,
  bone:      (p) => <Icon {...p} d={<path d="M17 3a2.5 2.5 0 0 1 2.5 2.5c0 .9-.5 1.7-1.2 2.1.7.4 1.2 1.2 1.2 2.1A2.5 2.5 0 0 1 17 12.2L8.8 20.4A2.5 2.5 0 1 1 5.2 16.8L13.4 8.6A2.5 2.5 0 0 1 14.4 4.8 2.5 2.5 0 0 1 17 3z"/>}/>,
  lung:      (p) => <Icon {...p} d={<path d="M12 3v14M9 14c-2 4-6 5-6 0 0-3 1-6 3-9 1-1 3 0 3 2v7zM15 14c2 4 6 5 6 0 0-3-1-6-3-9-1-1-3 0-3 2v7z"/>}/>,
  eye:       (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>}/>,
  smile:     (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 10h.01M15 10h.01"/></>}/>,
  ear:       (p) => <Icon {...p} d={<path d="M6 8a6 6 0 0 1 12 0c0 3-2 4-3 5-1 .8-1.5 2-1.5 3a2.5 2.5 0 1 1-5 0M9 12a3 3 0 1 1 6 0"/>}/>,
  stomach:   (p) => <Icon {...p} d={<path d="M9 4v4a4 4 0 0 0 4 4h2a3 3 0 0 1 0 6h-2c-3 0-5-2-5-5 0-2 1-4 3-4"/>}/>,
  activity:  (p) => <Icon {...p} d={<path d="M3 12h4l3-8 4 16 3-8h4"/>}/>,
  user:      (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>}/>,
  users:     (p) => <Icon {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><circle cx="17" cy="7" r="3"/><path d="M22 18c0-2.5-2-4.5-5-4.5"/></>}/>,
  bell:      (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 8H4c0-2 2-3 2-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></>}/>,
  home:      (p) => <Icon {...p} d={<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>}/>,
  doc:       (p) => <Icon {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>}/>,
  pill:      (p) => <Icon {...p} d={<><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/></>}/>,
  chat:      (p) => <Icon {...p} d={<path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4a8 8 0 1 1 16-4z"/>}/>,
  star:      (p) => <Icon {...p} fill="currentColor" stroke="none" d={<path d="M12 2l3 7 7 .5-5.5 4.5L18 21l-6-4-6 4 1.5-7L2 9.5 9 9z"/>}/>,
  check:     (p) => <Icon {...p} d={<path d="M5 12l5 5L20 7"/>}/>,
  checkCircle:(p)=> <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>}/>,
  plus:      (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14"/>}/>,
  arrowR:    (p) => <Icon {...p} d={<path d="M5 12h14M13 6l6 6-6 6"/>}/>,
  arrowL:    (p) => <Icon {...p} d={<path d="M19 12H5M11 18l-6-6 6-6"/>}/>,
  chevR:     (p) => <Icon {...p} d={<path d="M9 6l6 6-6 6"/>}/>,
  chevD:     (p) => <Icon {...p} d={<path d="M6 9l6 6 6-6"/>}/>,
  close:     (p) => <Icon {...p} d={<path d="M6 6l12 12M6 18L18 6"/>}/>,
  shield:    (p) => <Icon {...p} d={<><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></>}/>,
  video:     (p) => <Icon {...p} d={<><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/></>}/>,
  mic:       (p) => <Icon {...p} d={<><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>}/>,
  send:      (p) => <Icon {...p} d={<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>}/>,
  loc:       (p) => <Icon {...p} d={<><path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></>}/>,
  cards:     (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>}/>,
  spark:     (p) => <Icon {...p} d={<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>}/>,
  filter:    (p) => <Icon {...p} d={<path d="M3 5h18M6 12h12M10 19h4"/>}/>,
  trendUp:   (p) => <Icon {...p} d={<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>}/>,
  cog:       (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.6.3 1.2.7 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z"/></>}/>,
  logout:    (p) => <Icon {...p} d={<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>}/>,
  sparkle:   (p) => <Icon {...p} d={<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 3l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7zM5 17l.7 2 2 .7-2 .7L5 22l-.7-2-2-.7 2-.7z"/>}/>,
  sun:       (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>}/>,
  moon:      (p) => <Icon {...p} d={<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>}/>,
  phone:     (p) => <Icon {...p} d={<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2.1z"/>}/>,
  phoneOff:  (p) => <Icon {...p} d={<path d="M10.7 13.3a16 16 0 0 1-3-4.5L9 7.4a2 2 0 0 0 .5-2c-.3-1-.5-2-.6-3A2 2 0 0 0 7 .5H4a2 2 0 0 0-2 2.1 19.8 19.8 0 0 0 3.1 8.6 19.5 19.5 0 0 0 6 6c2.6 1.6 5.6 2.7 8.6 3.1a2 2 0 0 0 2.2-2v-3a2 2 0 0 0-1.7-2.1c-1-.1-2-.3-2.9-.6"/>}/>,
  mute:      (p) => <Icon {...p} d={<path d="M2 2l20 20M11 5.1V3a3 3 0 0 1 6 0v6m0 3.4V11M5 11a7 7 0 0 0 7 7m4-2.4A7 7 0 0 0 19 11M12 19v3"/>}/>,
  speaker:   (p) => <Icon {...p} d={<path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/>}/>,
  pause:     (p) => <Icon {...p} d={<><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>}/>,
};

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
const Logo = () => (
  <div className="logo">
    <span className="mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h3l2-5 4 10 2-5h5"/>
      </svg>
    </span>
    <span>Med<span style={{color:'var(--accent)'}}>Flow</span></span>
  </div>
);

const Avatar = ({ name, src, size = "md", style }) => {
  const initials = (name || "").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className={`avatar ${size}`} style={style} aria-label={name}>
      {src ? <img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : initials}
    </div>
  );
};

const Pill = ({ children, variant, icon, style }) => (
  <span className={`pill ${variant||''}`} style={style}>{icon}{children}</span>
);

const Btn = ({ children, variant = "primary", size, icon, iconRight, onClick, style, disabled }) => (
  <button className={`btn btn-${variant} ${size?`btn-${size}`:''}`} onClick={onClick} style={style} disabled={disabled}>
    {icon}{children}{iconRight}
  </button>
);

// Headshot — deterministic gradient avatar with subtle face stamp
const Headshot = ({ name, hue = 210, size = 80, style }) => {
  const initials = (name || "").split(" ").map(s => s[0]).slice(0,2).join("");
  const h1 = hue, h2 = (hue + 40) % 360;
  return (
    <div style={{
      width:size, height:size, borderRadius: '50%',
      background:`linear-gradient(135deg, hsl(${h1} 65% 65%), hsl(${h2} 60% 40%))`,
      display:'grid', placeItems:'center', color:'#fff',
      fontWeight: 600, fontSize: size*0.32, letterSpacing: '-.02em',
      boxShadow:'inset 0 -10px 30px rgba(0,0,0,.18), inset 0 6px 14px rgba(255,255,255,.18)',
      flexShrink:0, ...style
    }} aria-label={name}>{initials}</div>
  );
};

// Spark line chart
const Spark = ({ data, color = 'var(--accent)', height = 60, fill = true }) => {
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v,i) => [
    (i / (data.length-1)) * w,
    h - 6 - ((v - min) / (max - min || 1)) * (h - 12)
  ]);
  const path = pts.map((p,i) => `${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{height}}>
      {fill && <path d={area} fill={color} opacity="0.14"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
};

// Rating stars
const Stars = ({ value = 4.8, size = 12, count = 5 }) => (
  <span style={{display:'inline-flex', gap:2, color:'var(--accent)'}}>
    {Array.from({length: count}).map((_,i) => (
      <I.star key={i} size={size} style={{opacity: i < Math.round(value) ? 1 : 0.22}}/>
    ))}
  </span>
);

// Atmospheric blob layer
const Atmos = () => <div className="atmos app-atmos" aria-hidden="true"/>;

// ─── DATA ───────────────────────────────────────────────────────────────────
const SPECIALTIES = [
  { id:'cardio',  name:'Cardiology',   icon:'heart',    hue: 0,   bg:'#ef4444' },
  { id:'neuro',   name:'Neurology',    icon:'brain',    hue: 270, bg:'#8b5cf6' },
  { id:'ortho',   name:'Orthopedics',  icon:'bone',     hue: 40,  bg:'#eab308' },
  { id:'pulm',    name:'Pulmonology',  icon:'lung',     hue: 190, bg:'#06b6d4' },
  { id:'oph',     name:'Ophthalmology',icon:'eye',      hue: 220, bg:'#3b82f6' },
  { id:'derm',    name:'Dermatology',  icon:'sparkle',  hue: 320, bg:'#ec4899' },
  { id:'gen',     name:'General Med',  icon:'activity', hue: 150, bg:'#10b981' },
  { id:'dent',    name:'Dentistry',    icon:'smile',    hue: 180, bg:'#14b8a6' },
];

const DOCTORS = [
  { id:'d1', name:'Dr. Sarah Jenkins',  spec:'Cardiology',    sub:'Heart failure · Echo', rating:4.9, reviews:412, exp:14, fee:120, next:'Today 2:30 PM', hue:340, mode:['Video','Voice','In-person'], badges:['Top rated','Premium'] },
  { id:'d2', name:'Dr. Marcus Chen',    spec:'Neurology',     sub:'Migraine · Sleep',     rating:4.8, reviews:287, exp:11, fee:140, next:'Tomorrow 10:00 AM', hue:270, mode:['Video','Voice'], badges:['Top rated'] },
  { id:'d3', name:'Dr. Aisha Okafor',   spec:'General Med',   sub:'Family medicine',      rating:4.9, reviews:621, exp:9,  fee:80,  next:'Today 5:00 PM', hue:150, mode:['Video','Voice','In-person'], badges:['Same-day'] },
  { id:'d4', name:'Dr. Lukas Bergström',spec:'Orthopedics',   sub:'Sports · Knee',        rating:4.7, reviews:198, exp:18, fee:160, next:'Thu 9:30 AM', hue:30,  mode:['In-person'], badges:['Premium'] },
  { id:'d5', name:'Dr. Priya Raghavan', spec:'Dermatology',   sub:'Acne · Skin checks',   rating:4.8, reviews:354, exp:7,  fee:95,  next:'Wed 1:00 PM', hue:320, mode:['Video','Voice'], badges:[] },
  { id:'d6', name:'Dr. Henrik Klein',   spec:'Pulmonology',   sub:'Asthma · Sleep apnea', rating:4.6, reviews:142, exp:21, fee:130, next:'Fri 11:00 AM', hue:190, mode:['Video','Voice','In-person'], badges:[] },
];

const SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'
];
const SLOT_DISABLED = new Set(['09:00','11:00','14:00','16:30']);

// Body zones — positions are % within the 380px stage; calibrated to the SVG body
const BODY_ZONES = [
  { id:'brain', name:'Neurology',     icon:'brain',    spec:'neuro',   x:50, y:11 },
  { id:'eye',   name:'Ophthalmology', icon:'eye',      spec:'oph',     x:43, y:16 },
  { id:'ear',   name:'Otology',       icon:'ear',      spec:'oph',     x:58, y:16 },
  { id:'mouth', name:'Dentistry',     icon:'smile',    spec:'dent',    x:50, y:20 },
  { id:'lung',  name:'Pulmonology',   icon:'lung',     spec:'pulm',    x:42, y:34 },
  { id:'heart', name:'Cardiology',    icon:'heart',    spec:'cardio',  x:54, y:36 },
  { id:'stom',  name:'Gastroenterology', icon:'stomach', spec:'gen',   x:50, y:48 },
  { id:'knee',  name:'Orthopedics',   icon:'bone',     spec:'ortho',   x:43, y:78 },
];

// Anatomy: a clean, abstract human silhouette SVG (no anatomical detail)
const BodySilhouette = ({ color = "currentColor", opacity = 0.16 }) => (
  <svg className="body-svg" viewBox="0 0 100 200" fill={color} opacity={opacity} aria-hidden="true">
    {/* Head */}
    <circle cx="50" cy="22" r="14"/>
    {/* Neck */}
    <rect x="44" y="34" width="12" height="8" rx="3"/>
    {/* Torso */}
    <path d="M28,50 Q30,42 50,42 Q70,42 72,50 L74,98 Q74,108 64,108 L36,108 Q26,108 26,98 Z"/>
    {/* Arms */}
    <path d="M26,54 Q18,60 16,82 Q14,108 18,128 Q22,134 26,128 Q30,108 32,90 Q34,72 32,58 Z"/>
    <path d="M74,54 Q82,60 84,82 Q86,108 82,128 Q78,134 74,128 Q70,108 68,90 Q66,72 68,58 Z"/>
    {/* Legs */}
    <path d="M36,110 Q34,140 36,170 Q38,188 44,188 Q48,188 48,170 Q49,140 48,110 Z"/>
    <path d="M64,110 Q66,140 64,170 Q62,188 56,188 Q52,188 52,170 Q51,140 52,110 Z"/>
  </svg>
);

// ─── EXPORTS to window so other JSX scripts see them ─────────────────────────
Object.assign(window, {
  I, Icon, Logo, Avatar, Pill, Btn, Headshot, Spark, Stars, Atmos,
  SPECIALTIES, DOCTORS, SLOTS, SLOT_DISABLED, BODY_ZONES, BodySilhouette
});
