// app-admin.jsx — MedFlow SaaS console shell

const { useState: ax_uS, useEffect: ax_uE } = React;

const ADMIN_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "clinical",
  "dark": false,
  "density": "regular",
  "accent": "#007AFF",
  "accent2": "#5856d6",
  "atmos": true,
  "startScreen": "overview"
}/*EDITMODE-END*/;

const ADMIN_MOOD_PRESETS = {
  clinical:  { accent:'#007AFF', accent2:'#5856d6', label:'Clinical' },
  warm:      { accent:'#e8654e', accent2:'#c98a3a', label:'Warm' },
  concierge: { accent:'#c8a76b', accent2:'#3b6b8e', label:'Concierge', dark:true },
  tech:      { accent:'#7afbac', accent2:'#8a7cff', label:'Tech',      dark:true },
};

function AdminApp() {
  const [t, setTweak] = useTweaks(ADMIN_TWEAK_DEFAULTS);
  const [screen, setScreen] = ax_uS(t.startScreen || 'overview');

  ax_uE(() => {
    const body = document.body;
    body.classList.remove('mood-clinical','mood-warm','mood-concierge','mood-tech');
    body.classList.add(`mood-${t.mood}`);
    body.classList.toggle('dark', !!t.dark);
    body.classList.remove('density-compact','density-regular','density-comfy');
    body.classList.add(`density-${t.density}`);
    if (t.mood === 'clinical') {
      body.style.setProperty('--accent', t.accent);
      body.style.setProperty('--accent-2', t.accent2);
    } else {
      body.style.removeProperty('--accent');
      body.style.removeProperty('--accent-2');
    }
    const atmos = document.querySelector('.atmos.app-atmos');
    if (atmos) atmos.style.display = t.atmos ? 'block' : 'none';
  }, [t.mood, t.dark, t.density, t.accent, t.accent2, t.atmos]);

  const pickMood = (mood) => {
    const preset = ADMIN_MOOD_PRESETS[mood];
    setTweak({ mood, accent: preset.accent, accent2: preset.accent2, dark: !!preset.dark });
  };

  const go = (to) => {
    setScreen(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const screens = {
    overview: <SaaSOverview goAdmin={go}/>,
    clinics:  <SaaSClinics/>,
    doctors:  <SaaSDoctors/>,
    patients: <SaaSPatients/>,
    billing:  <SaaSBilling/>,
    plans:    <SaaSPlans/>,
    audit:    <SaaSAudit/>,
    flags:    <SaaSFlags/>,
    settings: <SaaSSettings/>,
  };

  // Group nav items
  const sections = {};
  ADMIN_NAV.forEach(n => {
    sections[n.section] = sections[n.section] || [];
    sections[n.section].push(n);
  });
  const sectionLabel = { platform:'Platform', revenue:'Revenue', security:'Security', system:'System' };

  return (
    <div data-screen-label={`admin · ${screen}`}>
      <Atmos/>
      <div className="app-shell">
        <aside className="sidebar" data-screen-label="admin sidebar">
          <div className="row gap-2" style={{padding:'4px 8px'}}>
            <Logo/>
            <Pill variant="accent" style={{fontSize:9.5, padding:'2px 7px', letterSpacing:'.08em'}}>ADMIN</Pill>
          </div>

          <div className="col gap-2" style={{marginTop: 6}}>
            <div className="search" style={{padding: '8px 12px 8px 14px'}}>
              <I.search size={14} style={{color:'var(--ink-3)'}}/>
              <input placeholder="Jump to clinic, doctor…" style={{fontSize:13}}/>
              <span className="kbd">⌘K</span>
            </div>

            {Object.entries(sections).map(([sec, items]) => (
              <React.Fragment key={sec}>
                <div className="nav-section" style={{marginTop:10}}>{sectionLabel[sec]}</div>
                {items.map(n => {
                  const Icn = I[n.icon] || I.activity;
                  const active = screen === n.id;
                  return (
                    <button key={n.id} className={`nav-item ${active?'active':''}`} onClick={() => go(n.id)}>
                      <span className="dot" style={{background: active?'var(--accent)':'var(--ink-3)', width:6, height:6}}/>
                      <Icn size={16}/>
                      <span style={{flex:1, textAlign:'left'}}>{n.label}</span>
                      {n.id==='clinics' && <span className="tiny tnum">{CLINICS.length}</span>}
                      {n.id==='audit'   && <span className="pill bad" style={{fontSize:10, padding:'1px 7px'}}>2</span>}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div style={{marginTop:'auto'}}>
            <div className="glass" style={{padding:12, marginBottom:10}}>
              <div className="row gap-2" style={{marginBottom:8}}>
                <span className="dot" style={{background:'var(--good)', width:6, height:6}}/>
                <span className="tiny" style={{color:'var(--good)', fontWeight:600}}>All systems normal</span>
              </div>
              <div className="row between">
                <span className="tiny">API · 124ms p99</span>
                <span className="tiny mono">v2.41.0</span>
              </div>
            </div>
            <div className="row gap-3" style={{padding:'8px 6px'}}>
              <div className="avatar" style={{background:'linear-gradient(135deg, var(--ink), #444)'}}>A</div>
              <div className="grow col" style={{gap:0}}>
                <div style={{fontWeight:600, fontSize:13}}>Admin · MedFlow</div>
                <div className="tiny">admin@medflow.com</div>
              </div>
              <span className="icon-btn"><I.logout size={14}/></span>
            </div>
          </div>
        </aside>

        <main className="main" data-screen-label={`admin ${screen}`}>
          {/* Top utility bar */}
          <div className="row between" style={{marginBottom: 24, alignItems:'center'}}>
            <div className="row gap-2 tiny" style={{color:'var(--ink-3)'}}>
              <I.home size={12}/>
              <span>MedFlow</span>
              <I.chevR size={11}/>
              <span style={{textTransform:'capitalize'}}>{screen}</span>
            </div>
            <div className="row gap-2">
              <button className="icon-btn"><I.bell size={16}/></button>
              <button className="icon-btn"><I.cog size={16}/></button>
              <div className="vr" style={{height:24}}/>
              <Pill variant="good"><span className="dot" style={{background:'var(--good)'}}/>Production</Pill>
            </div>
          </div>
          {screens[screen]}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Mood"/>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:6}}>
          {Object.entries(ADMIN_MOOD_PRESETS).map(([k,v]) => (
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

        <TweakSection label="Jump to screen"/>
        <TweakSelect label="Screen" value={screen}
          options={ADMIN_NAV.map(n => n.id)}
          onChange={(v)=> go(v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp/>);
