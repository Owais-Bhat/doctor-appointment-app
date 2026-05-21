// voice-call.jsx — Live voice consultation screen + voice intake widget

const { useState: vc_uS, useEffect: vc_uE, useRef: vc_uR } = React;

// Animated audio bars — pure CSS via keyframes inside style block
const audioBarsStyles = `
@keyframes vc-bar-1 { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
@keyframes vc-bar-2 { 0%,100%{transform:scaleY(.5)} 50%{transform:scaleY(.85)} }
@keyframes vc-bar-3 { 0%,100%{transform:scaleY(.4)} 50%{transform:scaleY(1)} }
@keyframes vc-bar-4 { 0%,100%{transform:scaleY(.6)} 50%{transform:scaleY(.95)} }
@keyframes vc-bar-5 { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(.7)} }
@keyframes vc-pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.5);opacity:0} }
.vc-bars { display:flex; align-items:center; gap:3px; height:36px; }
.vc-bars span { display:block; width:4px; height:100%; border-radius:2px; background: currentColor; transform-origin: center; }
.vc-bars span:nth-child(1){ animation: vc-bar-1 1s ease-in-out infinite; }
.vc-bars span:nth-child(2){ animation: vc-bar-2 .9s ease-in-out infinite .1s; }
.vc-bars span:nth-child(3){ animation: vc-bar-3 1.1s ease-in-out infinite .2s; }
.vc-bars span:nth-child(4){ animation: vc-bar-4 .85s ease-in-out infinite .15s; }
.vc-bars span:nth-child(5){ animation: vc-bar-5 1.05s ease-in-out infinite .05s; }
.vc-bars span:nth-child(6){ animation: vc-bar-2 .95s ease-in-out infinite .25s; }
.vc-bars span:nth-child(7){ animation: vc-bar-3 1s ease-in-out infinite .3s; }
.vc-bars.muted span{ animation: none; transform: scaleY(.15); opacity:.4; }
.vc-pulse{ position:absolute; inset:0; border-radius:50%; border:2px solid currentColor; opacity:.6; animation: vc-pulse-ring 1.8s ease-out infinite; }
.vc-pulse.b{ animation-delay: .9s; }
@keyframes vc-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
.vc-spin{ animation: vc-spin 2.4s linear infinite; }
`;

function VoiceCallScene({ go }) {
  const [mute, setMute] = vc_uS(false);
  const [speaker, setSpeaker] = vc_uS(false);
  const [paused, setPaused] = vc_uS(false);
  const [seconds, setSeconds] = vc_uS(0);
  const [transcript, setTranscript] = vc_uS([
    { who:'doctor', t:"Hi Alex, can you hear me okay?", ts: 0 },
    { who:'patient',t:"Yes — clearly. Thanks for fitting me in.", ts: 3 },
    { who:'doctor', t:"Of course. Tell me about the chest tightness you mentioned in the intake.", ts: 8 },
    { who:'patient',t:"It usually happens after coffee, lasts maybe ten minutes…", ts: 17 },
  ]);

  vc_uE(() => {
    if (paused) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  // After a moment, append more transcript entries
  vc_uE(() => {
    if (paused) return;
    const adds = [
      { who:'doctor', t:"And is it sharp, or more of a pressure?",       at: 12 },
      { who:'patient',t:"More of a pressure. Like something sitting there.", at: 18 },
      { who:'doctor', t:"Okay. Any radiation to your left arm or jaw?",     at: 26 },
      { who:'patient',t:"No, not really. Just the center.",                 at: 32 },
      { who:'doctor', t:"Good. We'll want an EKG. I can order one through MedFlow now.", at: 42 },
    ];
    const next = adds.filter(a => a.at <= seconds && !transcript.some(t => t.t === a.t));
    if (next.length) setTranscript([...transcript, ...next.map(a => ({ who:a.who, t:a.t, ts:a.at }))]);
  }, [seconds, paused]);

  const mm = String(Math.floor(seconds/60)).padStart(2,'0');
  const ss = String(seconds % 60).padStart(2,'0');
  const d = DOCTORS[0];

  return (
    <div className="fade-enter" data-screen-label="voice call">
      <style>{audioBarsStyles}</style>

      <div className="row between" style={{marginBottom: 22}}>
        <div className="row gap-3">
          <Pill variant="bad"><span className="dot" style={{background:'var(--bad)', animation:'vc-pulse-ring 1.5s ease-out infinite'}}/>Live · {mm}:{ss}</Pill>
          <Pill icon={<I.phone size={11}/>}>Voice consultation</Pill>
          <Pill icon={<I.shield size={11}/>}>End-to-end encrypted</Pill>
        </div>
        <Btn variant="ghost" size="sm" icon={<I.close size={14}/>} onClick={() => go('dashboard')}>Minimize</Btn>
      </div>

      <div className="vc-grid" style={{display:'grid', gridTemplateColumns: '1.1fr .9fr', gap: 20, alignItems:'stretch'}}>
        {/* CALL STAGE */}
        <div className="glass-strong" style={{
          padding: 36, minHeight: 580,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between',
          background: 'linear-gradient(160deg, color-mix(in oklab, var(--accent) 8%, transparent), color-mix(in oklab, var(--accent-2) 8%, transparent))',
          position:'relative', overflow:'hidden'
        }}>
          <div className="col" style={{alignItems:'center', gap: 10, marginTop: 12}}>
            <div className="eyebrow" style={{color:'var(--accent)'}}>On call with</div>
            <div className="h-2">{d.name}</div>
            <div className="small">{d.spec} · MD, FACC</div>
          </div>

          {/* Avatar + pulse rings */}
          <div style={{position:'relative', width: 240, height: 240, display:'grid', placeItems:'center'}}>
            <div style={{position:'absolute', inset: 0, color:'var(--accent)'}}>
              <span className="vc-pulse"/>
              <span className="vc-pulse b"/>
            </div>
            <div style={{
              position:'relative', width: 200, height: 200, borderRadius:'50%',
              background:'var(--glass)', border:'1px solid var(--glass-edge)',
              backdropFilter:'blur(20px)',
              display:'grid', placeItems:'center', overflow:'hidden'
            }}>
              <Headshot name={d.name} hue={d.hue} size={170}/>
            </div>
          </div>

          {/* Audio bars */}
          <div className={`vc-bars ${mute?'muted':''}`} style={{color:'var(--accent)', height:48, gap:5}}>
            {Array.from({length:7}).map((_,i)=><span key={i}/>)}
          </div>

          <div className="tiny" style={{color:'var(--ink-3)', maxWidth:380, textAlign:'center'}}>
            {mute ? 'Your mic is muted — Dr. Jenkins can\'t hear you.' :
             paused ? 'Call paused. Audio is held.' :
             'Audio is clear · 124 kbps · 24ms latency'}
          </div>

          {/* Controls */}
          <div className="row gap-3" style={{marginTop: 4}}>
            <button onClick={() => setMute(!mute)}
              style={{
                width:60, height:60, borderRadius:'50%', cursor:'pointer',
                background: mute ? 'var(--bad)' : 'var(--glass)', color: mute ? '#fff' : 'var(--ink)',
                border: mute ? '1px solid var(--bad)' : '1px solid var(--glass-edge)',
                display:'grid', placeItems:'center', transition:'all .2s ease'
              }} aria-label={mute?'Unmute':'Mute'}>
              <I.mute size={20}/>
            </button>
            <button onClick={() => setSpeaker(!speaker)}
              style={{
                width:60, height:60, borderRadius:'50%', cursor:'pointer',
                background: speaker ? 'var(--accent)' : 'var(--glass)', color: speaker ? 'var(--accent-ink)' : 'var(--ink)',
                border: speaker ? '1px solid var(--accent)' : '1px solid var(--glass-edge)',
                display:'grid', placeItems:'center', transition:'all .2s ease'
              }} aria-label="Speaker">
              <I.speaker size={20}/>
            </button>
            <button onClick={() => setPaused(!paused)}
              style={{
                width:60, height:60, borderRadius:'50%', cursor:'pointer',
                background: 'var(--glass)', color: 'var(--ink)',
                border: '1px solid var(--glass-edge)',
                display:'grid', placeItems:'center'
              }} aria-label={paused?'Resume':'Pause'}>
              <I.pause size={20}/>
            </button>
            <button onClick={() => go('confirm', { docId:'d1', day:0, slot:`${mm}:${ss} ended`, mode:'Voice' })}
              style={{
                width:80, height:60, borderRadius: 30, cursor:'pointer',
                background:'var(--bad)', color:'#fff', border:0,
                display:'grid', placeItems:'center',
                boxShadow:'0 12px 28px -4px color-mix(in oklab, #ef4444 60%, transparent)'
              }} aria-label="End call">
              <I.phoneOff size={22}/>
            </button>
          </div>
        </div>

        {/* SIDE PANEL — AI transcript + actions */}
        <div className="col gap-4">
          <div className="glass" style={{padding:22, flex:1, display:'flex', flexDirection:'column', minHeight:280}}>
            <div className="row between" style={{marginBottom:14}}>
              <div className="row gap-2">
                <div style={{color:'var(--accent)'}}><I.sparkle size={16}/></div>
                <div className="eyebrow">Live transcript</div>
              </div>
              <Pill variant="good"><span className="dot" style={{background:'var(--good)'}}/>Recording</Pill>
            </div>
            <div className="col gap-3" style={{flex:1, overflowY:'auto', paddingRight:4}}>
              {transcript.map((t,i) => (
                <div key={i} className={`row gap-2`} style={{alignItems:'flex-start'}}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background: t.who==='doctor' ? `linear-gradient(135deg, hsl(${d.hue} 65% 65%), hsl(${(d.hue+50)%360} 60% 45%))` : 'linear-gradient(135deg, hsl(210 65% 65%), hsl(250 60% 45%))',
                    display:'grid', placeItems:'center', color:'#fff', fontSize:11, fontWeight:600
                  }}>{t.who==='doctor'?'SJ':'A'}</div>
                  <div className="col grow" style={{gap:2}}>
                    <div className="row gap-2">
                      <span style={{fontSize:12, fontWeight:600}}>{t.who==='doctor' ? 'Dr. Jenkins' : 'You'}</span>
                      <span className="tiny mono tnum">{String(Math.floor(t.ts/60)).padStart(2,'0')}:{String(t.ts%60).padStart(2,'0')}</span>
                    </div>
                    <div style={{fontSize:13.5, lineHeight:1.45}}>{t.t}</div>
                  </div>
                </div>
              ))}
              {!paused && (
                <div className="row gap-2" style={{alignItems:'center', color:'var(--ink-3)', marginTop:4}}>
                  <span className="vc-bars" style={{color:'var(--ink-3)', height:14, gap:2}}>
                    <span style={{width:2}}/><span style={{width:2}}/><span style={{width:2}}/>
                  </span>
                  <span className="tiny" style={{fontStyle:'italic'}}>transcribing…</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass" style={{padding:22}}>
            <div className="eyebrow" style={{marginBottom:12}}>Quick actions</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <Btn variant="glass" size="sm" icon={<I.doc size={13}/>}>Share record</Btn>
              <Btn variant="glass" size="sm" icon={<I.pill size={13}/>}>Send Rx</Btn>
              <Btn variant="glass" size="sm" icon={<I.cal size={13}/>}>Schedule follow-up</Btn>
              <Btn variant="glass" size="sm" icon={<I.activity size={13}/>}>Order labs</Btn>
            </div>
            <hr className="hr" style={{margin:'14px 0'}}/>
            <div className="row gap-3">
              <div style={{color:'var(--accent)'}}><I.sparkle size={18}/></div>
              <div className="grow">
                <div style={{fontWeight:600, fontSize:13}}>AI summary so far</div>
                <div className="small" style={{fontSize:12.5, marginTop:4}}>
                  Patient reports central chest pressure post-caffeine, no radiation. No prior cardiac history.
                  Recommend EKG and lipid panel before next visit.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px){ .vc-grid{ grid-template-columns: 1fr !important; } }
        .force-mobile .vc-grid{ grid-template-columns: 1fr !important; }
      `}</style>
    </div>
  );
}

window.VoiceCallScene = VoiceCallScene;
