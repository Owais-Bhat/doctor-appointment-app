// screens2.jsx — Dashboard + Admin views

const { useState: u2S, useEffect: u2E, useMemo: u2M } = React;

// ═══════════════════════════════════════════════════════════════════════════
// PATIENT DASHBOARD — bento overview
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({ go, practice }) {
  const upcoming = DOCTORS[0];
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">Welcome back, Alex</div>
          <h1 className="h-1">Your <span className="hero-italic" style={{color:'var(--accent)'}}>health</span>, at a glance.</h1>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" icon={<I.bell size={14}/>}>2 reminders</Btn>
          <Btn icon={<I.plus size={14}/>} onClick={() => go('discover')}>Book new</Btn>
        </div>
      </div>

      <div className="bento" style={{gridTemplateColumns:'repeat(6, 1fr)', gridAutoRows:'min-content'}}>
        {/* Next appointment — hero */}
        <div className="glass-strong cell span-3 row-2" style={{padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight: 360, position:'relative', overflow:'hidden'}}>
          <div className="row between">
            <div className="eyebrow">Next appointment</div>
            <Pill variant="good" icon={<span className="dot" style={{background:'var(--good)'}}/>}>Confirmed · in 2h</Pill>
          </div>
          <div className="col" style={{gap:20, alignItems:'center', textAlign:'center', padding: '20px 0'}}>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute', inset:-12, borderRadius:'50%', background:'var(--accent)', opacity:.18, filter:'blur(28px)'}}/>
              <div className="glass-strong" style={{
                width:120, height:120, borderRadius:'50%',
                display:'grid', placeItems:'center',
                fontWeight:700, fontSize:32, letterSpacing:'-.02em',
                color:'var(--accent)', position:'relative'
              }}>14:30</div>
            </div>
            <div className="col" style={{gap:6}}>
              <div className="h-2">{upcoming.name}</div>
              <div className="small">{upcoming.spec} · Voice consultation</div>
            </div>
            <div className="row gap-2 wrap" style={{justifyContent:'center'}}>
              <Pill icon={<I.clock size={11}/>}>In 2 hours</Pill>
              <Pill variant="accent" icon={<I.chat size={11}/>}>Pre-call note</Pill>
              <Pill icon={<I.doc size={11}/>}>Intake form</Pill>
            </div>
          </div>
          <div className="row gap-3">
            <Btn variant="ghost" icon={<I.cal size={14}/>} style={{flex:1}}>Reschedule</Btn>
            <Btn icon={<I.phone size={14}/>} style={{flex:2}} onClick={() => go('voicecall')}>Join voice call</Btn>
          </div>
        </div>

        {/* Vitals */}
        <div className="glass cell span-2" style={{padding:'var(--pad-card)'}}>
          <div className="row between" style={{marginBottom:10}}>
            <div className="eyebrow">Heart rate</div>
            <span style={{color:'#ef4444'}}><I.heart size={16}/></span>
          </div>
          <div className="row between" style={{alignItems:'baseline', marginBottom:6}}>
            <div><span className="h-2 tnum">72</span><span className="small" style={{marginLeft:4}}>bpm</span></div>
            <span className="delta up tnum" style={{color:'var(--good)', fontWeight:600, fontSize:12}}><I.trendUp size={13}/>Normal</span>
          </div>
          <Spark data={[64,68,70,69,72,71,73,72,74,72,71,73]} color="#ef4444" height={48}/>
        </div>

        {/* Sleep */}
        <div className="glass cell" style={{padding:'var(--pad-card)'}}>
          <div className="row between" style={{marginBottom:10}}>
            <div className="eyebrow">Sleep</div>
            <span style={{color:'var(--accent-2)'}}><I.moon size={16}/></span>
          </div>
          <div><span className="h-2 tnum">7.4</span><span className="small" style={{marginLeft:4}}>hrs</span></div>
          <Spark data={[6,7.2,6.8,7.4,7.1,7.6,7.4]} color="var(--accent-2)" height={48}/>
        </div>

        {/* AI insight */}
        <div className="cell span-3" style={{
          padding:'var(--pad-card)',
          background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, transparent), color-mix(in oklab, var(--accent-2) 10%, transparent))',
          border: '1px solid color-mix(in oklab, var(--accent) 18%, transparent)',
          borderRadius:'var(--radius-card)',
          position:'relative', overflow:'hidden'
        }}>
          <div className="row gap-3" style={{marginBottom:12}}>
            <div className="avatar md" style={{background:'linear-gradient(135deg, var(--accent), var(--accent-2))'}}><I.sparkle size={20}/></div>
            <div>
              <div className="eyebrow" style={{color:'var(--accent)'}}>AI health insight</div>
              <div className="h-4">Resting heart rate is trending down — keep it up.</div>
            </div>
          </div>
          <div className="small" style={{marginBottom:14}}>
            Down 4 bpm over the last 30 days. This often correlates with consistent cardio. Dr. Jenkins flagged it as a positive sign in your last review.
          </div>
          <div className="row gap-2">
            <Btn variant="glass" size="sm" iconRight={<I.arrowR size={13}/>}>See full insight</Btn>
            <Btn variant="ghost" size="sm">Hide</Btn>
          </div>
        </div>

        {/* Prescriptions */}
        <div className="glass cell span-3" style={{padding:'var(--pad-card)'}}>
          <div className="row between" style={{marginBottom:16}}>
            <div className="eyebrow">Active prescriptions</div>
            <Btn variant="ghost" size="sm">Manage</Btn>
          </div>
          <div className="col gap-3">
            {[
              { n:'Atorvastatin 10mg', s:'1 tablet · daily', refills:2, c:'#ef4444' },
              { n:'Metformin 500mg',   s:'2 tablets · twice daily', refills:4, c:'#3b82f6' },
              { n:'Vitamin D3',        s:'1 capsule · daily', refills:0, c:'#eab308' },
            ].map(p => (
              <div key={p.n} className="row between" style={{padding:'10px 0', borderBottom:'1px solid var(--line)'}}>
                <div className="row gap-3">
                  <div style={{width:36, height:36, borderRadius:10, background:`color-mix(in oklab, ${p.c} 16%, transparent)`, color:p.c, display:'grid', placeItems:'center'}}><I.pill size={16}/></div>
                  <div>
                    <div style={{fontWeight:600, fontSize:14}}>{p.n}</div>
                    <div className="tiny">{p.s}</div>
                  </div>
                </div>
                <Pill variant={p.refills>0?'accent':'warn'}>{p.refills>0 ? `${p.refills} refills` : 'Reorder'}</Pill>
              </div>
            ))}
          </div>
        </div>

        {/* Past visits / timeline */}
        <div className="glass cell span-3" style={{padding:'var(--pad-card)'}}>
          <div className="row between" style={{marginBottom:16}}>
            <div className="eyebrow">Health timeline</div>
            <Btn variant="ghost" size="sm">Full history</Btn>
          </div>
          <div className="timeline">
            {[
              { t:'Cardiology consult',     d:'Dr. Jenkins · 3 days ago',  i:<I.heart size={14}/>, c:'#ef4444' },
              { t:'Blood panel',            d:'LabCorp · 2 weeks ago',     i:<I.activity size={14}/>, c:'var(--accent)' },
              { t:'Annual check-up',        d:'Dr. Okafor · 1 month ago',  i:<I.checkCircle size={14}/>, c:'var(--good)' },
              { t:'Prescription updated',   d:'Atorvastatin · 2 months',   i:<I.pill size={14}/>, c:'#eab308' },
            ].map((e,i) => (
              <div key={i} className="tl-item">
                <div className="tl-dot" style={{color:e.c, background:`color-mix(in oklab, ${e.c} 12%, transparent)`, borderColor:`color-mix(in oklab, ${e.c} 28%, transparent)`}}>{e.i}</div>
                <div>
                  <div style={{fontWeight:600, fontSize:14}}>{e.t}</div>
                  <div className="tiny">{e.d}</div>
                </div>
                <Btn variant="ghost" size="sm">View</Btn>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended doctors */}
        {!practice && <div className="cell span-6" style={{padding:0, marginTop:8}}>
          <div className="row between" style={{marginBottom: 14}}>
            <div className="col" style={{gap:4}}>
              <div className="eyebrow">Recommended for you</div>
              <div className="h-3">Doctors near you with same-day availability</div>
            </div>
            <Btn variant="ghost" size="sm" iconRight={<I.arrowR size={13}/>} onClick={() => go('doctors')}>See all</Btn>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
            {DOCTORS.slice(1,4).map(d => (
              <button key={d.id} className="glass doc-card" style={{textAlign:'left'}} onClick={() => go('book', { docId: d.id })}>
                <div className="row gap-3">
                  <Headshot name={d.name} hue={d.hue} size={52}/>
                  <div className="grow">
                    <div className="row between"><div className="h-4">{d.name}</div></div>
                    <div className="small">{d.spec}</div>
                  </div>
                </div>
                <div className="row between" style={{marginTop:12}}>
                  <div className="row gap-1 tiny"><I.clock size={12} style={{color:'var(--accent)'}}/>{d.next}</div>
                  <div className="row gap-1 tiny"><I.star size={11} style={{color:'var(--accent)'}}/><b style={{color:'var(--ink)'}}>{d.rating}</b></div>
                </div>
              </button>
            ))}
          </div>
        </div>}

        {/* Practice-mode equivalent: rebook with your doctor */}
        {practice && <div className="cell span-6" style={{padding:0, marginTop:8}}>
          <div className="glass-strong" style={{padding: 'var(--pad-card)'}}>
            <div className="row between wrap gap-4">
              <div className="row gap-4">
                <Headshot name={DOCTORS[0].name} hue={DOCTORS[0].hue} size={64}/>
                <div className="col" style={{gap:4}}>
                  <div className="eyebrow">Your doctor</div>
                  <div className="h-3">{DOCTORS[0].name}</div>
                  <div className="small">{DOCTORS[0].spec} · 6 visits together · last seen 3 days ago</div>
                </div>
              </div>
              <div className="row gap-2">
                <Btn variant="ghost" icon={<I.chat size={14}/>}>Message</Btn>
                <Btn icon={<I.cal size={14}/>} onClick={() => go('book', { docId: DOCTORS[0].id })}>Book follow-up</Btn>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — doctor's-side dashboard
// ═══════════════════════════════════════════════════════════════════════════
function Admin({ go }) {
  const [day, setDay] = u2S(0);
  const kpis = [
    { l:'Today\'s appointments', v:'18',   d:'+3 vs avg', up:true },
    { l:'Patient satisfaction',  v:'4.9',  d:'NPS 72',    up:true },
    { l:'Avg. wait time',        v:'8m',   d:'-2m',       up:true },
    { l:'Revenue MTD',           v:'$24.8k', d:'+12%',    up:true },
  ];
  const todaySched = [
    { t:'09:00', p:'Maya Rivera',    r:'Follow-up · Echo',          dur:30, mode:'In-person', stat:'done' },
    { t:'09:30', p:'David Klein',    r:'New patient · Chest pain',  dur:45, mode:'In-person', stat:'done' },
    { t:'10:15', p:'Priya Shah',     r:'Lab review',                dur:30, mode:'Voice',     stat:'now'  },
    { t:'11:00', p:'James Okonkwo',  r:'Pre-op consult',            dur:30, mode:'Video',     stat:'next' },
    { t:'13:30', p:'Sara Anders',    r:'Follow-up · 6mo',           dur:30, mode:'In-person', stat:'upcoming' },
    { t:'14:30', p:'Alex Rivera',    r:'New patient · Palpitations',dur:45, mode:'Voice',     stat:'upcoming' },
    { t:'15:30', p:'Maria Conte',    r:'Refill · Atorvastatin',     dur:15, mode:'Voice',     stat:'upcoming' },
  ];

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">Doctor's view</div>
          <h1 className="h-1">Good morning, <span className="hero-italic" style={{color:'var(--accent)'}}>Dr. Jenkins</span>.</h1>
          <p className="body">7 appointments left today. Your next patient joins in 12 minutes.</p>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" icon={<I.filter size={14}/>}>Filter</Btn>
          <Btn icon={<I.plus size={14}/>}>Add slot</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {kpis.map((k,i) => (
          <div key={k.l} className="glass cell stat">
            <div className="eyebrow" style={{marginBottom:10}}>{k.l}</div>
            <div className="row between" style={{alignItems:'baseline'}}>
              <div className="val tnum">{k.v}</div>
              <span className={`delta ${k.up?'up':'dn'}`}><I.trendUp size={13}/>{k.d}</span>
            </div>
            <Spark data={[3,4,3,5,4,6,5,7,6,8].map(x => x + i)} color="var(--accent)" height={32}/>
          </div>
        ))}
      </div>

      <div className="admin-grid" style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, alignItems:'start'}}>
        {/* Schedule */}
        <div className="glass" style={{padding:24}}>
          <div className="row between" style={{marginBottom:18}}>
            <div className="col" style={{gap:4}}>
              <div className="eyebrow">Schedule</div>
              <div className="h-3">Tuesday, May 19</div>
            </div>
            <div className="tabs">
              <button className={`tab ${day===0?'active':''}`} onClick={()=>setDay(0)}>Today</button>
              <button className={`tab ${day===1?'active':''}`} onClick={()=>setDay(1)}>Tomorrow</button>
              <button className={`tab ${day===2?'active':''}`} onClick={()=>setDay(2)}>Week</button>
            </div>
          </div>
          <div className="col gap-2">
            {todaySched.map((a,i) => (
              <div key={i} className="row gap-4" style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: a.stat==='now' ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent',
                border: a.stat==='now' ? '1px solid color-mix(in oklab, var(--accent) 24%, transparent)' : '1px solid var(--line)',
                alignItems:'center'
              }}>
                <div className="col" style={{gap:2, minWidth:60}}>
                  <div className="tnum" style={{fontWeight:700, fontSize:15}}>{a.t}</div>
                  <div className="tiny">{a.dur}m</div>
                </div>
                <div className="vr"/>
                <Headshot name={a.p} hue={(i*55+30)%360} size={36}/>
                <div className="grow col" style={{gap:2}}>
                  <div style={{fontWeight:600, fontSize:14}}>{a.p}</div>
                  <div className="tiny">{a.r}</div>
                </div>
                <Pill icon={a.mode==='Video'?<I.video size={11}/>:a.mode==='Voice'?<I.phone size={11}/>:<I.loc size={11}/>}>{a.mode}</Pill>
                {a.stat==='done' && <Pill variant="good" icon={<I.check size={11}/>}>Done</Pill>}
                {a.stat==='now'  && <Btn size="sm" icon={a.mode==='Voice'?<I.phone size={13}/>:<I.video size={13}/>} onClick={() => go(a.mode==='Voice'?'voicecall':'voicecall')}>Join</Btn>}
                {a.stat==='next' && <Pill variant="warn">Next</Pill>}
                {a.stat==='upcoming' && <I.chevR size={16} style={{color:'var(--ink-3)'}}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Right column: mini cal + patient queue */}
        <div className="col gap-4">
          <div className="glass" style={{padding:22}}>
            <div className="row between" style={{marginBottom:14}}>
              <div className="h-4">May 2026</div>
              <div className="row gap-1">
                <span className="icon-btn"><I.arrowL size={14}/></span>
                <span className="icon-btn"><I.arrowR size={14}/></span>
              </div>
            </div>
            <div className="cal">
              {['S','M','T','W','T','F','S'].map((c,i)=>(<div key={i} className="head">{c}</div>))}
              {Array.from({length: 35}).map((_,i) => {
                const day = i - 2; // offset
                const has = [5,9,14,19,23,27].includes(day);
                const today = day === 19;
                if (day < 1 || day > 31) return <div key={i} className="cell" style={{opacity:.2}}>{day < 1 ? 31 + day : day - 31}</div>;
                return <div key={i} className={`cell ${has?'has-event':''} ${today?'today':''}`}>{day}</div>;
              })}
            </div>
          </div>

          <div className="glass" style={{padding:22}}>
            <div className="eyebrow" style={{marginBottom:14}}>Patient messages</div>
            <div className="col gap-3">
              {[
                { n:'Maya R.',   m:'Quick question about the new dose',  t:'2m',  unread:true },
                { n:'David K.',  m:'Lab results are uploaded',            t:'14m', unread:true },
                { n:'Priya S.',  m:'Confirming tomorrow at 1pm',          t:'1h',  unread:false },
              ].map((m,i) => (
                <div key={i} className="row gap-3">
                  <Headshot name={m.n} hue={(i*70+20)%360} size={36}/>
                  <div className="grow col" style={{gap:2}}>
                    <div className="row between"><b style={{fontSize:14}}>{m.n}</b><span className="tiny">{m.t}</span></div>
                    <div className="small" style={{fontSize:13, opacity: m.unread ? 1 : .6}}>{m.m}</div>
                  </div>
                  {m.unread && <span className="dot" style={{background:'var(--accent)', width:8, height:8}}/>}
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{padding:22}}>
            <div className="eyebrow" style={{marginBottom:10}}>AI suggestions</div>
            <div className="row gap-3">
              <div style={{color:'var(--accent)'}}><I.sparkle size={20}/></div>
              <div>
                <div style={{fontWeight:600, fontSize:14}}>Two follow-ups pending</div>
                <div className="small" style={{fontSize:13}}>Maya R. and Sara A. haven't booked their 3-month checks. Want me to draft outreach?</div>
                <div className="row gap-2" style={{marginTop:10}}>
                  <Btn size="sm">Draft</Btn>
                  <Btn size="sm" variant="ghost">Later</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.Admin = Admin;
