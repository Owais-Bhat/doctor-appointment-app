// app-doctor.jsx — MedFlow Doctor Portal shell.
// Audience: a doctor running their clinic on MedFlow.

const { useState: dx_uS, useEffect: dx_uE } = React;

const DOCTOR_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "clinical",
  "dark": false,
  "density": "regular",
  "accent": "#007AFF",
  "accent2": "#5856d6",
  "atmos": true,
  "startScreen": "today"
}/*EDITMODE-END*/;

const DOCTOR_MOOD_PRESETS = {
  clinical:  { accent:'#007AFF', accent2:'#5856d6', label:'Clinical' },
  warm:      { accent:'#e8654e', accent2:'#c98a3a', label:'Warm' },
  concierge: { accent:'#c8a76b', accent2:'#3b6b8e', label:'Concierge', dark:true },
  tech:      { accent:'#7afbac', accent2:'#8a7cff', label:'Tech',      dark:true },
};

const DOC_NAV = [
  { id:'today',     label:"Today",     icon:'home' },
  { id:'calendar',  label:"Calendar",  icon:'cal' },
  { id:'patients',  label:"Patients",  icon:'users', count: 412 },
  { id:'messages',  label:"Messages",  icon:'chat',  badge: 3 },
  { id:'records',   label:"Records",   icon:'doc' },
  { id:'earnings',  label:"Earnings",  icon:'activity' },
  { id:'settings',  label:"Settings",  icon:'cog' },
];

function DoctorApp() {
  const [t, setTweak] = useTweaks(DOCTOR_TWEAK_DEFAULTS);
  const [screen, setScreen] = dx_uS(t.startScreen || 'today');

  dx_uE(() => {
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
    const preset = DOCTOR_MOOD_PRESETS[mood];
    setTweak({ mood, accent: preset.accent, accent2: preset.accent2, dark: !!preset.dark });
  };

  const go = (to) => {
    setScreen(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const screens = {
    today:    <Admin go={go}/>,
    calendar: <DoctorCalendar/>,
    patients: <DoctorPatients/>,
    messages: <DoctorMessages/>,
    records:  <DoctorRecords/>,
    earnings: <DoctorEarnings/>,
    settings: <DoctorSettings/>,
    voicecall:<VoiceCallScene go={go}/>,
  };

  return (
    <div data-screen-label={`doctor · ${screen}`}>
      <Atmos/>
      <div className="app-shell">
        <aside className="sidebar" data-screen-label="doctor sidebar">
          <div className="row gap-2" style={{padding:'4px 8px'}}>
            <Logo/>
            <Pill variant="accent" style={{fontSize:9.5, padding:'2px 7px', letterSpacing:'.08em'}}>DOCTOR</Pill>
          </div>

          <div className="col gap-2" style={{marginTop: 8}}>
            <div className="search" style={{padding: '8px 12px 8px 14px'}}>
              <I.search size={14} style={{color:'var(--ink-3)'}}/>
              <input placeholder="Search patients, notes…" style={{fontSize:13}}/>
              <span className="kbd">⌘K</span>
            </div>

            <div className="nav-section" style={{marginTop:12}}>Clinic</div>
            {DOC_NAV.map(n => {
              const Icn = I[n.icon] || I.activity;
              const active = screen === n.id;
              return (
                <button key={n.id} className={`nav-item ${active?'active':''}`} onClick={() => go(n.id)}>
                  <span className="dot" style={{background: active?'var(--accent)':'var(--ink-3)', width:6, height:6}}/>
                  <Icn size={16}/>
                  <span style={{flex:1, textAlign:'left'}}>{n.label}</span>
                  {n.count != null && <span className="tiny tnum">{n.count}</span>}
                  {n.badge && <span className="pill accent" style={{fontSize:10, padding:'1px 7px'}}>{n.badge}</span>}
                </button>
              );
            })}
            {screen === 'voicecall' && (
              <button className="nav-item active" style={{marginLeft:24, fontSize:13}}>
                <span className="dot" style={{background:'var(--bad)', width:6, height:6, animation:'vc-pulse-ring 1.5s ease-out infinite'}}/>
                <I.phone size={14}/>
                <span>Live call</span>
              </button>
            )}
          </div>

          {/* Quick "next patient" CTA */}
          <div style={{marginTop:'auto'}}>
            <div className="glass-strong" style={{padding:14, marginBottom:10}}>
              <div className="eyebrow" style={{marginBottom:8}}>Next patient · 11:00</div>
              <div className="row gap-3" style={{marginBottom:10}}>
                <Headshot name="James Okonkwo" hue={160} size={36}/>
                <div>
                  <div style={{fontWeight:600, fontSize:13}}>James Okonkwo</div>
                  <div className="tiny">Pre-op consult · 30m</div>
                </div>
              </div>
              <Btn size="sm" style={{width:'100%'}} icon={<I.video size={13}/>} onClick={() => go('voicecall')}>Join in 12 min</Btn>
            </div>
            <div className="row gap-3" style={{padding:'8px 6px'}}>
              <Headshot name="Sarah Jenkins" hue={340} size={32}/>
              <div className="grow col" style={{gap:0}}>
                <div style={{fontWeight:600, fontSize:13}}>Dr. Sarah Jenkins</div>
                <div className="tiny">Cardiology · Online</div>
              </div>
              <span className="icon-btn"><I.logout size={14}/></span>
            </div>
          </div>
        </aside>

        <main className="main" data-screen-label={`doctor ${screen}`}>
          <div className="row between" style={{marginBottom: 24, alignItems:'center'}}>
            <div className="row gap-2 tiny" style={{color:'var(--ink-3)'}}>
              <I.home size={12}/>
              <span>Jenkins Cardiology</span>
              <I.chevR size={11}/>
              <span style={{textTransform:'capitalize'}}>{screen}</span>
            </div>
            <div className="row gap-2">
              <Pill variant="good"><span className="dot" style={{background:'var(--good)'}}/>Accepting voice & video</Pill>
              <button className="icon-btn"><I.bell size={16}/></button>
              <button className="icon-btn"><I.cog size={16}/></button>
            </div>
          </div>

          {screens[screen]}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Mood"/>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:6}}>
          {Object.entries(DOCTOR_MOOD_PRESETS).map(([k,v]) => (
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
          options={['today','calendar','patients','messages','records','earnings','settings','voicecall']}
          onChange={(v)=> go(v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DoctorApp/>);
