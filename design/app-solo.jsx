// app.jsx — MedFlow shell: sidebar, screen router, mobile, practice mode, Tweaks

const { useState: a_uS, useEffect: a_uE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "clinical",
  "dark": false,
  "density": "regular",
  "accent": "#007AFF",
  "accent2": "#5856d6",
  "atmos": true,
  "novelUX": "body",
  "startScreen": "landing",
  "mode": "practice",
  "view": "desktop"
}/*EDITMODE-END*/;

const MOOD_PRESETS = {
  clinical:  { accent:'#007AFF', accent2:'#5856d6', label:'Clinical' },
  warm:      { accent:'#e8654e', accent2:'#c98a3a', label:'Warm' },
  concierge: { accent:'#c8a76b', accent2:'#3b6b8e', label:'Concierge', dark:true },
  tech:      { accent:'#7afbac', accent2:'#8a7cff', label:'Tech',      dark:true },
};

// ─── Mobile bottom tab bar ────────────────────────────────────────
function TabBar({ items, active, onPick, accent }) {
  const middle = Math.floor(items.length / 2);
  return (
    <nav className="tabbar" aria-label="Primary">
      {items.map((it, i) => {
        const isFab = it.fab;
        const isActive = active === it.id;
        return (
          <button key={it.id} className={`tabbar-item ${isActive?'active':''} ${isFab?'fab':''}`} onClick={() => onPick(it.id)}>
            {isFab ? <span className="pill-fab">{it.icon}</span> : it.icon}
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileHeader({ title, action, onBack }) {
  return (
    <div className="mobile-header">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Back"><I.arrowL size={18}/></button>
      ) : (
        <Logo/>
      )}
      <div className="row gap-2">
        <button className="icon-btn" aria-label="Notifications"><I.bell size={18}/></button>
        <Headshot name="Alex Rivera" hue={210} size={32}/>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = a_uS(t.startScreen || 'landing');
  const [params, setParams] = a_uS({});
  const [toast, setToast] = a_uS(null);

  const isPractice = t.mode === 'practice';
  const isMobile = t.view === 'mobile';

  // Apply mood/dark/density + mobile force class on body
  a_uE(() => {
    const body = document.body;
    body.classList.remove('mood-clinical','mood-warm','mood-concierge','mood-tech');
    body.classList.add(`mood-${t.mood}`);
    body.classList.toggle('dark', !!t.dark);
    body.classList.remove('density-compact','density-regular','density-comfy');
    body.classList.add(`density-${t.density}`);
    body.classList.toggle('force-mobile', isMobile);
    if (t.mood === 'clinical') {
      body.style.setProperty('--accent', t.accent);
      body.style.setProperty('--accent-2', t.accent2);
    } else {
      body.style.removeProperty('--accent');
      body.style.removeProperty('--accent-2');
    }
    const atmos = document.querySelector('.atmos.app-atmos');
    if (atmos) atmos.style.display = t.atmos ? 'block' : 'none';
  }, [t.mood, t.dark, t.density, t.accent, t.accent2, t.atmos, isMobile]);

  const pickMood = (mood) => {
    const preset = MOOD_PRESETS[mood];
    setTweak({ mood, accent: preset.accent, accent2: preset.accent2, dark: !!preset.dark });
  };

  // Route guard — if practice mode, redirect 'doctors' → 'about'
  const resolveScreen = (s) => {
    if (isPractice && s === 'doctors') return 'about';
    if (!isPractice && s === 'about') return 'doctors';
    return s;
  };

  const go = (to, p = {}) => {
    if (to === 'discover' && p.ux) {
      setTweak('novelUX', p.ux);
      setParams(prev => ({ ...prev, ...p }));
      setScreen('discover');
      return;
    }
    // In practice mode, all booking is for Dr. Jenkins
    if (isPractice && to === 'book') p.docId = HER?.id || 'd1';
    setParams(p);
    setScreen(resolveScreen(to));
    if (to === 'confirm') {
      setTimeout(() => setToast('Calendar invite sent · pre-call note ready'), 600);
      setTimeout(() => setToast(null), 4600);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also scroll iPhone content if applicable
    const ios = document.querySelector('.ios-content');
    if (ios) ios.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Screen components — adapts to practice mode
  const screens = {
    landing:   isPractice ? <PracticeLanding go={go}/> : <Landing go={go}/>,
    discover:  <Discover go={go} novelUX={t.novelUX}/>,
    doctors:   <Doctors  go={go} prefilterSpec={params.spec}/>,
    about:     <PracticeAbout go={go}/>,
    book:      <Book     go={go} doctorId={params.docId || (isPractice ? HER?.id : 'd1')}/>,
    confirm:   <Confirm  go={go} doctorId={params.docId || (isPractice ? HER?.id : 'd1')} day={params.day ?? 0} slot={params.slot || '14:30'} mode={params.mode}/>,
    dashboard: <Dashboard go={go} practice={isPractice}/>,
    voicecall: <VoiceCallScene go={go}/>,
    admin:     <Admin    go={go}/>,
  };

  // Desktop sidebar nav items
  const navPatient = isPractice ? [
    { id:'landing',   label:'Home',        icon:<I.home size={16}/> },
    { id:'about',     label:'About',       icon:<I.user size={16}/> },
    { id:'discover',  label:'Symptom check',icon:<I.sparkle size={16}/>, badge:'AI' },
    { id:'dashboard', label:'My visits',   icon:<I.activity size={16}/> },
  ] : [
    { id:'landing',   label:'Home',         icon:<I.home size={16}/> },
    { id:'discover',  label:'Find care',    icon:<I.sparkle size={16}/>, badge:'AI' },
    { id:'doctors',   label:'Doctors',      icon:<I.users size={16}/> },
    { id:'dashboard', label:'My health',    icon:<I.activity size={16}/> },
  ];
  const navProvider = [
    { id:'admin',     label:'Doctor portal', icon:<I.cards size={16}/> },
  ];
  const isInFlow = ['book','confirm'].includes(screen);

  // Mobile bottom-tab items
  const tabItems = isPractice ? [
    { id:'landing',   label:'Home',     icon:<I.home size={18}/> },
    { id:'about',     label:'About',    icon:<I.user size={18}/> },
    { id:'book',      label:'Book',     icon:<I.plus size={22}/>, fab:true },
    { id:'dashboard', label:'My visits',icon:<I.activity size={18}/> },
    { id:'admin',     label:'Portal',   icon:<I.cards size={18}/> },
  ] : [
    { id:'landing',   label:'Home',     icon:<I.home size={18}/> },
    { id:'discover',  label:'Find',     icon:<I.sparkle size={18}/> },
    { id:'doctors',   label:'Doctors',  icon:<I.users size={18}/> },
    { id:'dashboard', label:'Health',   icon:<I.activity size={18}/> },
    { id:'admin',     label:'Portal',   icon:<I.cards size={18}/> },
  ];

  // The app body content
  const appBody = (
    <div data-screen-label={`${screen}${isPractice?' (practice)':''}${isMobile?' (mobile)':''}`}>
      <Atmos/>
      <div className="app-shell">
        {/* DESKTOP SIDEBAR */}
        <aside className="sidebar" data-screen-label="sidebar">
          <Logo/>
          <div className="col gap-2" style={{marginTop: 8}}>
            <div className="search" style={{padding: '8px 12px 8px 14px'}}>
              <I.search size={14} style={{color:'var(--ink-3)'}}/>
              <input placeholder="Search…" style={{fontSize:13}}/>
              <span className="kbd">⌘K</span>
            </div>
            <div className="nav-section" style={{marginTop:12}}>{isPractice ? 'Practice' : 'Patient'}</div>
            {navPatient.map(n => (
              <button key={n.id} className={`nav-item ${screen===n.id ? 'active':''}`} onClick={() => go(n.id)}>
                <span className="dot" style={{background: screen===n.id?'var(--accent)':'var(--ink-3)', width:6, height:6}}/>
                {n.icon}
                <span style={{flex:1, textAlign:'left'}}>{n.label}</span>
                {n.badge && <span className="pill accent" style={{fontSize:10, padding:'2px 8px'}}>{n.badge}</span>}
              </button>
            ))}
            {isInFlow && (
              <button className={`nav-item active`} style={{marginLeft:24, fontSize:13}}>
                <span className="dot" style={{background:'var(--accent)', width:6, height:6}}/>
                <I.cal size={14}/>
                <span>{screen==='book'?'Booking…':'Confirmed'}</span>
              </button>
            )}
            <div className="nav-section">Provider</div>
            {navProvider.map(n => (
              <button key={n.id} className={`nav-item ${screen===n.id ? 'active':''}`} onClick={() => go(n.id)}>
                <span className="dot" style={{background: screen===n.id?'var(--accent)':'var(--ink-3)', width:6, height:6}}/>
                {n.icon}
                <span style={{flex:1, textAlign:'left'}}>{n.label}</span>
              </button>
            ))}
          </div>

          <div style={{marginTop:'auto'}}>
            <div className="glass" style={{padding:14, marginBottom:10}}>
              <div className="row gap-3">
                <div className="avatar md" style={{background:'linear-gradient(135deg, var(--accent), var(--accent-2))'}}><I.sparkle size={18}/></div>
                <div className="col grow" style={{gap:2}}>
                  <div style={{fontWeight:600, fontSize:13}}>{isPractice ? 'Concierge plan' : 'MedFlow Plus'}</div>
                  <div className="tiny">{isPractice ? 'Unlimited visits, priority slots.' : 'Unlimited consults, priority booking.'}</div>
                </div>
              </div>
              <Btn size="sm" style={{width:'100%', marginTop:10}}>Upgrade</Btn>
            </div>
            <div className="row gap-3" style={{padding:'8px 6px'}}>
              <Headshot name="Alex Rivera" hue={210} size={32}/>
              <div className="grow col" style={{gap:0}}>
                <div style={{fontWeight:600, fontSize:13}}>Alex Rivera</div>
                <div className="tiny">Member · O+</div>
              </div>
              <span className="icon-btn"><I.cog size={14}/></span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main" data-screen-label={`${screen} content`}>
          {/* Mobile header */}
          <MobileHeader
            title={screen}
            onBack={isInFlow ? () => go(isPractice ? 'about' : 'doctors') : null}
          />

          {screens[screen]}

          {/* Mobile bottom tab bar — sits at bottom of the main content */}
          <TabBar items={tabItems} active={screen} onPick={(id) => go(id)} accent={t.accent}/>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <I.checkCircle size={16} style={{color:'var(--good)'}}/>
          <span style={{fontSize:13}}>{toast}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div className="phone-stage">
          <div className="stage-meta">
            <Logo/>
            <div className="tiny" style={{maxWidth: 240, lineHeight: 1.4}}>
              Mobile · iPhone 16 Pro · {isPractice ? 'Single-practice mode' : 'Marketplace mode'}
            </div>
          </div>
          <div className="ios-wrap">
            <IOSDevice width={402} height={874} dark={!!t.dark}>
              <div className="ios-content">
                {appBody}
              </div>
            </IOSDevice>
          </div>
          {/* Side preview cards (purely decorative copy of CTA) */}
        </div>
      ) : appBody}

      {/* TWEAKS — always rendered on top */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Product mode"/>
        <TweakRadio label="Mode" value={t.mode}
          options={['marketplace','practice']}
          onChange={(v)=>{ setTweak('mode', v); setScreen('landing'); setParams({}); }}/>
        <TweakRadio label="View" value={t.view}
          options={['desktop','mobile']}
          onChange={(v)=>setTweak('view', v)}/>

        <TweakSection label="Mood"/>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:6}}>
          {Object.entries(MOOD_PRESETS).map(([k,v]) => (
            <button key={k} onClick={() => pickMood(k)}
              style={{
                appearance:'none', cursor:'pointer', textAlign:'left',
                padding:'8px 10px', borderRadius:10,
                border: `1px solid ${t.mood===k?'rgba(0,0,0,.5)':'rgba(0,0,0,.12)'}`,
                background: t.mood===k ? 'rgba(0,0,0,.06)' : 'transparent',
                fontSize:11.5, fontFamily:'inherit', color:'inherit'
              }}>
              <div style={{display:'flex', gap:4, marginBottom:6}}>
                <span style={{width:14, height:14, borderRadius:'50%', background:v.accent}}/>
                <span style={{width:14, height:14, borderRadius:'50%', background:v.accent2}}/>
              </div>
              <div style={{fontWeight:600}}>{v.label}</div>
            </button>
          ))}
        </div>
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v)=>setTweak('dark', v)}/>
        <TweakRadio  label="Density"  value={t.density}
          options={['compact','regular','comfy']}
          onChange={(v)=>setTweak('density', v)}/>
        <TweakToggle label="Atmospheric blobs" value={t.atmos} onChange={(v)=>setTweak('atmos', v)}/>

        <TweakSection label="Accent (Clinical mood)"/>
        <TweakColor label="Primary"   value={t.accent}
          options={['#007AFF','#0ea5e9','#8b5cf6','#10b981','#ec4899','#f59e0b']}
          onChange={(v)=>setTweak('accent', v)}/>
        <TweakColor label="Secondary" value={t.accent2}
          options={['#5856d6','#3b82f6','#06b6d4','#14b8a6','#f472b6','#fb923c']}
          onChange={(v)=>setTweak('accent2', v)}/>

        <TweakSection label="Triage UX"/>
        <TweakRadio  label="Discover mode" value={t.novelUX}
          options={['body','ai']}
          onChange={(v)=>setTweak('novelUX', v)}/>

        <TweakSection label="Jump to screen"/>
        <TweakSelect label="Screen" value={screen}
          options={isPractice
            ? ['landing','about','discover','book','confirm','dashboard','voicecall','admin']
            : ['landing','discover','doctors','book','confirm','dashboard','voicecall','admin']
          }
          onChange={(v)=> go(v)}/>
      </TweaksPanel>
    </>
  );
}

// Wait for HER (from practice-screens.jsx) — it's set as a module-level const there,
// but exported as window.HER for safety from practice-screens. Since that file
// references DOCTORS[0] directly, we can also do the same here as fallback.
const HER = (window.DOCTORS && window.DOCTORS[0]) || null;

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
