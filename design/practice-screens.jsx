// practice-screens.jsx — Single-doctor practice variant
// In Practice mode: the app represents Dr. Jenkins's solo clinic.
// PracticeLanding replaces Landing, PracticeAbout replaces the doctor list.

const { useState: p_uS } = React;

const HER = DOCTORS[0]; // Dr. Sarah Jenkins

function PracticeLanding({ go }) {
  return (
    <div className="fade-enter">
      <section className="hero" style={{paddingTop: 24}}>
        <div className="col gap-6">
          <div className="row gap-2 wrap">
            <Pill variant="accent" icon={<I.star size={11}/>}>Top-rated cardiologist · 4.9</Pill>
            <Pill icon={<I.shield size={11}/>}>Same-day video visits</Pill>
          </div>
          <h1 className="h-display">
            <span className="hero-italic" style={{color:'var(--accent)'}}>Heart</span><br/>
            care, made<br/>
            personal.
          </h1>
          <p className="body" style={{maxWidth: 520, fontSize: 18}}>
            Dr. Sarah Jenkins is a board-certified cardiologist focused on
            heart-failure prevention, echo imaging, and the long, careful conversations
            most clinics no longer have time for.
          </p>
          <div className="row gap-3 wrap">
            <Btn size="lg" icon={<I.cal size={16}/>} onClick={() => go('book', { docId: HER.id })}>Book with Dr. Jenkins</Btn>
            <Btn size="lg" variant="ghost" iconRight={<I.arrowR size={16}/>} onClick={() => go('about')}>About the practice</Btn>
          </div>
          <div className="row gap-6 wrap" style={{marginTop: 8, color:'var(--ink-3)', fontSize:13}}>
            <div className="row gap-2"><I.users size={15}/> 1,800+ patients</div>
            <div className="row gap-2"><I.clock size={15}/> 14 years experience</div>
            <div className="row gap-2"><I.video size={15}/> Video & in-person</div>
          </div>
        </div>

        <div className="col gap-3" style={{position:'relative'}}>
          <div className="glass-strong" style={{padding: 0, overflow:'hidden'}}>
            <div style={{
              height: 280, position:'relative',
              background:`linear-gradient(135deg, hsl(${HER.hue} 65% 70%), hsl(${(HER.hue+50)%360} 60% 45%))`
            }}>
              <Headshot name={HER.name} hue={HER.hue} size={220}
                style={{position:'absolute', bottom:-40, right:24, border:'6px solid var(--bg)'}}/>
              <div style={{position:'absolute', top:18, left:20}}>
                <Pill variant="good" style={{background:'rgba(255,255,255,.92)', color:'#0a0a0a', border:'1px solid rgba(255,255,255,.6)'}}>
                  <span className="dot" style={{background:'var(--good)'}}/>Online now
                </Pill>
              </div>
            </div>
            <div className="col gap-3" style={{padding: '48px 24px 22px'}}>
              <div>
                <div className="eyebrow" style={{marginBottom:4}}>Cardiology · MD, FACC</div>
                <div className="h-2">Dr. Sarah Jenkins</div>
              </div>
              <div className="row gap-5 wrap">
                <div className="col" style={{gap:2}}>
                  <div className="tiny">Next available</div>
                  <div className="row gap-1" style={{fontWeight:600}}><I.clock size={13} style={{color:'var(--accent)'}}/>Today · 2:30 PM</div>
                </div>
                <div className="vr"/>
                <div className="col" style={{gap:2}}>
                  <div className="tiny">Rating</div>
                  <div className="row gap-1"><Stars value={4.9} size={12}/><b className="tnum">4.9</b></div>
                </div>
                <div className="vr"/>
                <div className="col" style={{gap:2}}>
                  <div className="tiny">Consult</div>
                  <div><b className="tnum">${HER.fee}</b></div>
                </div>
              </div>
            </div>
          </div>
          <div className="glass" style={{padding: 16}}>
            <div className="row gap-3">
              <div style={{color:'var(--accent)'}}><I.sparkle size={20}/></div>
              <div>
                <div className="h-4">Not sure if a cardiologist is right?</div>
                <div className="small">Try our 60-second AI symptom check.</div>
              </div>
              <I.arrowR size={18} style={{color:'var(--ink-3)', marginLeft:'auto'}}/>
            </div>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="col gap-5" style={{marginTop: 16}}>
        <div className="col" style={{gap:6}}>
          <div className="eyebrow">What sets this practice apart</div>
          <h2 className="h-2">Old-school care, modern tools.</h2>
        </div>
        <div className="bento" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
          {[
            { t:'30-minute consults', d:'No 8-minute drive-bys. Real conversation, real listening — every visit.', icon:<I.clock size={22}/> },
            { t:'Same-day video',     d:'Booked by 10 AM, seen by 5 PM. Most prescriptions e-sent same day.',     icon:<I.video size={22}/> },
            { t:'One doctor, always', d:'You see Dr. Jenkins — not a rotating cast. Records and trust compound.',  icon:<I.user size={22}/>  },
          ].map(p => (
            <div key={p.t} className="glass cell">
              <div style={{color:'var(--accent)', marginBottom:14}}>{p.icon}</div>
              <div className="h-3" style={{marginBottom:6}}>{p.t}</div>
              <div className="body" style={{fontSize:14}}>{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Conditions treated */}
      <section className="col gap-5" style={{marginTop: 56}}>
        <div className="row between wrap">
          <div className="col" style={{gap:6}}>
            <div className="eyebrow">Conditions treated</div>
            <h2 className="h-2">What we look after.</h2>
          </div>
          <Btn variant="ghost" size="sm" iconRight={<I.arrowR size={14}/>} onClick={() => go('about')}>About the practice</Btn>
        </div>
        <div className="chip-row">
          {[
            'Heart failure','Atrial fibrillation','Hypertension','Echocardiography',
            'Chest pain workup','Palpitations','Lipid management','Pre-op clearance',
            'Cardiac risk assessment','Post-MI follow-up','Syncope','Valve disease'
          ].map(c => (
            <span key={c} className="pill" style={{padding:'10px 16px', fontSize:13}}>{c}</span>
          ))}
        </div>
      </section>

      {/* Quote / testimonial */}
      <section className="col" style={{marginTop:56}}>
        <div className="glass-strong" style={{padding: 48, textAlign:'center', position:'relative', overflow:'hidden'}}>
          <div className="hero-italic" style={{fontSize: 48, lineHeight:1.15, color:'var(--ink)', maxWidth: 760, margin:'0 auto 18px'}}>
            "She caught something three other doctors missed. Then explained it like a friend, not a chart."
          </div>
          <div className="row gap-3" style={{justifyContent:'center', marginTop:18}}>
            <Headshot name="Maya R." hue={30} size={36}/>
            <div className="col" style={{gap:0, textAlign:'left'}}>
              <b style={{fontSize:14}}>Maya R.</b>
              <div className="tiny">Patient since 2022</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{marginTop: 56, textAlign:'center'}}>
        <div className="col gap-4" style={{maxWidth: 600, margin:'0 auto'}}>
          <h2 className="h-1">Ready when you are.</h2>
          <p className="body">Most patients book in under 90 seconds. Free cancellation up to 4 hours before.</p>
          <div className="row gap-3" style={{justifyContent:'center', marginTop: 8}}>
            <Btn size="lg" icon={<I.cal size={16}/>} onClick={() => go('book', { docId: HER.id })}>Book your first visit</Btn>
          </div>
        </div>
      </section>
    </div>
  );
}

function PracticeAbout({ go }) {
  return (
    <div className="fade-enter col gap-7">
      <div className="row gap-3">
        <Btn variant="ghost" size="sm" icon={<I.arrowL size={14}/>} onClick={() => go('landing')}>Back home</Btn>
      </div>

      <div className="book-grid" style={{display:'grid', gridTemplateColumns:'1.1fr .9fr', gap: 24, alignItems:'start'}}>
        <div className="col gap-4">
          <div className="glass-strong" style={{padding:28}}>
            <div className="row gap-5" style={{alignItems:'flex-start'}}>
              <Headshot name={HER.name} hue={HER.hue} size={120}/>
              <div className="grow col" style={{gap:8}}>
                <div className="row gap-2 wrap">
                  <Pill variant="accent" icon={<I.star size={11}/>}>Top-rated</Pill>
                  <Pill icon={<I.shield size={11}/>}>Board-certified</Pill>
                </div>
                <h1 className="h-1" style={{fontSize: 40, lineHeight:1.05}}>Dr. Sarah Jenkins</h1>
                <div className="small"><b style={{color:'var(--ink)'}}>Cardiology</b> · MD, FACC — Heart failure & Echo</div>
              </div>
            </div>
            <hr className="hr" style={{margin:'22px 0'}}/>
            <div className="body" style={{fontSize: 15, color: 'var(--ink)', lineHeight: 1.7}}>
              I've spent fourteen years trying to give people something modern medicine often skips: a real
              conversation about their heart. I trained at Johns Hopkins, practiced at Mayo, and started this
              clinic because I missed knowing my patients by name.
            </div>
            <div className="body" style={{fontSize: 14, marginTop: 12}}>
              Most visits are 30 minutes. I see patients over video or in our small Brooklyn office.
              We never double-book.
            </div>
          </div>

          <div className="glass" style={{padding: 24}}>
            <div className="eyebrow" style={{marginBottom: 14}}>Training & credentials</div>
            <div className="col gap-3">
              {[
                { y:'2010', t:'MD, Johns Hopkins School of Medicine' },
                { y:'2014', t:'Residency in Internal Medicine, Mass General' },
                { y:'2017', t:'Fellowship in Cardiology, Mayo Clinic' },
                { y:'2018', t:'Board certification — Cardiovascular Disease' },
                { y:'2020', t:'Fellow of the American College of Cardiology (FACC)' },
              ].map((e,i) => (
                <div key={i} className="row gap-4" style={{alignItems:'baseline'}}>
                  <div className="mono tiny tnum" style={{width: 48, color:'var(--accent)'}}>{e.y}</div>
                  <div style={{fontSize:14}}>{e.t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{padding:24}}>
            <div className="eyebrow" style={{marginBottom: 14}}>Reviews · 412 verified</div>
            <div className="row gap-6 wrap" style={{marginBottom:18}}>
              <div className="col" style={{gap:4}}>
                <div className="h-1 tnum">4.9</div>
                <Stars value={4.9} size={13}/>
              </div>
              <div className="col grow gap-2">
                {[
                  ['Listened carefully', .98],
                  ['Explained clearly',  .96],
                  ['Punctual',           .91],
                  ['Followed up',        .94],
                ].map(([l,p]) => (
                  <div key={l} className="row gap-3" style={{alignItems:'center'}}>
                    <span className="small" style={{minWidth: 140, fontSize:13}}>{l}</span>
                    <div style={{flex:1, height:6, borderRadius:3, background:'var(--line)'}}>
                      <div style={{width: `${p*100}%`, height:'100%', borderRadius:3, background: 'var(--accent)'}}/>
                    </div>
                    <span className="tnum tiny" style={{minWidth:30, textAlign:'right'}}>{Math.round(p*100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col gap-4 book-right-sticky" style={{position:'sticky', top:24}}>
          <div className="glass-strong" style={{padding: 24}}>
            <div className="eyebrow" style={{marginBottom: 6}}>Next available</div>
            <div className="h-2 tnum" style={{marginBottom: 4}}>Today · 2:30 PM</div>
            <div className="small" style={{marginBottom: 18}}>plus 4 other slots today</div>
            <Btn style={{width:'100%'}} size="lg" iconRight={<I.arrowR size={16}/>} onClick={() => go('book', { docId: HER.id })}>Book a visit</Btn>
            <div className="row between" style={{marginTop:18}}>
              <span className="small">Consult fee</span>
              <span className="tnum" style={{fontWeight:600}}>${HER.fee}</span>
            </div>
            <div className="row between" style={{marginTop:8}}>
              <span className="small">Video & in-person</span>
              <span className="row gap-1 tiny"><I.video size={12}/><I.loc size={12}/></span>
            </div>
          </div>
          <div className="glass" style={{padding: 20}}>
            <div className="eyebrow" style={{marginBottom:10}}>Office</div>
            <div className="col" style={{gap:4}}>
              <div style={{fontWeight:600}}>Jenkins Cardiology</div>
              <div className="small">312 Atlantic Ave · Brooklyn, NY</div>
              <div className="small">Mon–Fri · 8 AM – 6 PM</div>
            </div>
            <hr className="hr" style={{margin:'14px 0'}}/>
            <div className="row between">
              <span className="small">Insurance accepted</span>
              <Pill variant="good">12 plans</Pill>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PracticeLanding = PracticeLanding;
window.PracticeAbout = PracticeAbout;
