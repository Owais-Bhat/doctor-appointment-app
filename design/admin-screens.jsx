// admin-screens.jsx — SaaS operator console for MedFlow
// Audience: platform owners — clinics/practices subscribe to your SaaS.
// Distinct visual register from the patient/doctor app: dense tables,
// numeric KPIs, growth charts. Still uses MedFlow's glass + accent.

const { useState: ad_uS, useMemo: ad_uM } = React;

// ─── shared data ────────────────────────────────────────────────────────────
const PLANS = [
  { id:'starter',  name:'Starter',    price:79,  cyc:'/mo', seats:'1 doctor',     color:'#94a3b8', features:['Up to 200 visits/mo','Booking widget','Patient records','Email reminders'] },
  { id:'pro',      name:'Pro',        price:199, cyc:'/mo', seats:'Up to 5 doctors', color:'var(--accent)', popular:true, features:['Unlimited visits','Video consults','SMS + email reminders','AI symptom triage','Analytics & reporting','Custom branding'] },
  { id:'clinic',   name:'Clinic',     price:499, cyc:'/mo', seats:'Up to 20 doctors', color:'var(--accent-2)', features:['Everything in Pro','Multi-location','API access','Insurance verification','Dedicated success manager','SAML SSO'] },
  { id:'ent',      name:'Enterprise', price:null,cyc:'',    seats:'Unlimited',    color:'#0a0a0a',     features:['Volume pricing','Custom integrations','BAA + HIPAA audit','24/7 support','Private cloud option','Migration assistance'] },
];

const CLINICS = [
  { n:'Jenkins Cardiology',        plan:'pro',     docs:1,  pts:412,  mrr:199,  city:'Brooklyn, NY',  status:'active',   joined:'2024-03',  health:98,  lastActive:'2m ago' },
  { n:'Riverside Family Medicine', plan:'clinic',  docs:8,  pts:3120, mrr:499,  city:'Chicago, IL',   status:'active',   joined:'2023-11',  health:96,  lastActive:'Just now' },
  { n:'Chen Neuro Group',          plan:'pro',     docs:3,  pts:840,  mrr:199,  city:'San Francisco', status:'active',   joined:'2024-08',  health:99,  lastActive:'8m ago' },
  { n:'Okafor Family Practice',    plan:'starter', docs:1,  pts:188,  mrr:79,   city:'Atlanta, GA',   status:'trialing', joined:'2026-05',  health:92,  lastActive:'1h ago' },
  { n:'Northside Pediatrics',      plan:'clinic',  docs:12, pts:5430, mrr:499,  city:'Boston, MA',    status:'active',   joined:'2022-06',  health:97,  lastActive:'Just now' },
  { n:'Bergström Sports Med',      plan:'pro',     docs:4,  pts:910,  mrr:199,  city:'Austin, TX',    status:'active',   joined:'2024-01',  health:94,  lastActive:'22m ago' },
  { n:'Raghavan Dermatology',      plan:'starter', docs:1,  pts:267,  mrr:79,   city:'Seattle, WA',   status:'past_due', joined:'2025-09',  health:78,  lastActive:'2d ago' },
  { n:'Klein Pulmonology',         plan:'pro',     docs:2,  pts:514,  mrr:199,  city:'Denver, CO',    status:'active',   joined:'2025-02',  health:95,  lastActive:'14m ago' },
  { n:'Conte Internal Medicine',   plan:'ent',     docs:35, pts:18400,mrr:2400, city:'Los Angeles',   status:'active',   joined:'2021-11',  health:99,  lastActive:'Just now' },
  { n:'Anders OB-GYN',             plan:'starter', docs:1,  pts:144,  mrr:79,   city:'Portland, OR',  status:'trialing', joined:'2026-05',  health:88,  lastActive:'4h ago' },
];

const PLAN_LABEL = Object.fromEntries(PLANS.map(p => [p.id, p.name]));
const PLAN_COLOR = Object.fromEntries(PLANS.map(p => [p.id, p.color]));

const STATUS_VARIANT = { active:'good', trialing:'accent', past_due:'bad', churned:'warn' };
const STATUS_LABEL   = { active:'Active', trialing:'Trial', past_due:'Past due', churned:'Churned' };

// ─── reusable area chart ────────────────────────────────────────────────────
const AreaChart = ({ data, color='var(--accent)', height=160, labels }) => {
  const w = 600, h = height, pad = 18;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v,i) => [
    pad + (i / (data.length-1)) * (w - pad*2),
    h - pad - ((v - min) / (max - min || 1)) * (h - pad*2)
  ]);
  // smooth path
  const path = pts.map((p,i) => i ? `L${p[0].toFixed(1)},${p[1].toFixed(1)}` : `M${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length-1][0]},${h-pad} L${pts[0][0]},${h-pad} Z`;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{height, width:'100%'}}>
      <defs>
        <linearGradient id={`grad-${height}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0,1,2,3].map(i => (
        <line key={i} x1={pad} x2={w-pad}
          y1={pad + i*(h-pad*2)/3} y2={pad + i*(h-pad*2)/3}
          className="gridline"/>
      ))}
      <path d={area} fill={`url(#grad-${height})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"
        strokeLinecap="round" strokeLinejoin="round"/>
      {/* end-of-line dot */}
      {pts.length && (
        <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
      )}
      {/* x-axis labels */}
      {labels && labels.map((l,i) => (
        <text key={i} x={pad + (i/(labels.length-1))*(w-pad*2)} y={h-2}
          textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.4">{l}</text>
      ))}
    </svg>
  );
};

// Donut chart
const Donut = ({ data, size=140, thickness=22 }) => {
  const total = data.reduce((s,d) => s+d.v, 0);
  const r = (size-thickness)/2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness}/>
      {data.map((d,i) => {
        const len = (d.v / total) * C;
        const off = -acc;
        acc += len;
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${C-len}`} strokeDashoffset={off}
            transform={`rotate(-90 ${size/2} ${size/2})`}/>
        );
      })}
      <text x="50%" y="50%" textAnchor="middle" dy="-0.1em" fontSize="20" fontWeight="700"
        fill="currentColor" style={{letterSpacing:'-.02em'}}>${(total/1000).toFixed(1)}k</text>
      <text x="50%" y="50%" textAnchor="middle" dy="1.3em" fontSize="9.5" letterSpacing="0.1em"
        fill="currentColor" opacity="0.5">MRR</text>
    </svg>
  );
};

// ─── shell helpers ──────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { id:'overview',  label:'Overview',   icon:'home',       section:'platform' },
  { id:'clinics',   label:'Clinics',    icon:'cards',      section:'platform' },
  { id:'doctors',   label:'Doctors',    icon:'users',      section:'platform' },
  { id:'patients',  label:'Patients',   icon:'user',       section:'platform' },
  { id:'billing',   label:'Billing',    icon:'activity',   section:'revenue'  },
  { id:'plans',     label:'Plans',      icon:'cards',      section:'revenue'  },
  { id:'audit',     label:'Audit log',  icon:'shield',     section:'security' },
  { id:'flags',     label:'Feature flags', icon:'spark',   section:'system'   },
  { id:'settings',  label:'Settings',   icon:'cog',        section:'system'   },
];

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
function SaaSOverview({ goAdmin }) {
  const trend = [3.2,3.4,3.5,3.7,3.9,4.0,4.1,4.4,4.7,4.9,5.1,5.4,5.6,5.8,6.2,6.5,6.8,7.2,7.5,7.9,8.3,8.6,9.0,9.4,9.9,10.3,10.7,11.2,11.6,12.0];
  const labels = ['Apr 19','Apr 26','May 3','May 10','May 17'];
  const mrrByPlan = [
    { l:'Pro',        v: 4970, color:'var(--accent)' },
    { l:'Clinic',     v: 3992, color:'var(--accent-2)' },
    { l:'Enterprise', v: 2400, color:'#0a0a0a' },
    { l:'Starter',    v: 632,  color:'#94a3b8' },
  ];

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">SaaS console</div>
          <h1 className="h-1">Platform <span className="hero-italic" style={{color:'var(--accent)'}}>overview</span></h1>
          <p className="body">Tuesday · May 19, 2026 — comparing the last 30 days.</p>
        </div>
        <div className="row gap-3">
          <div className="tabs">
            <button className="tab">7d</button>
            <button className="tab active">30d</button>
            <button className="tab">90d</button>
            <button className="tab">12m</button>
          </div>
          <Btn variant="ghost" icon={<I.doc size={14}/>}>Export</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {[
          { l:'MRR',                v:'$11,994', d:'+12.3%', up:true,  color:'var(--accent)',   spark:[6.8,7.1,7.4,7.8,8.1,8.6,9.0,9.4,9.9,10.3,10.7,11.2,11.6,12.0]},
          { l:'Active clinics',     v:'128',     d:'+8 new', up:true,  color:'var(--accent-2)', spark:[112,114,116,118,120,121,123,124,126,127,128]},
          { l:'Appointments today', v:'2,408',   d:'+18% wow',up:true, color:'#10b981',         spark:[1820,1900,2010,2100,2150,2240,2300,2350,2380,2408]},
          { l:'Past-due accounts',  v:'3',       d:'-1 vs Mon', up:true, color:'#ef4444',       spark:[6,5,5,4,4,3,3,3,3] },
        ].map(k => (
          <div key={k.l} className="glass cell stat">
            <div className="row between" style={{marginBottom:10}}>
              <div className="eyebrow">{k.l}</div>
              <span className={`delta ${k.up?'up':'dn'}`}><I.trendUp size={13}/>{k.d}</span>
            </div>
            <div className="val tnum" style={{marginBottom:6}}>{k.v}</div>
            <Spark data={k.spark} color={k.color} height={36}/>
          </div>
        ))}
      </div>

      {/* Main chart + donut */}
      <div className="admin-grid" style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, alignItems:'start'}}>
        <div className="glass" style={{padding:24}}>
          <div className="row between" style={{marginBottom:18}}>
            <div className="col" style={{gap:4}}>
              <div className="eyebrow">Monthly recurring revenue</div>
              <div className="row gap-3" style={{alignItems:'baseline'}}>
                <div className="h-1 tnum">$11,994</div>
                <span className="delta up tnum" style={{color:'var(--good)', fontWeight:600}}><I.trendUp size={14}/>+$1,320 (+12.3%)</span>
              </div>
            </div>
            <div className="tabs">
              <button className="tab active">MRR</button>
              <button className="tab">ARR</button>
              <button className="tab">Net new</button>
            </div>
          </div>
          <AreaChart data={trend} labels={labels} height={220}/>
        </div>

        <div className="glass" style={{padding:24}}>
          <div className="eyebrow" style={{marginBottom:18}}>Revenue by plan</div>
          <div className="row gap-5" style={{alignItems:'center'}}>
            <Donut data={mrrByPlan}/>
            <div className="col grow gap-3">
              {mrrByPlan.map(d => (
                <div key={d.l} className="row between">
                  <div className="row gap-2">
                    <span style={{width:10, height:10, borderRadius:'50%', background:d.color}}/>
                    <span style={{fontSize:13}}>{d.l}</span>
                  </div>
                  <span className="tnum" style={{fontWeight:600, fontSize:13}}>${d.v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lists row */}
      <div className="admin-grid" style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, alignItems:'start'}}>
        <div className="glass" style={{padding:24}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="eyebrow">Recent signups</div>
            <Btn variant="ghost" size="sm" iconRight={<I.arrowR size={13}/>} onClick={() => goAdmin('clinics')}>All clinics</Btn>
          </div>
          <div className="col gap-1">
            {CLINICS.filter(c => c.status==='trialing' || c.joined.startsWith('2026')).slice(0,5).map((c,i) => (
              <div key={c.n} className="row between" style={{padding:'10px 0', borderBottom: i<4 ? '1px solid var(--line)' : 'none'}}>
                <div className="row gap-3">
                  <div className="avatar md" style={{background:`color-mix(in oklab, ${PLAN_COLOR[c.plan]} 22%, transparent)`, color: PLAN_COLOR[c.plan]}}>{c.n.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
                  <div className="col" style={{gap:2}}>
                    <div style={{fontWeight:600, fontSize:14}}>{c.n}</div>
                    <div className="tiny">{c.city} · {c.docs} doctor{c.docs>1?'s':''}</div>
                  </div>
                </div>
                <div className="row gap-3">
                  <Pill>{PLAN_LABEL[c.plan]}</Pill>
                  <Pill variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Pill>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col gap-4">
          <div className="glass" style={{padding:22}}>
            <div className="row between" style={{marginBottom:14}}>
              <div className="eyebrow">System health</div>
              <Pill variant="good"><span className="dot" style={{background:'var(--good)'}}/>All systems normal</Pill>
            </div>
            <div className="col gap-3">
              {[
                { l:'API latency',      v:'124ms', sub:'p99 · last hour' },
                { l:'Database',         v:'OK',    sub:'12% CPU · 4.2gb' },
                { l:'Video infra',      v:'4 live',sub:'Twilio · 99.99%' },
                { l:'Background jobs',  v:'48',    sub:'queued · no backlog' },
              ].map((r,i)=> (
                <div key={r.l} className="row between" style={{paddingBottom: 8, borderBottom: i<3 ? '1px solid var(--line)' : 'none'}}>
                  <div>
                    <div style={{fontSize:13, fontWeight:500}}>{r.l}</div>
                    <div className="tiny">{r.sub}</div>
                  </div>
                  <span className="tnum" style={{fontWeight:600, fontSize:13}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cell" style={{
            padding:'var(--pad-card)',
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 10%, transparent), color-mix(in oklab, var(--accent-2) 12%, transparent))',
            border: '1px solid color-mix(in oklab, var(--accent) 22%, transparent)',
            borderRadius:'var(--radius-card)',
          }}>
            <div className="row gap-3" style={{marginBottom: 10}}>
              <div className="avatar md" style={{background:'linear-gradient(135deg, var(--accent), var(--accent-2))'}}><I.sparkle size={20}/></div>
              <div>
                <div className="eyebrow" style={{color:'var(--accent)'}}>AI insight</div>
                <div className="h-4">Conversion is up 18% on the body-map triage flow.</div>
              </div>
            </div>
            <div className="small" style={{marginBottom: 12}}>Trials starting from the AI-chat variant convert ~14% lower. Worth A/B-locking the body map as default for new clinics.</div>
            <Btn size="sm" variant="glass" iconRight={<I.arrowR size={13}/>}>Lock as default</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLINICS — tenant table
// ═══════════════════════════════════════════════════════════════════════════
function SaaSClinics() {
  const [q, setQ] = ad_uS('');
  const [plan, setPlan] = ad_uS('all');
  const [status, setStatus] = ad_uS('all');
  const [sort, setSort] = ad_uS({ k:'mrr', dir:'desc' });
  const [selected, setSelected] = ad_uS(new Set());

  const filtered = ad_uM(() => CLINICS.filter(c => {
    if (q && !(c.n + c.city).toLowerCase().includes(q.toLowerCase())) return false;
    if (plan !== 'all' && c.plan !== plan) return false;
    if (status !== 'all' && c.status !== status) return false;
    return true;
  }).sort((a,b) => {
    const m = sort.dir === 'asc' ? 1 : -1;
    return (a[sort.k] > b[sort.k] ? 1 : -1) * m;
  }), [q, plan, status, sort]);

  const headers = [
    { k:'n',          label:'Clinic',        w:'auto' },
    { k:'plan',       label:'Plan',          w:120 },
    { k:'docs',       label:'Doctors',       w:90, tnum:true, align:'right' },
    { k:'pts',        label:'Patients',      w:110, tnum:true, align:'right' },
    { k:'mrr',        label:'MRR',           w:110, tnum:true, align:'right' },
    { k:'health',     label:'Health',        w:120 },
    { k:'status',     label:'Status',        w:110 },
    { k:'lastActive', label:'Active',        w:110 },
    { k:'_',          label:'',              w:40 },
  ];

  const toggle = (n) => {
    const next = new Set(selected);
    next.has(n) ? next.delete(n) : next.add(n);
    setSelected(next);
  };

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">{filtered.length} of {CLINICS.length}</div>
          <h1 className="h-1">Clinics</h1>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" icon={<I.doc size={14}/>}>Export CSV</Btn>
          <Btn icon={<I.plus size={14}/>}>Invite clinic</Btn>
        </div>
      </div>

      <div className="glass" style={{padding:14}}>
        <div className="row between wrap gap-3">
          <div className="search" style={{flex:1, maxWidth: 360}}>
            <I.search size={16} style={{color:'var(--ink-3)'}}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or city…"/>
          </div>
          <div className="row gap-2 wrap">
            <button className={`pill ${plan==='all'?'solid':''}`} onClick={()=>setPlan('all')} style={{cursor:'pointer'}}>All plans</button>
            {PLANS.map(p => (
              <button key={p.id} className={`pill ${plan===p.id?'solid':''}`} onClick={()=>setPlan(p.id)} style={{cursor:'pointer'}}>{p.name}</button>
            ))}
            <div className="vr"/>
            <div className="tabs">
              <button className={`tab ${status==='all'?'active':''}`} onClick={()=>setStatus('all')}>Any</button>
              <button className={`tab ${status==='active'?'active':''}`} onClick={()=>setStatus('active')}>Active</button>
              <button className={`tab ${status==='trialing'?'active':''}`} onClick={()=>setStatus('trialing')}>Trial</button>
              <button className={`tab ${status==='past_due'?'active':''}`} onClick={()=>setStatus('past_due')}>Past due</button>
            </div>
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="glass-strong" style={{padding:'10px 14px', display:'flex', alignItems:'center', gap:14}}>
          <span style={{fontWeight:600, fontSize:13}}>{selected.size} selected</span>
          <div className="vr"/>
          <Btn variant="ghost" size="sm" icon={<I.send size={13}/>}>Email</Btn>
          <Btn variant="ghost" size="sm" icon={<I.activity size={13}/>}>Change plan</Btn>
          <Btn variant="ghost" size="sm" icon={<I.shield size={13}/>}>Suspend</Btn>
          <div style={{marginLeft:'auto'}}><Btn variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Btn></div>
        </div>
      )}

      <div className="glass" style={{padding:0, overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13.5}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              <th style={{padding:'14px 14px 14px 20px', width:34}}>
                <input type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(c=>c.n)))}/>
              </th>
              {headers.map(h => (
                <th key={h.k} style={{padding:'14px 12px', width:h.w, textAlign: h.align || 'left', cursor: h.k!=='_' ? 'pointer' : 'default'}}
                    onClick={() => h.k!=='_' && setSort(s => ({ k: h.k, dir: s.k===h.k && s.dir==='desc' ? 'asc' : 'desc' }))}>
                  <span className="eyebrow" style={{display:'inline-flex', alignItems:'center', gap:4}}>
                    {h.label}
                    {sort.k===h.k && <I.chevD size={11} style={{transform: sort.dir==='asc'?'rotate(180deg)':'none'}}/>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c,i) => (
              <tr key={c.n} style={{borderTop:'1px solid var(--line)', background: selected.has(c.n) ? 'color-mix(in oklab, var(--accent) 6%, transparent)' : 'transparent'}}>
                <td style={{padding:'14px 14px 14px 20px'}}>
                  <input type="checkbox" checked={selected.has(c.n)} onChange={() => toggle(c.n)}/>
                </td>
                <td style={{padding:'14px 12px'}}>
                  <div className="row gap-3">
                    <div className="avatar md" style={{background:`color-mix(in oklab, ${PLAN_COLOR[c.plan]} 18%, transparent)`, color: PLAN_COLOR[c.plan], fontSize:12}}>
                      {c.n.split(' ').map(w=>w[0]).slice(0,2).join('')}
                    </div>
                    <div className="col" style={{gap:2}}>
                      <div style={{fontWeight:600}}>{c.n}</div>
                      <div className="tiny">{c.city} · joined {c.joined}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:'14px 12px'}}>
                  <span className="pill" style={{background:`color-mix(in oklab, ${PLAN_COLOR[c.plan]} 14%, transparent)`, color:PLAN_COLOR[c.plan], borderColor:`color-mix(in oklab, ${PLAN_COLOR[c.plan]} 28%, transparent)`}}>{PLAN_LABEL[c.plan]}</span>
                </td>
                <td className="tnum" style={{padding:'14px 12px', textAlign:'right'}}>{c.docs}</td>
                <td className="tnum" style={{padding:'14px 12px', textAlign:'right'}}>{c.pts.toLocaleString()}</td>
                <td className="tnum" style={{padding:'14px 12px', textAlign:'right', fontWeight:600}}>${c.mrr.toLocaleString()}</td>
                <td style={{padding:'14px 12px'}}>
                  <div className="row gap-2" style={{alignItems:'center'}}>
                    <div style={{width:60, height:6, borderRadius:3, background:'var(--line)'}}>
                      <div style={{width:`${c.health}%`, height:'100%', borderRadius:3, background: c.health > 90 ? 'var(--good)' : c.health > 80 ? 'var(--warn)' : 'var(--bad)'}}/>
                    </div>
                    <span className="tiny tnum">{c.health}</span>
                  </div>
                </td>
                <td style={{padding:'14px 12px'}}><Pill variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Pill></td>
                <td className="tiny" style={{padding:'14px 12px'}}>{c.lastActive}</td>
                <td style={{padding:'14px 8px'}}>
                  <span className="icon-btn" style={{margin:0}}><I.chevR size={14}/></span>
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
// PLANS — pricing tier cards
// ═══════════════════════════════════════════════════════════════════════════
function SaaSPlans() {
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">Pricing</div>
          <h1 className="h-1">Plans &amp; pricing</h1>
          <p className="body">Edit the tiers your customers see. Changes take effect immediately on the marketing site.</p>
        </div>
        <div className="row gap-3">
          <div className="tabs">
            <button className="tab active">Monthly</button>
            <button className="tab">Annual <span className="pill accent" style={{marginLeft:6, fontSize:10, padding:'1px 7px'}}>-20%</span></button>
          </div>
          <Btn icon={<I.plus size={14}/>}>New tier</Btn>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, alignItems:'stretch'}} className="plans-grid">
        {PLANS.map(p => (
          <div key={p.id} className={p.popular ? 'glass-strong cell' : 'glass cell'}
            style={{
              padding: 24,
              border: p.popular ? '2px solid var(--accent)' : '1px solid var(--glass-edge)',
              position:'relative',
              display:'flex', flexDirection:'column'
            }}>
            {p.popular && (
              <div style={{position:'absolute', top:-12, left:24}}>
                <Pill variant="accent" icon={<I.star size={11}/>}>Most popular</Pill>
              </div>
            )}
            <div className="eyebrow" style={{color:p.color, marginBottom:8}}>{p.name}</div>
            <div className="row gap-1" style={{alignItems:'baseline', marginBottom:6}}>
              {p.price != null ? (
                <>
                  <span className="tnum" style={{fontSize:48, fontWeight:700, letterSpacing:'-.03em', lineHeight:1}}>${p.price}</span>
                  <span className="small">{p.cyc}</span>
                </>
              ) : (
                <span className="hero-italic" style={{fontSize:38, color:'var(--ink)'}}>Custom</span>
              )}
            </div>
            <div className="small" style={{marginBottom:18}}>{p.seats}</div>
            <Btn variant={p.popular ? 'primary' : 'ghost'} style={{width:'100%', marginBottom:18}}>
              {p.id === 'ent' ? 'Contact sales' : 'Edit tier'}
            </Btn>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8}}>
              {p.features.map(f => (
                <li key={f} className="row gap-2" style={{fontSize:13, alignItems:'flex-start'}}>
                  <span style={{color:p.color, flexShrink:0, marginTop:2}}><I.check size={14}/></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <hr className="hr" style={{margin:'auto 0 12px'}}/>
            <div className="row between">
              <span className="tiny">{CLINICS.filter(c=>c.plan===p.id).length} customers</span>
              <span className="tiny tnum">${CLINICS.filter(c=>c.plan===p.id).reduce((s,c)=>s+c.mrr,0).toLocaleString()}/mo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Feature matrix */}
      <div className="glass" style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:'20px 24px 14px'}}>
          <div className="eyebrow">Feature comparison</div>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13.5}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              <th style={{padding:'12px 24px', width:'40%'}}><span className="eyebrow">Feature</span></th>
              {PLANS.map(p => <th key={p.id} style={{padding:'12px', textAlign:'center'}}><span className="eyebrow" style={{color:p.color}}>{p.name}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ['Online booking widget',            ['✓','✓','✓','✓']],
              ['Email reminders',                  ['✓','✓','✓','✓']],
              ['SMS reminders',                    ['—','✓','✓','✓']],
              ['Video consultations',              ['—','✓','✓','✓']],
              ['AI symptom triage',                ['—','✓','✓','✓']],
              ['Custom branding',                  ['—','✓','✓','✓']],
              ['Analytics dashboard',              ['—','✓','✓','✓']],
              ['Multi-location',                   ['—','—','✓','✓']],
              ['API access',                       ['—','—','✓','✓']],
              ['Insurance verification',           ['—','—','✓','✓']],
              ['SAML SSO',                         ['—','—','✓','✓']],
              ['BAA + HIPAA audit',                ['—','—','—','✓']],
              ['Dedicated success manager',        ['—','—','✓','✓']],
              ['24/7 support',                     ['—','—','—','✓']],
            ].map(([feat, vals], i) => (
              <tr key={feat} style={{borderTop:'1px solid var(--line)'}}>
                <td style={{padding:'12px 24px', fontWeight:500}}>{feat}</td>
                {vals.map((v,j) => (
                  <td key={j} style={{padding:'12px', textAlign:'center', color: v==='✓' ? PLANS[j].color : 'var(--ink-3)', fontWeight: v==='✓' ? 700 : 400}}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BILLING
// ═══════════════════════════════════════════════════════════════════════════
function SaaSBilling() {
  const txns = [
    { d:'May 19', who:'Riverside Family Medicine', plan:'clinic', amt:499, status:'paid' },
    { d:'May 19', who:'Northside Pediatrics',      plan:'clinic', amt:499, status:'paid' },
    { d:'May 18', who:'Chen Neuro Group',          plan:'pro',    amt:199, status:'paid' },
    { d:'May 18', who:'Bergström Sports Med',      plan:'pro',    amt:199, status:'paid' },
    { d:'May 17', who:'Conte Internal Medicine',   plan:'ent',    amt:2400,status:'paid' },
    { d:'May 17', who:'Raghavan Dermatology',      plan:'starter',amt:79,  status:'failed' },
    { d:'May 16', who:'Klein Pulmonology',         plan:'pro',    amt:199, status:'paid' },
    { d:'May 15', who:'Jenkins Cardiology',        plan:'pro',    amt:199, status:'paid' },
  ];
  const TXN_VARIANT = { paid:'good', failed:'bad', refunded:'warn' };

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">Revenue</div>
          <h1 className="h-1">Billing</h1>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" icon={<I.doc size={14}/>}>Stripe dashboard</Btn>
          <Btn variant="ghost" icon={<I.doc size={14}/>}>Export</Btn>
        </div>
      </div>

      <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {[
          { l:'MRR',           v:'$11,994', d:'+12.3%' },
          { l:'ARR',           v:'$143,928',d:'+12.3%' },
          { l:'Net new MRR',   v:'+$1,320', d:'this month' },
          { l:'Churn',         v:'1.6%',    d:'-0.4pp', good:true },
        ].map(k => (
          <div key={k.l} className="glass cell">
            <div className="eyebrow" style={{marginBottom:10}}>{k.l}</div>
            <div className="row between" style={{alignItems:'baseline'}}>
              <div className="h-2 tnum">{k.v}</div>
              <span className="delta up" style={{color:'var(--good)', fontWeight:600, fontSize:12}}><I.trendUp size={13}/>{k.d}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid" style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20}}>
        <div className="glass" style={{padding:24}}>
          <div className="row between" style={{marginBottom:16}}>
            <div className="eyebrow">Recent transactions</div>
            <Btn variant="ghost" size="sm">View all</Btn>
          </div>
          <div className="col gap-1">
            {txns.map((t,i) => (
              <div key={i} className="row between" style={{padding:'12px 0', borderBottom: i<txns.length-1 ? '1px solid var(--line)' : 'none'}}>
                <div className="row gap-3">
                  <div className="tnum mono tiny" style={{minWidth:55, color:'var(--ink-3)'}}>{t.d}</div>
                  <div style={{fontSize:13, fontWeight:500}}>{t.who}</div>
                </div>
                <div className="row gap-3">
                  <Pill style={{background:`color-mix(in oklab, ${PLAN_COLOR[t.plan]} 14%, transparent)`, color:PLAN_COLOR[t.plan], borderColor:'transparent'}}>{PLAN_LABEL[t.plan]}</Pill>
                  <span className="tnum" style={{fontWeight:600, minWidth:60, textAlign:'right'}}>${t.amt}</span>
                  <Pill variant={TXN_VARIANT[t.status]}>{t.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col gap-4">
          <div className="glass" style={{padding:22}}>
            <div className="eyebrow" style={{marginBottom:12}}>Subscription status</div>
            <div className="col gap-3">
              {[
                { l:'Active',       v:120, c:'var(--good)' },
                { l:'Trialing',     v:5,   c:'var(--accent)' },
                { l:'Past due',     v:3,   c:'var(--bad)' },
                { l:'Cancelled',    v:8,   c:'var(--ink-3)' },
              ].map(r => (
                <div key={r.l} className="row between">
                  <div className="row gap-2">
                    <span style={{width:8, height:8, borderRadius:'50%', background:r.c}}/>
                    <span style={{fontSize:13}}>{r.l}</span>
                  </div>
                  <span className="tnum" style={{fontWeight:600}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass" style={{padding:22}}>
            <div className="row between" style={{marginBottom:12}}>
              <div className="eyebrow">Failed payments</div>
              <Pill variant="bad">3</Pill>
            </div>
            <div className="col gap-3">
              {[
                { who:'Raghavan Dermatology', amt:79,  retry:'Tomorrow' },
                { who:'Conte (overage)',       amt:240, retry:'In 2 days' },
                { who:'Anders OB-GYN',         amt:79,  retry:'Today' },
              ].map((f,i) => (
                <div key={i} className="row between" style={{paddingBottom: 8, borderBottom: i<2 ? '1px solid var(--line)':'none'}}>
                  <div>
                    <div style={{fontSize:13, fontWeight:500}}>{f.who}</div>
                    <div className="tiny">Retry · {f.retry}</div>
                  </div>
                  <span className="tnum" style={{fontWeight:600}}>${f.amt}</span>
                </div>
              ))}
            </div>
            <Btn variant="ghost" size="sm" style={{width:'100%', marginTop:14}} icon={<I.send size={13}/>}>Send dunning emails</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════
function SaaSAudit() {
  const events = [
    { t:'14:32', who:'sarah@jenkins-cardio.com',  e:'patient.export',        details:'Exported 412 patient records',   sev:'high'},
    { t:'14:18', who:'system',                    e:'subscription.created',  details:'Anders OB-GYN started Starter trial', sev:'info'},
    { t:'13:55', who:'marcus@chen-neuro.com',     e:'doctor.invited',        details:'Invited dr.lee@chen-neuro.com',    sev:'info'},
    { t:'13:40', who:'system',                    e:'payment.failed',        details:'Raghavan Dermatology — $79',       sev:'warn'},
    { t:'12:08', who:'admin@medflow.com',         e:'feature_flag.toggled',  details:'ai_triage_default → on',           sev:'info'},
    { t:'11:42', who:'priya@raghavan.com',        e:'login.failed',          details:'3 attempts from new IP',            sev:'warn'},
    { t:'10:30', who:'system',                    e:'data.encrypted',        details:'Daily key rotation completed',       sev:'info'},
    { t:'09:14', who:'admin@medflow.com',         e:'tenant.suspended',      details:'Suspended XX Clinic — TOS violation',sev:'high'},
    { t:'08:05', who:'system',                    e:'backup.completed',      details:'Daily backup · 4.2GB',              sev:'info'},
  ];
  const sevColor = { info:'var(--ink-3)', warn:'var(--warn)', high:'var(--bad)' };

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">Compliance</div>
          <h1 className="h-1">Audit log</h1>
          <p className="body">Every privileged action across the platform. Stored 7 years for HIPAA.</p>
        </div>
        <div className="row gap-3">
          <div className="search" style={{minWidth:280}}>
            <I.search size={16} style={{color:'var(--ink-3)'}}/>
            <input placeholder="Search events…"/>
          </div>
          <Btn variant="ghost" icon={<I.filter size={14}/>}>Filter</Btn>
        </div>
      </div>

      <div className="glass" style={{padding:0}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              {['Time','Severity','Actor','Event','Details',''].map(h => (
                <th key={h} style={{padding:'14px 16px'}}><span className="eyebrow">{h}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e,i) => (
              <tr key={i} style={{borderTop:'1px solid var(--line)'}}>
                <td className="tnum mono" style={{padding:'14px 16px', color:'var(--ink-3)'}}>{e.t}</td>
                <td style={{padding:'14px 16px'}}>
                  <span className="row gap-2" style={{display:'inline-flex'}}>
                    <span style={{width:8, height:8, borderRadius:'50%', background:sevColor[e.sev]}}/>
                    <span style={{fontWeight:500}}>{e.sev}</span>
                  </span>
                </td>
                <td className="mono" style={{padding:'14px 16px', fontSize:12}}>{e.who}</td>
                <td style={{padding:'14px 16px'}}>
                  <code style={{background:'var(--glass)', padding:'2px 8px', borderRadius:6, fontSize:12}}>{e.e}</code>
                </td>
                <td style={{padding:'14px 16px'}}>{e.details}</td>
                <td style={{padding:'14px 16px'}}>
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
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════
function SaaSFlags() {
  const [flags, setFlags] = ad_uS({
    ai_triage_default: true,
    new_booking_v2:    true,
    video_recording:   false,
    insurance_realtime:true,
    family_accounts:   false,
    refer_a_friend:    false,
    voice_intake:      false,
  });

  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">System</div>
          <h1 className="h-1">Feature flags</h1>
          <p className="body">Roll features out gradually — by clinic, by plan, or globally.</p>
        </div>
        <Btn icon={<I.plus size={14}/>}>New flag</Btn>
      </div>

      <div className="glass" style={{padding:0}}>
        {Object.entries(flags).map(([k,v], i, arr) => (
          <div key={k} style={{padding:'18px 24px', borderTop: i ? '1px solid var(--line)' : 'none', display:'flex', alignItems:'center', gap:16}}>
            <div className="grow">
              <div className="row gap-2" style={{alignItems:'baseline'}}>
                <code style={{fontSize:13, fontWeight:600}}>{k}</code>
                <Pill variant={v?'good':'warn'}>{v?'On':'Off'}</Pill>
              </div>
              <div className="tiny" style={{marginTop:4}}>{({
                ai_triage_default:    'Use AI body-map as the default triage UX (vs. chat).',
                new_booking_v2:       'New booking flow with redesigned slot picker.',
                video_recording:      'Allow doctors to record video sessions (opt-in by patient).',
                insurance_realtime:   'Real-time insurance verification on the booking page.',
                family_accounts:      'Single login that manages multiple family members.',
                refer_a_friend:       'Patient-side referral codes that grant a $20 credit.',
                voice_intake:         'Voice-only intake form for accessibility.',
              })[k]}</div>
            </div>
            <span className="tiny mono" style={{color:'var(--ink-3)'}}>{v ? '100%' : '0%'} rollout</span>
            <button onClick={() => setFlags({...flags, [k]:!v})}
              style={{
                appearance:'none', border:0, cursor:'pointer',
                width:44, height:24, borderRadius:12, padding:2,
                background: v ? 'var(--accent)' : 'var(--line-2)',
                transition: 'background .2s ease', position:'relative'
              }}>
              <span style={{
                display:'block', width:20, height:20, borderRadius:'50%', background:'#fff',
                transform: v ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform .2s ease',
                boxShadow:'0 1px 3px rgba(0,0,0,.2)'
              }}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS (light)
// ═══════════════════════════════════════════════════════════════════════════
function SaaSSettings() {
  return (
    <div className="fade-enter col gap-6">
      <div className="col" style={{gap:6}}>
        <div className="eyebrow">System</div>
        <h1 className="h-1">Settings</h1>
      </div>
      <div className="admin-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
        {[
          { t:'Branding',   d:'Logo, colors, marketing site copy',    icon:<I.sparkle size={20}/> },
          { t:'Domains',    d:'2 custom domains · *.medflow.com',     icon:<I.loc size={20}/>     },
          { t:'API keys',   d:'4 active · last rotated 12 days ago',  icon:<I.shield size={20}/>  },
          { t:'Webhooks',   d:'6 endpoints · 98.7% delivery',         icon:<I.send size={20}/>    },
          { t:'Team',       d:'5 admins · 2 read-only',               icon:<I.users size={20}/>   },
          { t:'Billing & taxes', d:'Stripe connected · 4 tax regions',icon:<I.cards size={20}/>   },
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

// ═══════════════════════════════════════════════════════════════════════════
// DOCTORS / PATIENTS — light directory views
// ═══════════════════════════════════════════════════════════════════════════
function SaaSDoctors() {
  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">{DOCTORS.length * 8} across all clinics</div>
          <h1 className="h-1">Doctors</h1>
        </div>
        <div className="row gap-3">
          <div className="search" style={{minWidth: 280}}>
            <I.search size={16} style={{color:'var(--ink-3)'}}/>
            <input placeholder="Search doctors, NPI…"/>
          </div>
          <Btn icon={<I.plus size={14}/>}>Invite</Btn>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16}}>
        {DOCTORS.map((d,i) => (
          <div key={d.id} className="glass" style={{padding:'var(--pad-card)'}}>
            <div className="row gap-3">
              <Headshot name={d.name} hue={d.hue} size={56}/>
              <div className="grow">
                <div className="h-4">{d.name}</div>
                <div className="small">{d.spec} · {['Jenkins Cardiology','Chen Neuro Group','Okafor Family','Bergström Sports Med','Raghavan Derma','Klein Pulm'][i]}</div>
              </div>
              <Pill variant="good">Verified</Pill>
            </div>
            <hr className="hr" style={{margin:'14px 0'}}/>
            <div className="row between">
              <div className="col" style={{gap:2}}>
                <div className="tiny">Appointments / mo</div>
                <div className="tnum" style={{fontWeight:600}}>{120 + i*30}</div>
              </div>
              <div className="col" style={{gap:2}}>
                <div className="tiny">Rating</div>
                <div className="row gap-1"><I.star size={12} style={{color:'var(--accent)'}}/><b className="tnum">{d.rating}</b></div>
              </div>
              <div className="col" style={{gap:2}}>
                <div className="tiny">Revenue / mo</div>
                <div className="tnum" style={{fontWeight:600}}>${(d.fee * (120 + i*30) * 0.15).toFixed(0)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaaSPatients() {
  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">28,914 platform-wide</div>
          <h1 className="h-1">Patients</h1>
        </div>
        <div className="search" style={{minWidth: 280}}>
          <I.search size={16} style={{color:'var(--ink-3)'}}/>
          <input placeholder="Search anonymized IDs…"/>
        </div>
      </div>
      <div className="bento" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {[
          { l:'Active patients (30d)', v:'28,914' },
          { l:'New this month',        v:'+1,820' },
          { l:'Appts completed (mo)',  v:'14,408' },
          { l:'Avg. visits / patient', v:'2.1' },
        ].map(k => (
          <div key={k.l} className="glass cell">
            <div className="eyebrow" style={{marginBottom:8}}>{k.l}</div>
            <div className="h-2 tnum">{k.v}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{padding:22}}>
        <div className="row gap-3" style={{alignItems:'center'}}>
          <div style={{color:'var(--accent)'}}><I.shield size={20}/></div>
          <div>
            <div className="h-4">Patient data is encrypted and anonymized in this view.</div>
            <div className="small">Per HIPAA + your DPA. Drill-downs are clinic-scoped and audit-logged.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SaaSOverview = SaaSOverview;
window.SaaSClinics = SaaSClinics;
window.SaaSPlans = SaaSPlans;
window.SaaSBilling = SaaSBilling;
window.SaaSAudit = SaaSAudit;
window.SaaSFlags = SaaSFlags;
window.SaaSSettings = SaaSSettings;
window.SaaSDoctors = SaaSDoctors;
window.SaaSPatients = SaaSPatients;
window.ADMIN_NAV = ADMIN_NAV;
window.CLINICS = CLINICS;
window.PLANS = PLANS;
