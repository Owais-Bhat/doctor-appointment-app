// doctor-screens.jsx — Expanded doctor (clinic) workspace screens.
// Today's schedule lives in screens2.jsx as `Admin` — reused here.

const { useState: dr_uS, useMemo: dr_uM } = React;

// ─── Data ───────────────────────────────────────────────────────────────────
const DR_PATIENTS = [
  { n:'Maya Rivera',     age:34, sex:'F', last:'3d ago',  next:'May 26', visits:7, tag:'Echo follow-up', hue:30,  bp:'118/76', risk:'low' },
  { n:'David Klein',     age:58, sex:'M', last:'Today',   next:'Jun 02', visits:12, tag:'Hypertension', hue:210, bp:'142/92', risk:'med' },
  { n:'Priya Shah',      age:42, sex:'F', last:'1w ago',  next:'May 21', visits:3,  tag:'Labs pending', hue:320, bp:'124/80', risk:'low' },
  { n:'James Okonkwo',   age:67, sex:'M', last:'Today',   next:'Today',  visits:18, tag:'Pre-op',       hue:160, bp:'130/85', risk:'high' },
  { n:'Sara Anders',     age:51, sex:'F', last:'2w ago',  next:'May 19', visits:5,  tag:'6mo check',    hue:50,  bp:'120/78', risk:'low' },
  { n:'Alex Rivera',     age:38, sex:'M', last:'New',     next:'Today',  visits:0,  tag:'New patient',  hue:210, bp:'—',     risk:'low' },
  { n:'Maria Conte',     age:74, sex:'F', last:'5d ago',  next:'Jun 12', visits:24, tag:'Refill',       hue:0,   bp:'138/82', risk:'med' },
  { n:'Henrik Lund',     age:45, sex:'M', last:'1mo ago', next:'—',      visits:2,  tag:'Inactive',     hue:240, bp:'126/80', risk:'low' },
  { n:'Aisha Patel',     age:29, sex:'F', last:'2d ago',  next:'May 24', visits:4,  tag:'Palpitations', hue:120, bp:'112/72', risk:'low' },
  { n:'Carlos Vega',     age:62, sex:'M', last:'1w ago',  next:'Jun 05', visits:9,  tag:'Post-MI',      hue:30,  bp:'132/88', risk:'high'},
];
const RISK_VARIANT = { low:'good', med:'warn', high:'bad' };

// Hour bands for week-calendar
const WEEK_HOURS = Array.from({length:11}, (_,i) => 8 + i); // 8 AM – 6 PM
const WEEK_DAYS = ['Mon 19','Tue 20','Wed 21','Thu 22','Fri 23','Sat 24'];
const WEEK_EVENTS = [
  // [dayIdx, startHr, duration, label, mode]
  [0,  9.0, 0.5, 'Maya Rivera',      'In-person'],
  [0, 10.25,0.5, 'Priya Shah',       'Voice'],
  [0, 11.0, 0.5, 'James Okonkwo',    'Video'],
  [0, 13.5, 0.5, 'Sara Anders',      'In-person'],
  [0, 14.5, 0.75,'Alex Rivera',      'Voice'],
  [0, 15.5, 0.25,'Maria Conte',      'Voice'],
  [1,  9.5, 0.5, 'David Klein',      'In-person'],
  [1, 10.5, 0.5, 'Henrik Lund',      'Video'],
  [1, 13.0, 1.0, 'Group session',    'Video'],
  [1, 15.0, 0.5, 'Aisha Patel',      'Voice'],
  [2, 11.0, 0.5, 'Carlos Vega',      'In-person'],
  [2, 14.0, 0.5, 'Maya Rivera (f/u)','Voice'],
  [3,  9.0, 0.5, 'New patient',      'In-person'],
  [3, 13.5, 0.5, 'David Klein (f/u)','Voice'],
  [4, 10.0, 0.5, 'Priya Shah',       'Voice'],
  [4, 14.0, 0.5, 'Sara Anders',      'Voice'],
  [4, 15.0, 0.5, 'James Okonkwo',    'Video'],
];
const MODE_COLOR = { 'In-person':'var(--accent-2)', 'Video':'var(--accent)', 'Voice':'#10b981' };
const MODE_ICON = { 'In-person':'loc', 'Video':'video', 'Voice':'phone' };

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR — week view
// ═══════════════════════════════════════════════════════════════════════════
function DoctorCalendar() {
  const ROW_H = 56;

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">May 19–24 · 2026</div>
          <h1 className="h-1">Week view</h1>
        </div>
        <div className="row gap-3">
          <div className="tabs">
            <button className="tab">Day</button>
            <button className="tab active">Week</button>
            <button className="tab">Month</button>
          </div>
          <div className="row gap-1">
            <span className="icon-btn"><I.arrowL size={14}/></span>
            <Btn variant="ghost" size="sm">Today</Btn>
            <span className="icon-btn"><I.arrowR size={14}/></span>
          </div>
          <Btn icon={<I.plus size={14}/>}>Block time</Btn>
        </div>
      </div>

      <div className="glass" style={{padding:0, overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'60px repeat(6, 1fr)', borderBottom:'1px solid var(--line)'}}>
          <div/>
          {WEEK_DAYS.map((d,i) => (
            <div key={d} style={{padding:'14px 12px', borderLeft:'1px solid var(--line)', textAlign:'center'}}>
              <div className="tiny" style={{color: i===0?'var(--accent)':'var(--ink-3)', letterSpacing:'.08em'}}>{d.split(' ')[0].toUpperCase()}</div>
              <div className="tnum" style={{fontSize:22, fontWeight: i===0?700:600, color: i===0?'var(--accent)':'var(--ink)', letterSpacing:'-.02em'}}>{d.split(' ')[1]}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'60px repeat(6, 1fr)', position:'relative'}}>
          {/* Hour rail */}
          <div>
            {WEEK_HOURS.map(h => (
              <div key={h} style={{height:ROW_H, padding:'4px 8px', textAlign:'right', borderBottom:'1px solid var(--line)'}}>
                <span className="tiny mono" style={{color:'var(--ink-3)'}}>{(h>12?h-12:h).toString().padStart(2,'0')} {h<12?'AM':'PM'}</span>
              </div>
            ))}
          </div>
          {/* Day cols */}
          {WEEK_DAYS.map((_, dayIdx) => (
            <div key={dayIdx} style={{borderLeft:'1px solid var(--line)', position:'relative'}}>
              {WEEK_HOURS.map((h,i) => (
                <div key={h} style={{height:ROW_H, borderBottom:'1px solid var(--line)'}}/>
              ))}
              {WEEK_EVENTS.filter(([d]) => d === dayIdx).map(([d, startHr, dur, label, mode], i) => {
                const top = (startHr - 8) * ROW_H;
                const height = dur * ROW_H - 4;
                const Icn = I[MODE_ICON[mode]] || I.cal;
                return (
                  <div key={i} style={{
                    position:'absolute', left:6, right:6, top:top+2, height,
                    borderRadius:10, padding:'6px 8px',
                    background: `color-mix(in oklab, ${MODE_COLOR[mode]} 14%, transparent)`,
                    borderLeft: `3px solid ${MODE_COLOR[mode]}`,
                    cursor:'pointer', overflow:'hidden',
                    display:'flex', flexDirection:'column', gap:2
                  }}>
                    <div className="row gap-1" style={{alignItems:'center', fontSize:11.5, fontWeight:600, color: MODE_COLOR[mode]}}>
                      <Icn size={11}/>{Math.floor(startHr)}:{startHr%1?'30':'00'}
                    </div>
                    <div style={{fontSize:12, fontWeight:600, lineHeight:1.2}}>{label}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* Now line on today (day 0) */}
          <div style={{
            position:'absolute', top: (10.25 - 8) * ROW_H, left:60,
            right:0, height:0, pointerEvents:'none'
          }}>
            <div style={{position:'absolute', left:0, right:`${(5/6)*100}%`, height:2, background:'var(--bad)'}}/>
            <div style={{position:'absolute', left:-6, top:-5, width:12, height:12, borderRadius:'50%', background:'var(--bad)'}}/>
          </div>
        </div>
      </div>

      <div className="row gap-3 wrap" style={{justifyContent:'center'}}>
        {Object.entries(MODE_COLOR).map(([m,c]) => (
          <div key={m} className="row gap-2" style={{fontSize:13}}>
            <span style={{width:12, height:12, borderRadius:3, background:c, opacity:.4, borderLeft:`3px solid ${c}`}}/>
            <span className="tiny" style={{color:'var(--ink)', letterSpacing:0, textTransform:'none', fontSize:12.5, fontWeight:500}}>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PATIENTS — list
// ═══════════════════════════════════════════════════════════════════════════
function DoctorPatients() {
  const [q, setQ] = dr_uS('');
  const [filter, setFilter] = dr_uS('all');

  const filtered = dr_uM(() => DR_PATIENTS.filter(p => {
    if (q && !(p.n + p.tag).toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'high' && p.risk !== 'high') return false;
    if (filter === 'today' && p.next !== 'Today') return false;
    if (filter === 'new' && p.visits > 0) return false;
    return true;
  }), [q, filter]);

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">{DR_PATIENTS.length} active</div>
          <h1 className="h-1">Patients</h1>
        </div>
        <div className="row gap-3">
          <div className="search" style={{minWidth:280}}>
            <I.search size={16} style={{color:'var(--ink-3)'}}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or tag…"/>
          </div>
          <Btn icon={<I.plus size={14}/>}>Add patient</Btn>
        </div>
      </div>

      <div className="glass" style={{padding:14}}>
        <div className="row gap-2 wrap">
          <button className={`pill ${filter==='all'?'solid':''}`} onClick={()=>setFilter('all')} style={{cursor:'pointer'}}>All</button>
          <button className={`pill ${filter==='today'?'solid':''}`} onClick={()=>setFilter('today')} style={{cursor:'pointer'}}>Seeing today</button>
          <button className={`pill ${filter==='new'?'solid':''}`} onClick={()=>setFilter('new')} style={{cursor:'pointer'}}>New patients</button>
          <button className={`pill ${filter==='high'?'solid':''}`} onClick={()=>setFilter('high')} style={{cursor:'pointer'}}>High risk</button>
        </div>
      </div>

      <div className="glass" style={{padding:0, overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13.5}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              {['Patient','Age','BP','Tag','Visits','Last seen','Next visit','Risk',''].map(h => (
                <th key={h} style={{padding:'14px 14px'}}><span className="eyebrow">{h}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i) => (
              <tr key={p.n} style={{borderTop:'1px solid var(--line)'}}>
                <td style={{padding:'14px 14px'}}>
                  <div className="row gap-3">
                    <Headshot name={p.n} hue={p.hue} size={36}/>
                    <div className="col" style={{gap:2}}>
                      <div style={{fontWeight:600}}>{p.n}</div>
                      <div className="tiny">#{1000 + i} · {p.sex}</div>
                    </div>
                  </div>
                </td>
                <td className="tnum" style={{padding:'14px 14px'}}>{p.age}</td>
                <td className="tnum mono" style={{padding:'14px 14px', fontSize:12.5}}>{p.bp}</td>
                <td style={{padding:'14px 14px'}}><span className="tag">{p.tag}</span></td>
                <td className="tnum" style={{padding:'14px 14px'}}>{p.visits}</td>
                <td className="tiny" style={{padding:'14px 14px'}}>{p.last}</td>
                <td style={{padding:'14px 14px', fontWeight: p.next==='Today'?700:500, color: p.next==='Today'?'var(--accent)':'var(--ink)'}}>{p.next}</td>
                <td style={{padding:'14px 14px'}}>
                  <Pill variant={RISK_VARIANT[p.risk]}>{p.risk}</Pill>
                </td>
                <td style={{padding:'14px 14px'}}>
                  <span className="icon-btn"><I.chevR size={14}/></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGES — inbox
// ═══════════════════════════════════════════════════════════════════════════
function DoctorMessages() {
  const threads = [
    { n:'Maya Rivera',   hue:30,  last:'Quick question about the new dose — should I take it morning or night?', t:'2m',  unread:2 },
    { n:'David Klein',   hue:210, last:'Lab results are uploaded to my chart.', t:'14m', unread:1 },
    { n:'Priya Shah',    hue:320, last:'Confirming tomorrow at 1pm — does video still work?', t:'1h', unread:0 },
    { n:'James Okonkwo', hue:160, last:'Thank you for the call — much clearer now.', t:'3h', unread:0 },
    { n:'Sara Anders',   hue:50,  last:'Sent the updated insurance card.', t:'1d', unread:0 },
    { n:'Carlos Vega',   hue:30,  last:'I had some palpitations again last night.', t:'2d', unread:0 },
  ];
  const [active, setActive] = dr_uS(0);
  const t = threads[active];
  const convo = [
    { from:'patient', t:"Hi Dr. Jenkins — quick question about the new dose. Morning or night? The pharmacist wasn't sure.", time:'09:14' },
    { from:'doctor',  t:"Morning works best. Take it with food.", time:'09:42' },
    { from:'patient', t:"Got it, thanks. Any side effects I should watch for?", time:'10:05' },
    { from:'patient', t:"Also, should I take it morning or night?", time:'10:30' },
  ];

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">{threads.filter(t=>t.unread).length} unread</div>
          <h1 className="h-1">Messages</h1>
        </div>
        <Btn variant="ghost" icon={<I.send size={14}/>}>Compose</Btn>
      </div>

      <div className="glass" style={{padding:0, display:'grid', gridTemplateColumns:'340px 1fr', minHeight: 560, overflow:'hidden'}}>
        {/* List */}
        <div style={{borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line)'}}>
            <div className="search">
              <I.search size={14} style={{color:'var(--ink-3)'}}/>
              <input placeholder="Search messages…"/>
            </div>
          </div>
          <div style={{flex:1, overflowY:'auto'}}>
            {threads.map((th,i) => (
              <button key={th.n} onClick={() => setActive(i)} style={{
                display:'flex', width:'100%', textAlign:'left',
                padding:'14px 16px', gap:12, alignItems:'flex-start',
                background: active===i ? 'color-mix(in oklab, var(--accent) 8%, transparent)' : 'transparent',
                border:0, borderBottom:'1px solid var(--line)',
                cursor:'pointer'
              }}>
                <Headshot name={th.n} hue={th.hue} size={40}/>
                <div className="col grow" style={{gap:3, minWidth:0}}>
                  <div className="row between">
                    <b style={{fontSize:13.5}}>{th.n}</b>
                    <span className="tiny">{th.t}</span>
                  </div>
                  <div style={{fontSize:12.5, color: th.unread ? 'var(--ink)' : 'var(--ink-2)', fontWeight: th.unread?500:400, lineHeight:1.4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{th.last}</div>
                </div>
                {th.unread > 0 && (
                  <span style={{minWidth:18, height:18, borderRadius:9, background:'var(--accent)', color:'var(--accent-ink)', fontSize:10, fontWeight:700, display:'grid', placeItems:'center', padding:'0 6px'}}>{th.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div style={{display:'flex', flexDirection:'column', minHeight:0}}>
          <div className="row between" style={{padding:'14px 20px', borderBottom:'1px solid var(--line)'}}>
            <div className="row gap-3">
              <Headshot name={t.n} hue={t.hue} size={36}/>
              <div>
                <div style={{fontWeight:600}}>{t.n}</div>
                <div className="tiny">Patient since 2022 · 7 visits</div>
              </div>
            </div>
            <div className="row gap-2">
              <Btn variant="ghost" size="sm" icon={<I.phone size={13}/>}>Voice call</Btn>
              <Btn variant="ghost" size="sm" icon={<I.video size={13}/>}>Video call</Btn>
              <span className="icon-btn"><I.cog size={14}/></span>
            </div>
          </div>
          <div style={{flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto'}}>
            {convo.map((m,i) => (
              <div key={i} style={{
                display:'flex', flexDirection:'column',
                alignItems: m.from==='doctor' ? 'flex-end' : 'flex-start',
                gap:4
              }}>
                <div className="bubble" style={{
                  background: m.from==='doctor' ? 'var(--accent)' : 'var(--glass)',
                  color: m.from==='doctor' ? 'var(--accent-ink)' : 'var(--ink)',
                  borderBottomRightRadius: m.from==='doctor' ? 6 : 18,
                  borderBottomLeftRadius: m.from==='doctor' ? 18 : 6,
                  border: m.from==='patient' ? '1px solid var(--glass-edge)' : '0'
                }}>{m.t}</div>
                <span className="tiny mono tnum">{m.time}</span>
              </div>
            ))}
          </div>
          <div style={{padding:14, borderTop:'1px solid var(--line)'}}>
            <div className="search" style={{padding:'8px 8px 8px 16px'}}>
              <input placeholder={`Reply to ${t.n}…`}/>
              <span className="icon-btn"><I.sparkle size={14}/></span>
              <Btn variant="primary" size="sm" icon={<I.send size={13}/>}>Send</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RECORDS — file browser
// ═══════════════════════════════════════════════════════════════════════════
function DoctorRecords() {
  const files = [
    { t:'2026-05-19', n:'Maya Rivera — Echo report.pdf',  s:'2.4 MB', tag:'echo',    by:'You' },
    { t:'2026-05-18', n:'David Klein — Lipid panel.pdf',  s:'1.1 MB', tag:'labs',    by:'LabCorp' },
    { t:'2026-05-17', n:'James Okonkwo — Pre-op EKG.dcm', s:'4.8 MB', tag:'imaging', by:'Mt Sinai' },
    { t:'2026-05-15', n:'Priya Shah — Visit note.pdf',    s:'380 KB', tag:'note',    by:'You' },
    { t:'2026-05-14', n:'Sara Anders — Insurance card.png',s:'820 KB',tag:'admin',   by:'Sara A.' },
    { t:'2026-05-12', n:'Maya Rivera — Visit note.pdf',   s:'420 KB', tag:'note',    by:'You' },
  ];
  const TAG_COLOR = { echo:'#ef4444', labs:'#3b82f6', imaging:'#8b5cf6', note:'var(--accent)', admin:'#94a3b8' };
  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">412 records</div>
          <h1 className="h-1">Records</h1>
          <p className="body">Encrypted at rest. Access is logged.</p>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" icon={<I.filter size={14}/>}>Filter</Btn>
          <Btn icon={<I.plus size={14}/>}>Upload</Btn>
        </div>
      </div>

      <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {[
          { l:'Notes', v:'248', icon:<I.doc size={18}/>, c:'var(--accent)' },
          { l:'Lab results', v:'112', icon:<I.activity size={18}/>, c:'#3b82f6' },
          { l:'Imaging', v:'34', icon:<I.eye size={18}/>, c:'#8b5cf6' },
          { l:'Storage', v:'4.2 GB', icon:<I.cards size={18}/>, c:'#10b981' },
        ].map(k => (
          <div key={k.l} className="glass cell">
            <div className="row between">
              <div className="eyebrow">{k.l}</div>
              <span style={{color:k.c}}>{k.icon}</span>
            </div>
            <div className="h-2 tnum" style={{marginTop:10}}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="glass" style={{padding:0, overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13.5}}>
          <thead><tr style={{textAlign:'left'}}>{['File','Type','Added by','Size','Date',''].map(h => <th key={h} style={{padding:'14px 16px'}}><span className="eyebrow">{h}</span></th>)}</tr></thead>
          <tbody>
            {files.map((f,i) => (
              <tr key={i} style={{borderTop:'1px solid var(--line)'}}>
                <td style={{padding:'14px 16px'}}>
                  <div className="row gap-3">
                    <div style={{width:36, height:44, borderRadius:6, background:`color-mix(in oklab, ${TAG_COLOR[f.tag]} 14%, transparent)`, color:TAG_COLOR[f.tag], display:'grid', placeItems:'center'}}><I.doc size={16}/></div>
                    <div style={{fontWeight:500}}>{f.n}</div>
                  </div>
                </td>
                <td style={{padding:'14px 16px'}}><Pill style={{background:`color-mix(in oklab, ${TAG_COLOR[f.tag]} 14%, transparent)`, color:TAG_COLOR[f.tag], borderColor:'transparent'}}>{f.tag}</Pill></td>
                <td style={{padding:'14px 16px'}}>{f.by}</td>
                <td className="tnum tiny" style={{padding:'14px 16px'}}>{f.s}</td>
                <td className="tnum mono" style={{padding:'14px 16px', fontSize:12.5}}>{f.t}</td>
                <td style={{padding:'14px 16px'}}><span className="icon-btn"><I.chevR size={14}/></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EARNINGS — doctor revenue
// ═══════════════════════════════════════════════════════════════════════════
function DoctorEarnings() {
  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">May 2026 · so far</div>
          <h1 className="h-1">Earnings</h1>
        </div>
        <div className="tabs">
          <button className="tab">This week</button>
          <button className="tab active">This month</button>
          <button className="tab">YTD</button>
        </div>
      </div>

      <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {[
          { l:'Gross revenue',   v:'$18,420', d:'+8.2% MoM' },
          { l:'After platform',  v:'$15,656', d:'15% take' },
          { l:'Visits completed',v:'154',     d:'avg 7/day' },
          { l:'No-shows',        v:'4',       d:'2.6%' },
        ].map(k => (
          <div key={k.l} className="glass cell">
            <div className="eyebrow" style={{marginBottom:10}}>{k.l}</div>
            <div className="row between" style={{alignItems:'baseline'}}>
              <div className="h-2 tnum">{k.v}</div>
              <span className="tiny">{k.d}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{padding:24}}>
        <div className="row between" style={{marginBottom:18}}>
          <div className="col" style={{gap:4}}>
            <div className="eyebrow">Revenue by visit type</div>
            <div className="h-3">May breakdown</div>
          </div>
        </div>
        <div className="col gap-3">
          {[
            { l:'Voice consult',   v: 6420, c:'#10b981', pct:.35 },
            { l:'Video consult',   v: 5180, c:'var(--accent)', pct:.28 },
            { l:'In-person',       v: 4920, c:'var(--accent-2)', pct:.27 },
            { l:'Follow-up (free)',v: 0,    c:'var(--ink-3)', pct:.10, note:'10% of visits' },
          ].map(r => (
            <div key={r.l} className="col" style={{gap:6}}>
              <div className="row between">
                <div className="row gap-2"><span style={{width:8, height:8, borderRadius:'50%', background:r.c}}/><span style={{fontSize:13, fontWeight:500}}>{r.l}</span></div>
                <span className="tnum" style={{fontWeight:600}}>${r.v.toLocaleString()}</span>
              </div>
              <div style={{height:6, borderRadius:3, background:'var(--line)'}}>
                <div style={{width:`${r.pct*100}%`, height:'100%', borderRadius:3, background:r.c}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass" style={{padding:24}}>
        <div className="row between" style={{marginBottom:14}}>
          <div className="eyebrow">Payouts</div>
          <Btn variant="ghost" size="sm">Stripe dashboard</Btn>
        </div>
        <div className="col gap-1">
          {[
            { d:'May 19', amt: 1840, status:'pending' },
            { d:'May 12', amt: 2104, status:'paid'    },
            { d:'May 05', amt: 1990, status:'paid'    },
            { d:'Apr 28', amt: 2208, status:'paid'    },
          ].map((p,i,a) => (
            <div key={i} className="row between" style={{padding:'12px 0', borderBottom:i<a.length-1?'1px solid var(--line)':'none'}}>
              <div className="row gap-3">
                <span className="mono tiny tnum" style={{minWidth: 55, color:'var(--ink-3)'}}>{p.d}</span>
                <span style={{fontSize:13.5}}>Weekly payout · Bank ending 4812</span>
              </div>
              <div className="row gap-3">
                <span className="tnum" style={{fontWeight:600}}>${p.amt.toLocaleString()}</span>
                <Pill variant={p.status==='paid'?'good':'warn'}>{p.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function DoctorSettings() {
  return (
    <div className="fade-enter col gap-6">
      <div className="col" style={{gap:6}}>
        <div className="eyebrow">Practice</div>
        <h1 className="h-1">Settings</h1>
      </div>
      <div className="admin-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {[
          { t:'Profile & bio',     d:'Photo, credentials, public bio',   icon:<I.user size={20}/> },
          { t:'Availability',      d:'Working hours, breaks, time off',  icon:<I.cal size={20}/>  },
          { t:'Visit types & fees',d:'Voice $120 · Video $120 · In-person $140', icon:<I.cards size={20}/> },
          { t:'Notifications',     d:'SMS, email, and push preferences', icon:<I.bell size={20}/> },
          { t:'Insurance & billing',d:'4 plans accepted · Stripe Connect',icon:<I.shield size={20}/>},
          { t:'Templates',         d:'Visit notes, intake forms, replies',icon:<I.doc size={20}/> },
        ].map(s => (
          <button key={s.t} className="glass" style={{padding:22, textAlign:'left', cursor:'pointer'}}>
            <div className="row gap-3">
              <div className="avatar md" style={{background:'color-mix(in oklab, var(--accent) 14%, transparent)', color:'var(--accent)'}}>{s.icon}</div>
              <div className="grow">
                <div className="h-4">{s.t}</div>
                <div className="small">{s.d}</div>
              </div>
              <I.chevR size={16} style={{color:'var(--ink-3)'}}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

window.DoctorCalendar = DoctorCalendar;
window.DoctorPatients = DoctorPatients;
window.DoctorMessages = DoctorMessages;
window.DoctorRecords = DoctorRecords;
window.DoctorEarnings = DoctorEarnings;
window.DoctorSettings = DoctorSettings;
