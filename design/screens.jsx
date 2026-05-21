// screens.jsx — page-level scenes for the MedFlow prototype.

const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

// ═══════════════════════════════════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════════════════════════════════
function Landing({ go }) {
  return (
    <div className="fade-enter">
      {/* Hero */}
      <section className="hero">
        <div className="col gap-6">
          <div className="row gap-3">
            <Pill variant="accent" icon={<I.shield size={13}/>}>HIPAA-compliant · End-to-end encrypted</Pill>
          </div>
          <h1 className="h-display">
            Healthcare,<br/>
            <span className="hero-italic" style={{color:'var(--accent)'}}>reimagined</span>.
          </h1>
          <p className="body" style={{maxWidth: 520, fontSize:18}}>
            Find the right specialist in under a minute. Book by symptom, not by guesswork —
            and meet your doctor wherever you are.
          </p>
          <div className="row gap-3 wrap">
            <Btn size="lg" icon={<I.sparkle size={16}/>} onClick={() => go('discover')}>Find my specialist</Btn>
            <Btn size="lg" variant="ghost" iconRight={<I.arrowR size={16}/>} onClick={() => go('doctors')}>Browse doctors</Btn>
          </div>
          <div className="row gap-6 wrap" style={{marginTop:8, color:'var(--ink-3)', fontSize:13}}>
            <div className="row gap-2"><I.users size={15}/> 12,400+ patients monthly</div>
            <div className="row gap-2"><I.star size={13}/> 4.9 avg rating</div>
            <div className="row gap-2"><I.clock size={15}/> Avg. wait: 8 min</div>
          </div>
        </div>

        {/* Right: floating preview of bento */}
        <div className="col gap-3" style={{position:'relative'}}>
          <div className="glass-strong" style={{padding:18, transform:'rotate(-1deg)'}}>
            <div className="row between" style={{marginBottom: 12}}>
              <div className="eyebrow">Next appointment</div>
              <Pill variant="good" icon={<span className="dot" style={{background:'var(--good)'}}/>}>Confirmed</Pill>
            </div>
            <div className="row gap-3">
              <Headshot name="Sarah Jenkins" hue={340} size={56}/>
              <div className="col" style={{gap:2}}>
                <div className="h-4">Dr. Sarah Jenkins</div>
                <div className="small">Cardiology · Video consultation</div>
              </div>
            </div>
            <div className="row between" style={{marginTop:16}}>
              <div className="row gap-2 tnum"><I.cal size={14}/><span style={{fontWeight:600}}>Today</span><span style={{color:'var(--ink-3)'}}>·</span><span>2:30 PM</span></div>
              <Btn size="sm" variant="dark" icon={<I.video size={14}/>}>Join</Btn>
            </div>
          </div>
          <div className="row gap-3" style={{transform:'translateX(20px)'}}>
            <div className="glass" style={{padding:16, flex:1}}>
              <div className="eyebrow" style={{marginBottom:8}}>Heart rate</div>
              <div className="row between" style={{alignItems:'baseline'}}>
                <div><span className="h-2 tnum">72</span><span className="small" style={{marginLeft:4}}>bpm</span></div>
                <span style={{color:'var(--good)'}}><I.trendUp size={16}/></span>
              </div>
              <Spark data={[68,70,69,72,71,73,72,74,72]} color="var(--accent)" height={36}/>
            </div>
            <div className="glass" style={{padding:16, flex:1}}>
              <div className="eyebrow" style={{marginBottom:8}}>Sleep</div>
              <div className="row between" style={{alignItems:'baseline'}}>
                <div><span className="h-2 tnum">7.4</span><span className="small" style={{marginLeft:4}}>hrs</span></div>
                <Pill variant="accent">Good</Pill>
              </div>
              <Spark data={[6,7.2,6.8,7.4,7.1,7.6,7.4]} color="var(--accent-2)" height={36}/>
            </div>
          </div>
          <div className="glass-strong" style={{padding:16, transform:'translateX(40px) rotate(1deg)'}}>
            <div className="row gap-3">
              <div className="avatar md" style={{background:'linear-gradient(135deg, var(--accent), var(--accent-2))'}}><I.sparkle size={20}/></div>
              <div className="col" style={{gap:2}}>
                <div className="h-4">AI symptom triage</div>
                <div className="small">Describe how you feel. We'll match you to the right specialist.</div>
              </div>
              <I.arrowR size={18} style={{color:'var(--ink-3)'}}/>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties strip */}
      <section className="col gap-5" style={{marginTop:16}}>
        <div className="row between">
          <div className="col" style={{gap:6}}>
            <div className="eyebrow">Coverage</div>
            <h2 className="h-2">Care for every system.</h2>
          </div>
          <Btn variant="ghost" size="sm" iconRight={<I.arrowR size={14}/>} onClick={() => go('doctors')}>All specialties</Btn>
        </div>
        <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
          {SPECIALTIES.map(s => {
            const Icn = I[s.icon] || I.activity;
            return (
              <button key={s.id} className="glass cell" style={{textAlign:'left', cursor:'pointer'}} onClick={() => go('doctors', { spec: s.id })}>
                <div className="col gap-3">
                  <div className="avatar md" style={{background: `color-mix(in oklab, ${s.bg} 18%, transparent)`, color: s.bg}}>
                    <Icn size={20}/>
                  </div>
                  <div>
                    <div className="h-4">{s.name}</div>
                    <div className="small" style={{marginTop:2}}>{Math.floor(8 + Math.random()*30)} specialists</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="col gap-5" style={{marginTop:64}}>
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">How it works</div>
          <h2 className="h-2">From symptom to specialist in three taps.</h2>
        </div>
        <div className="bento" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
          {[
            { n:'01', t:'Describe how you feel', d:'Tap a body region or talk to our AI. We map symptoms to specialties — no Googling.', icon:<I.sparkle size={22}/>},
            { n:'02', t:'Match a real specialist', d:'See live availability, fees, and ratings — filtered to clinicians who can help right now.', icon:<I.users size={22}/>},
            { n:'03', t:'Meet your doctor', d:'Join over video or in-person. Records, prescriptions, and follow-ups stay in one place.', icon:<I.video size={22}/>},
          ].map((s,i) => (
            <div key={s.n} className="glass cell">
              <div className="row between" style={{marginBottom: 20}}>
                <span className="mono tiny" style={{color:'var(--accent)'}}>{s.n}</span>
                <span style={{color:'var(--accent)'}}>{s.icon}</span>
              </div>
              <div className="h-3" style={{marginBottom:8}}>{s.t}</div>
              <div className="body" style={{fontSize:14}}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVER — body-picker + AI triage
// ═══════════════════════════════════════════════════════════════════════════
function Discover({ go, novelUX }) {
  const [zone, setZone] = uS(null);
  const [chat, setChat] = uS([
    { from:'bot', t:"Hi — I'm here to help you find the right specialist. Where does it hurt, or what are you noticing lately?" },
  ]);
  const [typing, setTyping] = uS('');

  const send = (msg) => {
    const m = (msg || typing).trim(); if (!m) return;
    const next = [...chat, { from:'user', t:m }];
    setChat(next);
    setTyping('');
    setTimeout(() => {
      // Naive matching — pick a specialty mention
      const lower = m.toLowerCase();
      const hit = SPECIALTIES.find(s => lower.includes(s.name.toLowerCase().slice(0,5))) ||
                  (lower.match(/chest|heart|palpit/) && SPECIALTIES.find(s=>s.id==='cardio')) ||
                  (lower.match(/head|migrain|dizz/) && SPECIALTIES.find(s=>s.id==='neuro')) ||
                  (lower.match(/cough|breath|asthma/) && SPECIALTIES.find(s=>s.id==='pulm')) ||
                  (lower.match(/skin|rash|acne/) && SPECIALTIES.find(s=>s.id==='derm')) ||
                  SPECIALTIES.find(s=>s.id==='gen');
      setChat([...next, { from:'bot', t:`Sounds like a ${hit.name.toLowerCase()} concern. I'd recommend a ${hit.name} specialist. Want to see who's available today?`, action: { label:`See ${hit.name} doctors`, spec: hit.id }}]);
    }, 700);
  };

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-5">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">Triage</div>
          <h1 className="h-1">Where does it <span className="hero-italic" style={{color:'var(--accent)'}}>hurt</span>?</h1>
          <p className="body" style={{maxWidth:520}}>Tap a region — or describe it to our AI. We'll route you to the right specialist.</p>
        </div>
        <div className="tabs">
          <button className={`tab ${novelUX==='body'?'active':''}`} onClick={() => go('discover', { ux:'body' })}>Body map</button>
          <button className={`tab ${novelUX==='ai'?'active':''}`} onClick={() => go('discover', { ux:'ai' })}>AI chat</button>
        </div>
      </div>

      <div className="discover-grid" style={{display:'grid', gridTemplateColumns: novelUX==='ai' ? '1.2fr .8fr' : '.9fr 1.1fr', gap: 24, alignItems:'start'}}>
        {/* LEFT: body map OR chat */}
        {novelUX !== 'ai' ? (
          <div className="glass" style={{padding:32, display:'grid', placeItems:'center', minHeight: 540}}>
            <div className="body-stage">
              <BodySilhouette/>
              {BODY_ZONES.map(z => (
                <button
                  key={z.id}
                  className={`zone-dot ${zone?.id===z.id?'active':''}`}
                  style={{left:`${z.x}%`, top:`${z.y}%`, transform:'translate(-50%,-50%)'}}
                  onClick={() => setZone(z)}
                  aria-label={z.name}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass" style={{padding:24, display:'flex', flexDirection:'column', gap:12, minHeight: 540, maxHeight: 540}}>
            <div className="row gap-3">
              <div className="avatar md" style={{background:'linear-gradient(135deg, var(--accent), var(--accent-2))'}}><I.sparkle size={20}/></div>
              <div className="col" style={{gap:2}}>
                <div className="h-4">MedFlow AI</div>
                <div className="tiny"><span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'var(--good)',marginRight:6}}/>Listening · not a diagnosis</div>
              </div>
            </div>
            <hr className="hr"/>
            <div className="col" style={{gap:8, flex:1, overflowY:'auto', paddingRight:4}}>
              {chat.map((m,i) => (
                <div key={i} className={`bubble ${m.from}`}>
                  {m.t}
                  {m.action && (
                    <div style={{marginTop:10}}>
                      <Btn size="sm" variant="dark" iconRight={<I.arrowR size={14}/>}
                           onClick={() => go('doctors', { spec: m.action.spec })}>{m.action.label}</Btn>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="row gap-2" style={{flexWrap:'wrap'}}>
              {['Chest tightness','Migraine','Knee pain','Skin rash'].map(q => (
                <button key={q} className="pill" onClick={() => send(q)} style={{cursor:'pointer'}}>{q}</button>
              ))}
            </div>
            <div className="search" style={{marginTop:4}}>
              <I.chat size={16} style={{color:'var(--ink-3)'}}/>
              <input value={typing} onChange={e=>setTyping(e.target.value)}
                onKeyDown={e => e.key==='Enter' && send()}
                placeholder="Describe your symptoms…"/>
              <Btn variant="primary" size="sm" icon={<I.send size={14}/>} onClick={() => send()}>Send</Btn>
            </div>
          </div>
        )}

        {/* RIGHT: dynamic result panel */}
        <div className="col gap-4">
          {zone && novelUX !== 'ai' ? (
            <div className="glass-strong" style={{padding:24}}>
              <div className="eyebrow" style={{marginBottom:6}}>Recommended specialty</div>
              <div className="row gap-3" style={{marginBottom:14}}>
                <div className="avatar lg" style={{background: `color-mix(in oklab, var(--accent) 18%, transparent)`, color:'var(--accent)'}}>
                  {React.createElement(I[zone.icon] || I.activity, { size: 28 })}
                </div>
                <div className="col" style={{gap:2}}>
                  <div className="h-2">{zone.name}</div>
                  <div className="small">Based on the region you selected</div>
                </div>
              </div>
              <div className="col gap-3">
                {DOCTORS.filter(d => d.spec.toLowerCase().includes(zone.spec === 'oph' ? 'ophth' : zone.spec === 'cardio' ? 'card' : zone.spec === 'neuro' ? 'neur' : zone.spec === 'pulm' ? 'pulm' : zone.spec === 'ortho' ? 'ortho' : zone.spec === 'derm' ? 'derm' : zone.spec === 'gen' ? 'gener' : zone.spec)).slice(0,2).map(d => (
                  <button key={d.id} className="glass doc-card" style={{textAlign:'left'}} onClick={() => go('book', { docId: d.id })}>
                    <div className="row gap-3">
                      <Headshot name={d.name} hue={d.hue} size={56}/>
                      <div className="grow">
                        <div className="row between"><div className="h-4">{d.name}</div><div className="row gap-1 tiny"><I.star size={12} style={{color:'var(--accent)'}}/><b>{d.rating}</b></div></div>
                        <div className="small">{d.sub}</div>
                        <div className="row gap-2" style={{marginTop:6}}><Pill variant="good" icon={<I.clock size={12}/>}>{d.next}</Pill></div>
                      </div>
                      <I.chevR size={18} style={{color:'var(--ink-3)'}}/>
                    </div>
                  </button>
                ))}
                <Btn variant="ghost" iconRight={<I.arrowR size={14}/>} onClick={() => go('doctors', { spec: zone.spec })}>See all {zone.name} doctors</Btn>
              </div>
            </div>
          ) : (
            <div className="glass" style={{padding:24}}>
              <div className="eyebrow" style={{marginBottom:12}}>{novelUX==='ai' ? 'Suggested quick paths' : 'Or browse by specialty'}</div>
              <div className="col gap-2">
                {SPECIALTIES.slice(0,6).map(s => {
                  const Icn = I[s.icon] || I.activity;
                  return (
                    <button key={s.id} className="row between" style={{
                      padding:'10px 12px', borderRadius:12, cursor:'pointer',
                      background:'transparent', border:'1px solid var(--line)'
                    }}
                    onClick={() => go('doctors', { spec: s.id })}>
                      <div className="row gap-3">
                        <span style={{color:s.bg}}><Icn size={18}/></span>
                        <span style={{fontWeight:500, fontSize:14}}>{s.name}</span>
                      </div>
                      <I.chevR size={16} style={{color:'var(--ink-3)'}}/>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="glass" style={{padding:18}}>
            <div className="row gap-3">
              <div style={{color:'var(--accent)'}}><I.shield size={20}/></div>
              <div className="col" style={{gap:4}}>
                <div className="h-4">Triage isn't diagnosis.</div>
                <div className="small">Our AI suggests specialties only. For emergencies, call your local emergency number.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCTORS — browse + filter
// ═══════════════════════════════════════════════════════════════════════════
function Doctors({ go, prefilterSpec }) {
  const [search, setSearch] = uS('');
  const [spec, setSpec] = uS(prefilterSpec || 'all');
  const [mode, setMode] = uS('all');
  const list = uM(() => DOCTORS.filter(d => {
    const okSpec = spec==='all' || d.spec.toLowerCase().includes(spec === 'oph' ? 'ophth' : spec === 'cardio' ? 'card' : spec === 'neuro' ? 'neur' : spec === 'pulm' ? 'pulm' : spec === 'ortho' ? 'ortho' : spec === 'derm' ? 'derm' : spec === 'gen' ? 'gener' : spec === 'dent' ? 'dent' : spec);
    const okMode = mode==='all' || d.mode.includes(mode);
    const okSearch = !search || (d.name + d.spec + d.sub).toLowerCase().includes(search.toLowerCase());
    return okSpec && okMode && okSearch;
  }), [search, spec, mode]);

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">{list.length} specialists nearby</div>
          <h1 className="h-1">Find your <span className="hero-italic" style={{color:'var(--accent)'}}>doctor</span>.</h1>
        </div>
        <div className="row gap-3">
          <div className="search" style={{minWidth: 320}}>
            <I.search size={16} style={{color:'var(--ink-3)'}}/>
            <input placeholder="Search doctors, specialties…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <span className="kbd">⌘K</span>
          </div>
        </div>
      </div>

      <div className="glass" style={{padding:14}}>
        <div className="row between wrap gap-3">
          <div className="row gap-2 wrap">
            <button className={`pill ${spec==='all'?'solid':''}`} onClick={()=>setSpec('all')} style={{cursor:'pointer'}}>All</button>
            {SPECIALTIES.map(s => (
              <button key={s.id} className={`pill ${spec===s.id?'solid':''}`} onClick={()=>setSpec(s.id)} style={{cursor:'pointer'}}>{s.name}</button>
            ))}
          </div>
          <div className="tabs">
            <button className={`tab ${mode==='all'?'active':''}`} onClick={()=>setMode('all')}>Any</button>
            <button className={`tab ${mode==='Video'?'active':''}`} onClick={()=>setMode('Video')}>Video</button>
            <button className={`tab ${mode==='In-person'?'active':''}`} onClick={()=>setMode('In-person')}>In-person</button>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:16}}>
        {list.map(d => (
          <button key={d.id} className="glass doc-card" style={{textAlign:'left'}} onClick={() => go('book', { docId: d.id })}>
            <div className="row gap-4" style={{alignItems:'flex-start'}}>
              <Headshot name={d.name} hue={d.hue} size={68}/>
              <div className="grow col" style={{gap:6}}>
                <div className="row between">
                  <div className="h-3">{d.name}</div>
                  <div className="row gap-1" style={{fontSize:13, fontWeight:600}}>
                    <I.star size={13} style={{color:'var(--accent)'}}/>{d.rating}
                    <span className="tiny" style={{marginLeft:4}}>({d.reviews})</span>
                  </div>
                </div>
                <div className="small">{d.spec} · {d.sub}</div>
                <div className="row gap-2 wrap">
                  {d.badges.includes('Top rated') && <Pill variant="accent" icon={<I.star size={11}/>}>Top rated</Pill>}
                  {d.badges.includes('Premium') && <Pill icon={<I.sparkle size={11}/>}>Premium</Pill>}
                  {d.badges.includes('Same-day') && <Pill variant="good">Same-day</Pill>}
                  {d.mode.map(m => <Pill key={m} icon={m==='Video'?<I.video size={11}/>:m==='Voice'?<I.phone size={11}/>:<I.loc size={11}/>}>{m}</Pill>)}
                </div>
              </div>
            </div>
            <hr className="hr" style={{margin: '16px 0 12px'}}/>
            <div className="row between">
              <div className="col" style={{gap:2}}>
                <div className="tiny">Next available</div>
                <div className="row gap-1" style={{fontWeight:600, fontSize:14}}>
                  <I.clock size={13} style={{color:'var(--accent)'}}/>{d.next}
                </div>
              </div>
              <div className="row gap-3" style={{alignItems:'baseline'}}>
                <div className="tnum tiny">From <b style={{fontSize:15, color:'var(--ink)'}}>${d.fee}</b></div>
                <Btn size="sm" iconRight={<I.arrowR size={13}/>}>Book</Btn>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOK — doctor profile + slot picker
// ═══════════════════════════════════════════════════════════════════════════
function Book({ go, doctorId }) {
  const d = DOCTORS.find(x => x.id === doctorId) || DOCTORS[0];
  const today = new Date();
  const days = uM(() => Array.from({length:7}).map((_,i) => {
    const dt = new Date(today); dt.setDate(today.getDate() + i);
    return { idx:i, d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()], n: dt.getDate(), label: i===0?'Today':i===1?'Tomorrow':dt.toLocaleDateString(undefined,{weekday:'short', day:'numeric', month:'short'}) };
  }), []);
  const [dayIdx, setDay] = uS(0);
  const [slot, setSlot] = uS(null);
  const [mode, setMode] = uS(d.mode[0]);
  const [reason, setReason] = uS('');

  return (
    <div className="fade-enter col gap-6">
      <div className="row gap-3">
        <Btn variant="ghost" size="sm" icon={<I.arrowL size={14}/>} onClick={() => go('doctors')}>Back to doctors</Btn>
      </div>

      <div className="book-grid" style={{display:'grid', gridTemplateColumns: '1.1fr .9fr', gap: 24, alignItems:'start'}}>
        {/* LEFT: doctor profile */}
        <div className="col gap-4">
          <div className="glass-strong" style={{padding:28}}>
            <div className="row gap-5">
              <Headshot name={d.name} hue={d.hue} size={120}/>
              <div className="grow col" style={{gap:8}}>
                <div className="row gap-2 wrap">
                  {d.badges.includes('Top rated') && <Pill variant="accent" icon={<I.star size={11}/>}>Top rated</Pill>}
                  {d.badges.includes('Premium') && <Pill icon={<I.sparkle size={11}/>}>Premium</Pill>}
                  <Pill variant="good">Online now</Pill>
                </div>
                <h1 className="h-1" style={{fontSize:40, lineHeight:1.05}}>{d.name}</h1>
                <div className="row gap-3 wrap">
                  <div className="small"><b style={{color:'var(--ink)'}}>{d.spec}</b> · {d.sub}</div>
                </div>
                <div className="row gap-5 wrap" style={{marginTop:6}}>
                  <div className="col" style={{gap:2}}>
                    <div className="tiny">Rating</div>
                    <div className="row gap-2"><Stars value={d.rating}/><span className="tnum" style={{fontWeight:600}}>{d.rating}</span><span className="tiny">({d.reviews})</span></div>
                  </div>
                  <div className="vr"/>
                  <div className="col" style={{gap:2}}>
                    <div className="tiny">Experience</div>
                    <div className="row gap-1"><b className="tnum">{d.exp}</b> years</div>
                  </div>
                  <div className="vr"/>
                  <div className="col" style={{gap:2}}>
                    <div className="tiny">Consultation</div>
                    <div className="row gap-1"><b className="tnum">${d.fee}</b><span className="tiny">/ visit</span></div>
                  </div>
                </div>
              </div>
            </div>
            <hr className="hr" style={{margin:'20px 0'}}/>
            <div className="body" style={{fontSize:14}}>
              Board-certified {d.spec.toLowerCase()} specialist focused on {d.sub.toLowerCase()}.
              Combines evidence-based protocols with a patient-first style — most consults run 30 minutes.
            </div>
            <div className="row gap-2 wrap" style={{marginTop:14}}>
              {['Empathetic','Thorough','Punctual','Great listener'].map(t => (
                <span key={t} className="tag"><I.check size={11}/>{t}</span>
              ))}
            </div>
          </div>

          <div className="glass" style={{padding:22}}>
            <div className="eyebrow" style={{marginBottom:14}}>Reviews · {d.reviews}</div>
            <div className="col gap-4">
              {[
                { n:'Maya R.',   r:5, t:'Felt heard for the first time in years. Worth every penny.' },
                { n:'David K.',  r:5, t:'Clear, calm, and answered every question I had.' },
                { n:'Priya S.',  r:4, t:'Great follow-up notes after the call. Easy to book.' },
              ].map((rv,i) => (
                <div key={i} className="row gap-3" style={{alignItems:'flex-start'}}>
                  <Headshot name={rv.n} hue={(i*70+30)%360} size={36}/>
                  <div className="col grow" style={{gap:4}}>
                    <div className="row between"><b style={{fontSize:14}}>{rv.n}</b><Stars value={rv.r} size={11}/></div>
                    <div className="small" style={{fontSize:13}}>{rv.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: slot picker */}
        <div className="glass-strong book-right-sticky" style={{padding:24, position:'sticky', top:24}}>
          <div className="eyebrow" style={{marginBottom:8}}>Pick a time</div>
          <h3 className="h-3" style={{marginBottom:18}}>Available appointments</h3>

          <div className="tabs" style={{marginBottom:16}}>
            {d.mode.map(m => (
              <button key={m} className={`tab ${mode===m?'active':''}`} onClick={()=>setMode(m)}>
                {m==='Video' ? <span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.video size={12}/>Video</span>
                : m==='Voice' ? <span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.phone size={12}/>Voice</span>
                : <span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.loc size={12}/>In-person</span>}
              </button>
            ))}
          </div>

          <div className="row no-scrollbar" style={{gap:8, overflowX:'auto', paddingBottom:6, marginBottom:16}}>
            {days.map(dy => (
              <button key={dy.idx} className={`day ${dayIdx===dy.idx?'selected':''}`} onClick={()=>{setDay(dy.idx); setSlot(null);}}>
                <span className="d">{dy.idx===0?'Today':dy.idx===1?'Tmrw':dy.d}</span>
                <span className="n">{dy.n}</span>
              </button>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:16}}>
            {SLOTS.map(s => {
              const disabled = SLOT_DISABLED.has(s) && dayIdx === 0;
              return (
                <button key={s} className={`slot ${slot===s?'selected':''}`} disabled={disabled} onClick={()=>setSlot(s)}>
                  {s}
                </button>
              );
            })}
          </div>

          <div className="col gap-3" style={{marginBottom:14}}>
            <label className="tiny">Reason for visit <span style={{color:'var(--ink-3)'}}>(optional)</span></label>
            <textarea className="input" rows={2} placeholder="e.g. Chest tightness when exercising"
              value={reason} onChange={e=>setReason(e.target.value)} style={{resize:'vertical'}}/>
          </div>

          <hr className="hr" style={{margin:'8px 0 14px'}}/>

          <div className="row between" style={{marginBottom:10}}>
            <span className="small">Consultation fee</span>
            <span className="tnum" style={{fontWeight:600}}>${d.fee}.00</span>
          </div>
          <div className="row between" style={{marginBottom:18}}>
            <span className="small">Service fee</span>
            <span className="tnum" style={{fontWeight:600}}>$2.00</span>
          </div>
          <div className="row between" style={{marginBottom:18}}>
            <span style={{fontWeight:600}}>Total</span>
            <span className="tnum h-3">${d.fee + 2}.00</span>
          </div>

          <Btn style={{width:'100%'}} size="lg" disabled={!slot}
            iconRight={<I.arrowR size={16}/>}
            onClick={() => go('confirm', { docId: d.id, day: dayIdx, slot, mode })}>
            {slot ? `Confirm ${slot} ${days[dayIdx].label.toLowerCase()}` : 'Select a time'}
          </Btn>
          <div className="tiny" style={{textAlign:'center', marginTop:10}}>Free cancellation up to 4 hours before.</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM — receipt
// ═══════════════════════════════════════════════════════════════════════════
function Confirm({ go, doctorId, day, slot, mode }) {
  const d = DOCTORS.find(x => x.id === doctorId) || DOCTORS[0];
  const dayLabel = day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : `In ${day} days`;
  return (
    <div className="fade-enter" style={{display:'grid', placeItems:'center', minHeight:'70vh'}}>
      <div className="glass-strong" style={{padding: 40, maxWidth: 560, width:'100%', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div className="atmos" style={{position:'absolute', inset:0, opacity:.6}}/>
        <div style={{position:'relative'}}>
          <div className="avatar xl" style={{margin:'0 auto 20px', background:`color-mix(in oklab, var(--good) 18%, transparent)`, color:'var(--good)'}}>
            <I.checkCircle size={48} stroke={2}/>
          </div>
          <div className="eyebrow" style={{marginBottom:6}}>Booking confirmed</div>
          <h1 className="h-1" style={{marginBottom:8}}>You're all set.</h1>
          <p className="body" style={{marginBottom:24}}>We've sent a calendar invite to your email. Pre-visit notes will arrive 30 minutes before.</p>

          <div className="glass" style={{padding:20, textAlign:'left', marginBottom:18}}>
            <div className="row gap-3">
              <Headshot name={d.name} hue={d.hue} size={56}/>
              <div className="grow col" style={{gap:2}}>
                <div className="h-4">{d.name}</div>
                <div className="small">{d.spec} · {mode || d.mode[0]}</div>
              </div>
              <Pill variant="good" icon={<I.check size={11}/>}>Confirmed</Pill>
            </div>
            <hr className="hr" style={{margin:'14px 0'}}/>
            <div className="row between">
              <div className="col" style={{gap:2}}>
                <div className="tiny">When</div>
                <div style={{fontWeight:600}}>{dayLabel} · {slot || '14:30'}</div>
              </div>
              <div className="col" style={{gap:2}}>
                <div className="tiny">Confirmation</div>
                <div className="mono" style={{fontSize:13}}>MFL-{(Math.random().toString(36).slice(2,7)).toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div className="row gap-3" style={{justifyContent:'center'}}>
            <Btn variant="ghost" icon={<I.cal size={14}/>}>Add to calendar</Btn>
            <Btn icon={<I.home size={14}/>} onClick={() => go('dashboard')}>Go to dashboard</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Landing = Landing;
window.Discover = Discover;
window.Doctors = Doctors;
window.Book = Book;
window.Confirm = Confirm;
