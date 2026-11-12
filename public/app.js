const socket=io({reconnection:true});
const el=document.getElementById('screen');
const status=document.getElementById('connection');
let state=null,session=null,joining=false,leaving=false,toastTimeout;
let soundOn=localStorage.getItem('cdSound')==='on',audioCtx=null,clockInterval=null;
function sound(kind='tap'){if(!soundOn)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=audioCtx||new AC();audioCtx.resume();const now=audioCtx.currentTime;const presets={tap:[540],correct:[523,659,784],win:[523,659,784,1047],lose:[330,262,196],turn:[392,523],twist:[370,440,554],finish:[523,784,1047]};const notes=presets[kind]||presets.tap;notes.forEach((n,i)=>{const osc=audioCtx.createOscillator(),vol=audioCtx.createGain(),at=now+i*.115;osc.type=kind==='lose'?'triangle':'sine';osc.frequency.setValueAtTime(n,at);vol.gain.setValueAtTime(.0001,at);vol.gain.exponentialRampToValueAtTime(.08,at+.018);vol.gain.exponentialRampToValueAtTime(.0001,at+.19);osc.connect(vol).connect(audioCtx.destination);osc.start(at);osc.stop(at+.21);});}catch{}}
function syncSoundButton(){const b=qs('#soundToggle');if(b){b.textContent=soundOn?'🔊 Sound on':'🔇 Sound off';b.setAttribute('aria-pressed',String(soundOn));}}
// Questions and challenges stay on screen until both players submit.
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qs=(q)=>document.querySelector(q);
const roomFromUrl=(new URLSearchParams(location.search).get('room')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,6).toUpperCase();
function notice(text){const t=qs('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),3300)}
function emit(event,data={}){return new Promise(resolve=>socket.timeout(9000).emit(event,data,(err,res)=>resolve(err?{ok:false,error:'Connection timed out. Try again.'}:res)))}
function remember(code,token,name){session={code,token,name};localStorage.setItem('sipSession',JSON.stringify(session));history.replaceState({},'',`/?room=${code}`)}
function returnHome(message){stopRaceUI();localStorage.removeItem('sipSession');session=null;state=null;history.replaceState({},'','/');renderHome();updateLeaveButton();updatePauseUI();if(message)notice(message)}
async function forget(){
 if(leaving)return;
 leaving=true;
 // Forget locally first, so even a disconnected server can't trap you.
 localStorage.removeItem('sipSession');session=null;
 const result=socket.connected?await emit('leave'):null;
 leaving=false;
 returnHome(result?.ok===false?'Left on this device. The server may need to reconnect.':null);
}
function updateLeaveButton(){let button=qs('#leaveAny');if(button)button.hidden=!state;}
function updatePauseUI(){
 const active=!!state&&['playing','reveal'].includes(state.phase);
 const button=qs('#pauseAny'),overlay=qs('#pauseOverlay');
 if(button){button.hidden=!active;button.textContent=state?.paused?'▶ Resume':'⏸ Pause';button.setAttribute('aria-pressed',String(!!state?.paused));}
 if(overlay)overlay.hidden=!active||!state?.paused;
 const msg=qs('#pauseMessage');if(msg&&state?.paused)msg.textContent=`${state.pausedBy||'A player'} paused the game. Clocks, racing, and turns are frozen until either player resumes.`;
}
async function togglePause(){if(!state||!['playing','reveal'].includes(state.phase))return;const x=await emit(state.paused?'resume':'pause');if(!x.ok)notice(x.error);}


function nameValue(){return (qs('#nickname')?.value||localStorage.getItem('sipName')||'Player').trim().slice(0,20)||'Player'}
function renderHome(){document.body.dataset.mode="home";el.innerHTML=`<section class="landing"><div class="home-art" role="img" aria-label="CoupleDuels fantasy arcade artwork"></div><div class="eyebrow">TWO PHONES · ONE CHAOTIC DUO</div><h1>LOVE IS A <em>GAME.</em><br>PLAY IT.</h1><p>11 games. Two phones. Your own private arcade.</p><div class="hero-chip">⚡ Chaos · 💘 Compatibility · ⚔️ Battle · 📖 Story · 🏎️ Racing</div><div class="panel"><label>Your nickname</label><input id="nickname" maxlength="20" placeholder="Your name" value="${safe(localStorage.getItem('sipName')||'')}"><button id="create" class="primary">CREATE A ROOM <span>↗</span></button><div class="separator"><span>or join your partner</span></div><input id="roomInput" maxlength="6" placeholder="6-character room code" value="${safe(roomFromUrl)}" autocomplete="off"><button id="join" class="secondary">JOIN ROOM</button></div><p class="fine">No accounts · Android + iPhone · Optional sips, never required</p></section>`;
 qs('#create').onclick=async()=>{const name=nameValue();localStorage.setItem('sipName',name);const r=await emit('create',{name});if(r.ok)remember(r.code,r.token,name);else notice(r.error)};
 qs('#join').onclick=async()=>{const name=nameValue(),code=qs('#roomInput').value.trim().toUpperCase();if(!/^[A-F0-9]{6}$/.test(code))return notice('Enter a valid 6-character room code.');localStorage.setItem('sipName',name);const r=await emit('join',{code,name});if(r.ok)remember(r.code,r.token,name);else notice(r.error)};
}
function playersHtml(){return `<div class="people">${state.players.map(p=>`<div class="person"><strong>${safe(p.name)} ${p.id===state.youId?'(you)':''}</strong><small>${p.connected?'🟢 Connected':'⚪ Offline'} ${p.id===state.hostId?'· Host':''}</small><br><b>${p.score}</b> <small>pts</small></div>`).join('')}${state.players.length<2?'<div class="person"><strong>Waiting for player 2…</strong><small>Scan the QR to join</small></div>':''}</div>`}
function root(content){el.innerHTML=`<section class="gameview">${content}</section>`}
function renderLobby(){const url=`${location.origin}/?room=${state.code}`,qr=`/api/qr?url=${encodeURIComponent(url)}`,host=state.youId===state.hostId;
 root(`<div class="eyebrow">✦ YOUR PRIVATE GAME ROOM</div><h2 class="h2">Pick your adventure.</h2><p>Have your partner scan this code with their phone camera.</p><div class="panel"><div class="kicker" style="text-align:center">ROOM CODE</div><div class="roomcode">${safe(state.code)}</div><img class="qr" src="${qr}" alt="QR code to join this room"><button class="secondary" id="copy">COPY INVITE LINK ⎘</button>${playersHtml()}<div class="mode-select"><div class="kicker">CHOOSE YOUR GAME MODE</div><button class="mode-card ${state.mode==='rapid'?'active':''}" data-mode="rapid" ${host?'':'disabled'}><strong>⚡ Rapid-Fire Chaos</strong><small>4 chapters · 4 questions then 1 surprise challenge · no timers.</small></button><button class="mode-card ${state.mode==='compatibility'?'active':''}" data-mode="compatibility" ${host?'':'disabled'}><strong>💘 Couples Compatibility</strong><small>10 self-answers + 5 partner predictions · 50-question pool.</small></button><button class="mode-card ${state.mode==='sipbattle'?'active':''}" data-mode="sipbattle" ${host?'':'disabled'}><strong>⚔️ SipBattle</strong><small>Choose from 7 allies, unlock upgrades and unleash specials.</small></button><button class="mode-card ${state.mode==='race'?'active':''}" data-mode="race" ${host?'':'disabled'}><strong>🏎️ Kart Clash <span class="new-chip">NEW</span></strong><small>5 drivers · 5 maps · steer, dodge and use nitro on both phones!</small></button><button class="mode-card ${state.mode==='story'?'active':''}" data-mode="story" ${host?'':'disabled'}><strong>📖 Create Story <span class="new-chip">NEW</span></strong><small>5 chapters, 45-second turns, 4–6 exchanges before each twist. No winner.</small></button><button class="mode-card ${state.mode==='mindmeld'?'active':''}" data-mode="mindmeld" ${host?'':'disabled'}><strong>🧠 Mind Meld <span class="new-chip">NEW</span></strong><small>7 secret choices. Can you both think of the same thing?</small></button><button class="mode-card ${state.mode==='emojirush'?'active':''}" data-mode="emojirush" ${host?'':'disabled'}><strong>🧩 Emoji Rush <span class="new-chip">NEW</span></strong><small>8 emoji puzzles. Decode movies, phrases and pop culture!</small></button><button class="mode-card ${state.mode==='tapduel'?'active':''}" data-mode="tapduel" ${host?'':'disabled'}><strong>⚡ Tap Duel <span class="new-chip">NEW</span></strong><small>Five fast reaction heats. Wait for GO, then tap!</small></button><button class="mode-card ${state.mode==='distorted'?'active':''}" data-mode="distorted" ${host?'':'disabled'}><strong>🔍 Distorted Guess <span class="new-chip">NEW</span></strong><small>Eight blurred visual riddles. Guess the image!</small></button><button class="mode-card ${state.mode==='quickdraw'?'active':''}" data-mode="quickdraw" ${host?'':'disabled'}><strong>🎯 Quick Draw Duel <span class="new-chip">NEW</span></strong><small>Wait for DRAW! False starts cost the heat.</small></button><button class="mode-card ${state.mode==='memory'?'active':''}" data-mode="memory" ${host?'':'disabled'}><strong>🃏 Memory Heist <span class="new-chip">NEW</span></strong><small>Memorize the illustrated card before it vanishes.</small></button></div>${host?`<button class="primary" id="start" ${state.players.length!==2||!state.players.every(p=>p.connected)?'disabled':''}>START THE GAME <span>↗</span></button>`:'<div class="info">Waiting for host to start the game…</div>'}<button class="link" id="leave">Leave room</button></div><div class="sip">🥤 Optional drinking rule: celebrate a match with a small sip, water, or a snack. Skipping is always okay.</div>`);
 document.querySelectorAll('.mode-card').forEach(b=>{const names={rapid:'rapid',compatibility:'compat',sipbattle:'battle',story:'story',race:'race',emojirush:'distorted',distorted:'distorted',quickdraw:'quickdraw',memory:'memory',tapduel:'quickdraw',mindmeld:'compat'};const pic=names[b.dataset.mode];if(pic){const thumb=document.createElement('img');thumb.src='/art/mode-'+pic+'.webp';thumb.alt='';thumb.className='mode-art';b.prepend(thumb);}});
 qs('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);notice('Invite link copied!')}catch{notice(url)}};
 if(host)document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=async()=>{const r=await emit('mode',{mode:b.dataset.mode});if(!r.ok)notice(r.error)});
 if(host)qs('#start').onclick=async()=>{const r=await emit('start');if(!r.ok)notice(r.error)};
 qs('#leave').onclick=forget;
}
function pictureFor(title,kind){const x=String(title||'').toLowerCase();let name='spark';if(/commercial|news|movie|camera|concert|show|sing|acting|report|interview|voice/.test(x))name='spotlight';else if(/food|pizza|fries|snack|restaurant|cook|dessert|breakfast/.test(x))name='snack';else if(/secret|mystery|guess|know|truth|surprise|detective/.test(x))name='mystery';else if(/love|date|romantic|partner|kiss|relationship|couple/.test(x))name='heart';else if(/battle|weapon|attack|hero|sword/.test(x))name='battle';return `<div class="question-picture"><img src="/art/${name}.svg" alt="Decorative ${name} illustration" loading="lazy"></div>`;}
function stageTitle(i){return ['ROUND 1 · WARM UP','ROUND 2 · GET SILLY','ROUND 3 · PURE CHAOS','ROUND 4 · GRAND FINALE'][Math.floor(i/5)]||'FINALE'}
function revealLabel(p){const r=state.round;if(r.type==='challenge')return 'Challenge complete ✓';const answer=p.answer;if(answer==null)return '—';if(r.type==='vote'){const person=p.answer===0?p:state.players.find(x=>x.id!==p.id);return person?.name||'—'}return r.choices[answer]||'—'}
function answerName(answer,choices){return answer===null||answer===undefined?'No answer':(choices[answer]||'No answer')}
function renderCompatibilityRound(){
 const r=state.round,me=state.players.find(p=>p.id===state.youId),partner=state.players.find(p=>p.id!==state.youId);
 const answered=!!me?.answered,reveal=state.phase==='reveal',self=r.type==='self';
 const subtitle=self?'PHASE 1 — ABOUT YOURSELF':'PHASE 2 — PREDICT YOUR PARTNER';
 let actions='';
 if(reveal){
  const results=state.reveal||[];
  const mine=results.find(p=>p.id===state.youId),theirs=results.find(p=>p.id!==state.youId);
  actions=`<div class="reveal compat-reveal"><h3>${mine?.correct?'✅ You knew it!':'💭 Did you guess right?'}</h3><p><b>${safe(partner?.name||'Partner')} actually chose:</b> ${safe(answerName(mine?.partnerAnswer,r.choices))}</p><p><b>Your guess:</b> ${safe(answerName(mine?.answer,r.choices))}</p><hr><p><b>Your answer earlier:</b> ${safe(answerName(mine?.actual,r.choices))}</p><p><b>${safe(partner?.name||'Partner')}'s guess for you:</b> ${safe(answerName(theirs?.answer,r.choices))} ${theirs?.correct?'✅':'❌'}</p></div><div class="info">Next question automatically in 5 seconds.</div>`;
 }else if(answered){actions=`<div class="reveal" style="text-align:center"><div style="font-size:36px">🔒</div><h3>ANSWER LOCKED!</h3><p>${self?'Saved privately. The other player cannot see it yet.':'Your guess stays hidden until the reveal.'}</p></div>`;}
 else actions=`<div class="choicegrid">${r.choices.map((choice,i)=>`<button class="choice" data-answer="${i}">${safe(choice)} <span>↗</span></button>`).join('')}</div>`;
 const n=state.roundIndex+1;
 root(`<div class="section-top"><div class="kicker">💘 COUPLES COMPATIBILITY</div><div class="round">${n} / 15 · <b>NO TIMER ♡</b></div></div><div class="progress"><div style="width:${n/15*100}%"></div></div><div class="stagechip">${safe(subtitle)}</div><div class="question">${pictureFor(r.title,"compat")}<div class="eyebrow">${self?'QUESTION '+n+' OF 10':'PREDICTION '+(n-10)+' OF 5'}</div><h2>${safe(r.title)}</h2><p class="hint">${self?'Pick YOUR real answer, not what your partner would say.':`What did ${safe(partner?.name||'your partner')} choose when answering this earlier?`}</p>${actions}</div>${playersHtml()}<p class="fine">${self?'Your original answers stay secret during the first 10 questions.':'Each correct partner prediction earns 1 point. 10 possible matches combined.'}</p>`);
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=async()=>{document.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);const x=await emit('answer',{answer:Number(b.dataset.answer)});if(!x.ok){notice(x.error);document.querySelectorAll('[data-answer]').forEach(y=>y.disabled=false)}});
}
function renderCompatibilityEnd(){
 const s=state.summary||{matches:0,possible:10,percent:0,individual:[],breakdown:[]},host=state.youId===state.hostId;
 const tagline=s.percent===100?'You two are reading each other’s minds!':s.percent>=70?'You know each other pretty well!':s.percent>=40?'Some surprises, some mind-reading.':'Looks like there are still mysteries to discover!';
 root(`<div class="gameover"><div class="emoji">💘</div><div class="eyebrow">COUPLES COMPATIBILITY RESULTS</div><h1>${s.percent}%</h1><p>${tagline}</p><div class="panel"><div class="kicker">${s.matches} / ${s.possible} CORRECT PREDICTIONS</div><div class="progress"><div style="width:${s.percent}%"></div></div><div class="people">${s.individual.map(p=>`<div class="person"><strong>${safe(p.name)}</strong><b>${p.correct}/5</b><small> partner answers guessed</small></div>`).join('')}</div></div><h2 class="h2" style="font-size:26px;text-align:left;margin-top:30px">See what you learned</h2><div class="compat-breakdown">${s.breakdown.map((item,i)=>`<details class="breakdown-item"><summary>${i+1}. ${safe(item.question)}</summary>${item.players.map(p=>{const other=item.players.find(o=>o.id!==p.id);return `<div class="breakdown-player"><strong>${safe(p.name)}:</strong> ${safe(answerName(p.selfAnswer,item.choices))}<p>${safe(other.name)} guessed: ${safe(answerName(other.guess,item.choices))} ${other.guess!==null&&other.guess===p.selfAnswer?'✅':'❌'}</p></div>`}).join('')}</details>`).join('')}</div><div class="panel" style="margin-top:20px"><p>Compatibility is a playful quiz score, not a scientific relationship test.</p>${host?'<button class="primary" id="restart">PLAY AGAIN <span>↗</span></button>':'<div class="info">Waiting for host to choose a rematch…</div>'}<button class="link" id="leave">Leave room</button></div></div>`);
 qs('#restart')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});qs('#leave').onclick=forget;
}
function renderRound(){const r=state.round,me=state.players.find(p=>p.id===state.youId),answered=!!me?.answered,reveal=state.phase==='reveal',host=state.youId===state.hostId;
 
 let actions='';
 if(reveal){const votes=state.reveal||[];const both=votes.length===2&&votes.every(v=>v.answer!==null);const matched=both&&(r.type==='challenge'||(r.type==='match'&&votes[0]?.answer===votes[1]?.answer)||(r.type==='vote'&&votes.length===2&&((votes[0].answer===0?votes[0].id:votes[1].id)===(votes[1].answer===0?votes[1].id:votes[0].id))));
 actions=`<div class="reveal"><div class="kicker">${matched?'✨ IT’S A MATCH!':'🎭 THE REVEAL'}</div>${votes.map(v=>`<p><b>${safe(v.name)}:</b> ${safe(revealLabel(v))}</p>`).join('')}<p>${matched?(r.type==='challenge'?'+1 point each!':'+2 points each!'):'No match this time. On to the next!'}</p></div><div class="info">Next round starts automatically ⚡</div>`;
 }else if(answered){actions=`<div class="reveal" style="text-align:center"><div style="font-size:40px">🔒</div><h2>LOCKED IN!</h2><p>Your choice is secret until both players submit.</p></div>`;
 }else if(r.type==='challenge'){actions='<button class="primary" id="done">WE DID IT! ✓ <span>↗</span></button>'}
 else{actions=`<div class="choicegrid">${r.choices.map((v,i)=>`<button class="choice" data-answer="${i}">${safe(v)}<span>↗</span></button>`).join('')}</div>`}
 root(`<div class="section-top"><div class="kicker">${stageTitle(state.roundIndex)}</div><div class="round">ROUND ${r.number} / 20 · <b>NO TIMER ♡</b></div></div><div class="progress"><div style="width:${(r.number/20)*100}%"></div></div><div class="stagechip">${['💞 WARMUP','🤭 PLAYFUL','🎭 CHAOS'][r.stage-1]} · STAGE ${r.stage}</div><div class="question">${pictureFor(r.title,r.type)}<div class="eyebrow">${r.type==='vote'?'SECRET VOTE':r.type==='match'?'SYNC YOUR MINDS':'DUO CHALLENGE'}</div><h2>${safe(r.title)}</h2><p class="hint">${safe(r.prompt)}</p>${actions}</div>${playersHtml()}<p class="fine">Take your time · both players finish before moving on · no alcohol penalties</p>`);

 qs('#done')?.addEventListener('click',async()=>{const x=await emit('answer',{answer:'done'});if(!x.ok)notice(x.error)});
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=async()=>{document.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);const x=await emit('answer',{answer:Number(b.dataset.answer)});if(!x.ok){notice(x.error);document.querySelectorAll('[data-answer]').forEach(y=>y.disabled=false)}});
}
function renderEnd(){const p=state.players.slice().sort((a,b)=>b.score-a.score),tie=p[0].score===p[1].score,host=state.youId===state.hostId;
 root(`<div class="gameover"><div class="emoji">🏆</div><div class="eyebrow">ALL 20 ROUNDS COMPLETE</div><h1>${tie?'PERFECT DUO!':'WE HAVE A WINNER!'}</h1><p>${tie?'It’s a tie. The power couple wins.':`${safe(p[0].name)} takes the crown!`}</p>${playersHtml()}<div class="panel"><h2 class="h2">Your night, your story.</h2><p>Rematch, switch nicknames, or invent your own bonus round. Optional sips stay optional.</p>${host?'<button class="primary" id="restart">PLAY AGAIN <span>↗</span></button>':'<div class="info">Waiting for host to choose a rematch…</div>'}<button class="link" id="leave">Leave room</button></div></div>`);
 qs('#restart')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});qs('#leave').onclick=forget;
}

// SipBattle client state: targets are local UI selection only. The server checks every move.
let battleAllyChoices=[],battleActor='hero',battleTarget='hero';
async function battleSend(event,data={}){const r=await emit('battle:'+event,data);if(!r.ok)notice(r.error)}
function hpBar(u){const pct=Math.max(0,Math.round(100*u.hp/u.maxHp));return `<div class="hp"><div style="width:${pct}%"></div></div><small>${u.hp}/${u.maxHp} HP · ⚔️ ${u.attack}</small>`}
function renderBattle(){const b=state.battle;if(!b)return root('<p>Loading battle...</p>');
 const me=b.teams.find(t=>t.id===state.youId),op=b.teams.find(t=>t.id!==state.youId),myTurn=b.turnPlayerId===state.youId;
 const header=`<div class="eyebrow">⚔️ SIPBATTLE · ${safe(b.stage.toUpperCase())}</div><h2 class="h2">${b.stage==='draft'?'Build your squad':b.stage==='shop'?'Power up your hero':b.stage==='fight'?'BATTLE ARENA':'THE FINAL HIT'}</h2><p>${b.stage==='draft'?'Your own hero is automatic. Choose two more characters.':b.stage==='shop'?'Earn power points with a tap (a sip is optional). Buy upgrades costing 1–5 points.':b.stage==='fight'?'Choose one of your living characters and one enemy, then attack!':'The battle is over.'}</p>`;
 let body='';
 if(b.stage==='draft'){
  if(!battleAllyChoices.length&&me.selected.length)battleAllyChoices=[...me.selected];
  const chosen=battleAllyChoices;
  body=`<div class="panel"><div class="kicker">⭐ YOUR MAIN HERO</div><div class="battle-card"><span class="hero-portrait"><img src="/art/hero-hero.webp" alt="Main hero"></span>${safe(me.name)} · 65 HP · 10 ATK</div><p>Pick exactly two allies:</p><div class="battle-grid">${b.allies.map(a=>`<button class="battle-card ${chosen.includes(a.id)?'picked':''}" data-ally="${a.id}" ${me.locked?'disabled':''}><span class="hero-portrait"><img src="/art/hero-${safe(a.id)}.webp" alt="${safe(a.name)} character portrait" loading="lazy"></span><strong>${safe(a.name)}</strong><small>${a.hp} HP · ${a.attack} ATK</small><small>${safe(a.skill)}</small></button>`).join('')}</div><button class="primary" id="battleReady" ${me.locked||chosen.length!==2?'disabled':''}>${me.locked?'WAITING FOR PARTNER…':'LOCK IN MY TEAM ↗'}</button><p class="fine">${op.locked?'Opponent is ready':'Opponent is selecting allies'} · ${me.locked?'Your team is locked':'Your team is not locked'}</p></div>`;
 }else if(b.stage==='shop'){
  body=`<div class="panel"><div class="battle-stats"><div><small>AVAILABLE</small><strong>${me.points} ✨</strong></div><div><small>EARNED</small><strong>${me.earned}/5</strong></div><div><small>SPENT</small><strong>${me.spent}</strong></div></div><button class="secondary" id="claim" ${me.earned>=5||me.locked?'disabled':''}>+ 1 POWER POINT ${me.earned>=5?'(MAX)':''}</button><p class="fine">Optional sip, water, or no sip — each earns the same point. Maximum 5 per player; no drinking required.</p><div class="kicker" style="margin-top:24px">UPGRADE STORE</div>${b.upgrades.map(u=>`<button class="shop-item" data-buy="${u.id}" ${me.locked||me.points<u.cost||(me.upgrades[u.id]||0)>=u.max?'disabled':''}><div><strong>${safe(u.name)} </strong><small>${safe(u.desc)} · ${me.upgrades[u.id]||0}/${u.max}</small></div><b>${u.cost} ✨</b></button>`).join('')}<button id="shopReady" class="primary" ${me.locked?'disabled':''}>${me.locked?'WAITING FOR PARTNER…':'READY TO FIGHT ⚔️'}</button><p class="fine">${op.locked?'Opponent is ready':'Opponent is shopping'}</p></div>`;
 }else if(b.stage==='fight'){
  const actor=me.units.find(u=>u.id===battleActor&&u.hp>0)||me.units.find(u=>u.hp>0),target=op.units.find(u=>u.id===battleTarget&&u.hp>0)||op.units.find(u=>u.hp>0);
  battleActor=actor?.id||'hero';battleTarget=target?.id||'hero';
  body=`<div class="stagechip">${myTurn?'🟢 YOUR TURN':'⏳ OPPONENT TURN'} · TURN ${b.turnCount+1}</div><div class="battle-panel"><div class="kicker">YOUR TEAM — SELECT ATTACKER</div><div class="battle-grid">${me.units.map(u=>`<button class="battle-card ${battleActor===u.id?'picked':''}" data-actor="${u.id}" ${u.hp<=0?'disabled':''}><span class="hero-portrait"><img src="/art/hero-${safe(u.id)}.webp" alt="${safe(u.name)} character portrait" loading="lazy"></span><strong>${safe(u.name)}</strong>${hpBar(u)}</button>`).join('')}</div><div class="kicker" style="margin-top:18px">ENEMY TEAM — SELECT TARGET</div><div class="battle-grid">${op.units.map(u=>`<button class="battle-card enemy ${battleTarget===u.id?'picked':''}" data-target="${u.id}" ${u.hp<=0?'disabled':''}><span class="hero-portrait"><img src="/art/hero-${safe(u.id)}.webp" alt="${safe(u.name)} character portrait" loading="lazy"></span><strong>${safe(u.name)}</strong>${hpBar(u)}</button>`).join('')}</div><div class="battle-actions"><button data-move="attack" ${myTurn?'':'disabled'}>⚔️ ATTACK</button><button data-move="skill" ${myTurn?'':'disabled'}>✨ SPECIAL</button><button data-move="guard" ${myTurn?'':'disabled'}>🛡️ GUARD</button></div><p class="fine">${safe(actor?.skill||'Special')} · Guard halves the next hit. Medic heals your weakest living ally; Bard boosts attack.</p></div>`;
 }else if(b.stage==='finished'){
  const winner=b.winner?b.teams.find(t=>t.id===b.winner):null;
  body=`<div class="panel gameover"><div class="emoji">${b.winner===state.youId?'🏆':b.winner?'💥':'🤝'}</div><h2 class="h2">${winner?safe(winner.name)+' WINS!':'DRAW!'}</h2><p>Match finished. The loser can take an optional small sip or choose a fun forfeit instead.</p>${playersHtml()}${state.youId===state.hostId?'<button class="primary" id="restart">REMATCH ↗</button>':'<div class="info">Waiting for host to rematch…</div>'}<button class="link" id="leave">Leave room</button></div>`;
 }
 const log=b.log.length?`<div class="battle-log"><div class="kicker">BATTLE FEED</div>${b.log.slice().reverse().map(x=>`<p>${safe(x)}</p>`).join('')}</div>`:'';
 root(header+body+log);
 if(b.stage==='draft'){
  document.querySelectorAll('[data-ally]').forEach(btn=>btn.onclick=()=>{let choices=battleAllyChoices.slice();const id=btn.dataset.ally;if(choices.includes(id))choices=choices.filter(x=>x!==id);else if(choices.length<2)choices.push(id);battleAllyChoices=choices; // save selection only when exactly two
   if(choices.length===2)battleSend('select',{allies:choices});else renderBattleDraftLocal(choices);
  });
  qs('#battleReady')?.addEventListener('click',()=>battleSend('ready'));
 }else if(b.stage==='shop'){
  qs('#claim')?.addEventListener('click',()=>battleSend('claim'));
  document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>battleSend('buy',{upgrade:btn.dataset.buy}));
  qs('#shopReady')?.addEventListener('click',()=>battleSend('shopready'));
 }else if(b.stage==='fight'){
  document.querySelectorAll('[data-actor]').forEach(btn=>btn.onclick=()=>{battleActor=btn.dataset.actor;renderBattle()});
  document.querySelectorAll('[data-target]').forEach(btn=>btn.onclick=()=>{battleTarget=btn.dataset.target;renderBattle()});
  document.querySelectorAll('[data-move]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-move]').forEach(x=>x.disabled=true);battleSend('move',{actor:battleActor,target:battleTarget,move:btn.dataset.move})});
 }else{qs('#restart')?.addEventListener('click',()=>battleSendRestart());qs('#leave')?.addEventListener('click',forget)}
}
function renderBattleDraftLocal(choices){document.querySelectorAll('[data-ally]').forEach(b=>b.classList.toggle('picked',choices.includes(b.dataset.ally)));const ready=qs('#battleReady');if(ready)ready.disabled=choices.length!==2;}
async function battleSendRestart(){const r=await emit('restart');if(!r.ok)notice(r.error);else{battleAllyChoices=[];battleActor='hero';battleTarget='hero';}}
function renderStory(){const b=state.story;if(!b)return root('<p>Loading your story…</p>');const isHost=state.youId===state.hostId;
 const isMine=b.turnPlayerId===state.youId,person=state.players.find(p=>p.id===b.turnPlayerId);document.body.dataset.chapter=String(b.round||1);let content='';
 if(b.stage==='finished'){
  content=`<div class="story-finish"><div class="story-illustration">📚 ✨</div><div class="eyebrow">THE END · CO-OP COMPLETE</div><h1>WHAT A STORY.</h1><p>You built a five-chapter adventure together. No score, no winner—just an absolutely ridiculous memory.</p><div class="story-timeline">${b.history.map((entry,i)=>`<div><span>${i+1}</span> ${safe(entry.name)} added to ${entry.round==='Ending'?'the finale':'chapter '+entry.round}</div>`).join('')}</div>${isHost?'<button class="primary" id="restart">WRITE ANOTHER STORY ✨</button>':'<div class="info">Waiting for your partner to start a new story…</div>'}</div>`;
 }else if(b.stage==='twist'){
  const ready=b.ready.includes(state.youId);
  content=`<div class="story-scene"><div class="story-illustration">${b.ending?'🏁':'🌪️'}</div><div class="eyebrow">${b.ending?'THE GRAND FINALE':'PLOT TWIST!'}</div><h2>${safe(b.prompt)}</h2><p>No timer on plot twists. Talk about it together, then continue when you're ready.</p><div class="story-coop">${state.players.map(p=>`<span>${b.ready.includes(p.id)?'✅':'⌛'} ${safe(p.name)}</span>`).join('')}</div><button class="primary" id="storyReady" ${ready?'disabled':''}>${ready?'WAITING FOR YOUR PARTNER…':'WE’RE READY — CONTINUE →'}</button></div>`;
 }else{
  content=`<div class="story-scene"><div class="story-illustration">${b.ending?'🌅':b.round===1?'🗝️':b.round===2?'🚀':b.round===3?'🎭':b.round===4?'🐉':'🌌'}</div><div class="eyebrow">${b.ending?'FINAL SCENE':`CHAPTER ${b.round} / 5`}</div><h2>${b.ending?(b.step===b.endingStart?'Start the ending!':'Finish the story!'):b.step===0?'Once upon a time…':`Keep the story going, ${safe(b.turnName)}!`}</h2>${b.step<2?`<div class="story-opening">${safe(b.opening)}</div>`:''}${!b.ending?`<div class="story-exchange">Exchange ${b.exchange} of ${b.exchangesInChapter} before the next twist</div>`:''}<div class="story-speaker">🎤 ${safe(b.turnName)} is telling the story</div><div class="countdown" id="storyClock">45</div><p>${isMine?'Say your part out loud. Tap Done early if you finish.':'Listen to your partner and get ready to add your next twist!'}</p>${isMine?'<button class="primary" id="storyDone">DONE SPEAKING ✓</button>':'<div class="info">Their turn ends automatically after 45 seconds.</div>'}</div>`;
 }
 root(`<div class="section-top"><div class="kicker">📖 CREATE STORY</div><div class="round">${b.stage==='finished'?'COMPLETE':b.ending?'ENDING':`CHAPTER ${b.round} OF 5`}</div></div><div class="progress"><div style="width:${Math.min(100,b.step/b.totalTurns*100)}%"></div></div>${content}${b.stage!=='finished'?'<div class="story-rule">🎭 Speak out loud, take turns, and build on whatever your partner says. There is no scoring in this mode.</div>':''}`);
 if(b.stage==='turn'){const update=()=>{const e=qs('#storyClock');if(!e||!state?.story||state.paused||state.story.stage!=='turn')return;const left=Math.max(0,Math.ceil((state.story.deadline-Date.now())/1000));e.textContent=left;e.classList.toggle('urgent',left<=7)};update();clearInterval(clockInterval);clockInterval=setInterval(update,200);}
 qs('#storyDone')?.addEventListener('click',async()=>{sound('tap');const x=await emit('story:done');if(!x.ok)notice(x.error)});
 qs('#storyReady')?.addEventListener('click',async()=>{sound('tap');const x=await emit('story:ready');if(!x.ok)notice(x.error)});
 qs('#restart')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});
}

// Kart Clash: live 2-player top-down racing, synchronized by the room server.
let tiltEnabled=false,tiltNeutral=null,tiltValue=0;
function onTilt(e){if(!tiltEnabled)return;const angle=screen.orientation?.angle||window.orientation||0;const reading=(Math.abs(angle)===90?e.beta:e.gamma);if(!Number.isFinite(reading))return;if(tiltNeutral===null)tiltNeutral=reading;tiltValue=Math.max(-1,Math.min(1,(reading-tiltNeutral)/28));}
async function enableTilt(){if(!('DeviceOrientationEvent'in window)){notice('No motion sensor available; use the buttons.');return;}try{if(typeof DeviceOrientationEvent.requestPermission==='function'){const res=await DeviceOrientationEvent.requestPermission();if(res!=='granted'){notice('Motion access not granted. Use touch steering.');return;}}tiltEnabled=true;tiltNeutral=null;window.addEventListener('deviceorientation',onTilt);notice('Tilt steering enabled! Hold phone sideways and tap Recenter.');qs('#motionToggle')?.setAttribute('aria-pressed','true');}catch{notice('Motion steering unavailable. Use buttons.')}}
let raceControls={left:false,right:false,boost:false},raceCanvasRunning=false,raceDrawFrame=0,raceInputTimer=null,lastRaceStage=null;
function stopRaceUI(){tiltEnabled=false;tiltNeutral=null;tiltValue=0;window.removeEventListener('deviceorientation',onTilt);if(raceDrawFrame)cancelAnimationFrame(raceDrawFrame);raceDrawFrame=0;raceCanvasRunning=false;if(raceInputTimer)clearInterval(raceInputTimer);raceInputTimer=null;raceControls={left:false,right:false,boost:false};}
function raceSendInput(){if(!state||state.paused||state.mode!=='race'||!['racing','countdown'].includes(state.race?.stage))return;socket.emit('race:input',{steer:raceControls.left||raceControls.right?Number(raceControls.right)-Number(raceControls.left):(tiltEnabled?tiltValue:0),boost:raceControls.boost});}
function racerCanvas(){
 const canvas=qs('#raceCanvas');if(!canvas||!state?.race||!['racing','countdown'].includes(state.race.stage))return;
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,r=state.race,track=r.tracks.find(t=>t.id===r.trackId),me=r.players.find(p=>p.id===state.youId),enemy=r.players.find(p=>p.id!==state.youId);
 if(!me||!track)return;
 const themes={candy:{land:['#fe9cc5','#ee88bd'],road:'#77618e',stripe:'#fff0b3',edge:'#ffebf5',items:['🍬','🍭','🧁'],sky:'#d55fa0'},neon:{land:['#111e44','#1a285b'],road:'#32365e',stripe:'#5effe3',edge:'#f66cdd',items:['🌆','💡','🌴'],sky:'#161334'},desert:{land:['#dfa85f','#e6ba74'],road:'#8e7769',stripe:'#ffe4ac',edge:'#f5c88c',items:['🌵','🪨','🌴'],sky:'#e8a55e'},snow:{land:['#e8f8ff','#c4eafa'],road:'#8b9cbb',stripe:'#f8fdff',edge:'#d8ffff',items:['🌲','⛄','❄️'],sky:'#87c6e6'},space:{land:['#111029','#241443'],road:'#39375e',stripe:'#90fffe',edge:'#dc8dff',items:['🪐','👾','⭐'],sky:'#100c2b'}};
 const t=themes[track.theme],cam=me.distance,pxPerMeter=2.9,roadHalf=104;
 function center(d){return w/2+Math.sin(d/55)*track.curves*95+Math.sin(d/130)*track.curves*27;}
 function yFor(d){return h*.75+(cam-d)*pxPerMeter;}
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,t.land[1]);sky.addColorStop(1,t.land[0]);ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 if(track.theme==='space'||track.theme==='neon'){
  for(let i=0;i<55;i++){const x=(i*173+53)%w,y=(i*83+11+Math.floor(cam*1.2))%h;ctx.globalAlpha=.16+(i%5)*.12;ctx.fillStyle=i%3===0?'#ffbdfb':'#ffffff';ctx.fillRect(x,y,i%6===0?3:1,i%6===0?3:1);}ctx.globalAlpha=1;
 }
 // Colorful scrolling terrain and a continuous, curved road with border lighting.
 for(let y=0;y<h;y+=3){const d=cam+(h*.75-y)/pxPerMeter,c=center(d),segment=Math.floor(d/14)%2;
  ctx.fillStyle=segment?t.land[0]:t.land[1];ctx.globalAlpha=.24;ctx.fillRect(0,y,w,3);ctx.globalAlpha=1;
  ctx.fillStyle='#16192c77';ctx.fillRect(c-roadHalf-17,y,roadHalf*2+34,3);
  ctx.fillStyle=t.edge;ctx.fillRect(c-roadHalf-12,y,roadHalf*2+24,3);
  ctx.fillStyle=t.road;ctx.fillRect(c-roadHalf,y,roadHalf*2,3);
  ctx.fillStyle=segment?'#ffffff55':'#ff5a8588';ctx.fillRect(c-roadHalf-9,y,8,3);ctx.fillRect(c+roadHalf+1,y,8,3);
  if(Math.floor(d/8)%2===0){ctx.globalAlpha=.75;ctx.fillStyle=t.stripe;ctx.fillRect(c-1.5,y,3,3);ctx.globalAlpha=1;}
  ctx.fillStyle='#ffffff0c';ctx.fillRect(c-roadHalf+20,y,2,3);ctx.fillRect(c+roadHalf-22,y,2,3);
 }
 // Roadside scenery is deterministic: both players see the same landscape.
 ctx.textAlign='center';ctx.textBaseline='middle';
 const start=Math.max(0,Math.floor((cam-60)/23)),end=Math.ceil((cam+210)/23);
 for(let i=start;i<=end;i++){const d=i*23+13,y=yFor(d);if(y< -30||y>h+45)continue;const x=center(d),icon=t.items[(i*7+3)%t.items.length];
  for(const side of [-1,1]){const offset=138+((i*19)%31),pos=x+side*offset;
   ctx.save();ctx.globalAlpha=Math.min(1,Math.max(.48,1-(Math.abs(y-h*.68)/h)*.3));ctx.shadowColor=track.theme==='neon'?'#52ffef':'#ffffff55';ctx.shadowBlur=track.theme==='neon'?12:0;ctx.font=`${24+i%3*2}px system-ui`;ctx.fillText(icon,pos,y);ctx.restore();
  }
 }
 // Chequered start and finish lines.
 for(const mark of [0,track.length]){const y=yFor(mark),x=center(mark);if(y>=-8&&y<=h+8){for(let k=0;k<16;k++){ctx.fillStyle=k%2===0?'#f9f9ff':'#1b1b32';ctx.fillRect(x-roadHalf+k*(roadHalf*2/16),y,roadHalf*2/16,9);}ctx.textAlign='center';ctx.font='900 12px system-ui';ctx.fillStyle='#fff';ctx.fillText(mark?'FINISH 🏁':'START',x,y-11);}}
 // Speed pads and hazards.
 for(const ob of r.obstacles){const y=yFor(ob.distance);if(y< -35||y>h+35)continue;const x=center(ob.distance)+ob.x*88;
  ctx.save();ctx.shadowColor=ob.type==='box'?'#70eeff':'#ff6d8e';ctx.shadowBlur=14;ctx.fillStyle=ob.type==='box'?'#84ffff77':'#ff779655';ctx.beginPath();ctx.ellipse(x,y+11,17,9,0,0,Math.PI*2);ctx.fill();ctx.font='27px system-ui';ctx.textAlign='center';ctx.fillText(ob.type==='box'?'❔':track.theme==='snow'?'🧊':track.theme==='desert'?'🪨':'🚧',x,y);ctx.restore();
 }
 // Original vector kart sprites: tires, chassis, hood, helmet, and highlights.
 function drawKart(p,ours){if(!p)return;const y=yFor(p.distance);if(y< -45||y>h+45)return;const c=r.characters.find(ch=>ch.id===p.character),x=center(p.distance)+p.x*88;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.max(-.12,Math.min(.12,(p.x||0)*.07)));
  ctx.shadowColor=ours?'#b2f6ff':'#ff91c4';ctx.shadowBlur=18;
  ctx.fillStyle='#101323';ctx.beginPath();ctx.ellipse(0,16,20,26,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#10131a';for(const tx of [-18,18])for(const ty of [-16,17]){ctx.beginPath();ctx.roundRect(tx-5,ty-9,10,17,4);ctx.fill();}
  const body=ctx.createLinearGradient(-15,-25,16,25);body.addColorStop(0,'#fff4f1');body.addColorStop(.28,c?.color||'#fc849e');body.addColorStop(1,c?.color||'#fc849e');ctx.fillStyle=body;ctx.beginPath();ctx.roundRect(-14,-27,28,53,10);ctx.fill();
  ctx.fillStyle='#20293f';ctx.beginPath();ctx.roundRect(-11,-9,22,22,8);ctx.fill();ctx.fillStyle='#d8f6ff';ctx.beginPath();ctx.roundRect(-9,-23,18,9,4);ctx.fill();
  ctx.fillStyle='#ffffff88';ctx.fillRect(-10,17,20,3);ctx.font='19px system-ui';ctx.textAlign='center';ctx.fillText(c?.emoji||'🏎️',0,4);
  if(p.speed>24){ctx.fillStyle='#70e7ff';ctx.beginPath();ctx.moveTo(-7,29);ctx.lineTo(-2,38+Math.random()*6);ctx.lineTo(2,29);ctx.moveTo(3,29);ctx.lineTo(8,40);ctx.lineTo(12,29);ctx.fill();}
  ctx.fillStyle='#10172c';ctx.fillRect(-21,-43,42,15);ctx.fillStyle=ours?'#acfff8':'#ffbcdf';ctx.font='900 10px system-ui';ctx.fillText(ours?'YOU':p.name.slice(0,8),0,-32);ctx.restore();
 }
 drawKart(enemy,false);drawKart(me,true);
 // Motion vignette and top lighting; track progress indicators.
 const vign=ctx.createLinearGradient(0,0,0,h);vign.addColorStop(0,'#080e2844');vign.addColorStop(.22,'#080e2800');vign.addColorStop(.88,'#080e2800');vign.addColorStop(1,'#080e2866');ctx.fillStyle=vign;ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#12182bdc';ctx.beginPath();ctx.roundRect(12,12,148,29,8);ctx.fill();ctx.font='800 12px system-ui';ctx.textAlign='left';ctx.fillStyle='#e7fff9';ctx.fillText(`${Math.round(me.speed*5)} KM/H  ·  ${Math.round(me.distance/track.length*100)}%`,21,31);
 const readout=qs('#raceReadout');if(readout)readout.textContent=`YOU ${Math.floor(me.distance/track.length*100)}% · RIVAL ${Math.floor(enemy.distance/track.length*100)}%`;
 const nitro=qs('#nitroFill');if(nitro)nitro.style.width=me.nitro+'%';const itemButton=qs('#raceItem');if(itemButton){itemButton.textContent=me.item?'USE ITEM: '+me.item.toUpperCase():'MYSTERY ITEM · EMPTY';itemButton.disabled=!me.item;}
 raceDrawFrame=requestAnimationFrame(racerCanvas);
}
function raceHold(selector,key){const b=qs(selector);if(!b)return;const change=(v,e)=>{e?.preventDefault();raceControls[key]=v;raceSendInput();};b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);change(true,e)});['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,e=>change(false,e)));}
function renderRace(){const r=state.race;if(!r)return root('<div class="info">Loading race…</div>');const host=state.youId===state.hostId,me=r.players.find(p=>p.id===state.youId),track=r.tracks.find(t=>t.id===r.trackId);
 let inner='';
 if(r.stage==='select'){
 inner=`<div class="panel"><div class="kicker">STEP 1 · PICK YOUR DRIVER</div><div class="race-characters">${r.characters.map(c=>`<button class="race-character ${me.character===c.id?'picked':''}" data-driver="${c.id}"><span>${c.emoji}</span><b>${safe(c.name)}</b><small>${safe(c.tag)}</small></button>`).join('')}</div><div class="kicker">STEP 2 · PICK A TRACK</div><div class="race-tracks">${r.tracks.map(t=>`<button class="race-track ${r.trackId===t.id?'picked':''}" data-track="${t.id}" ${host?'':'disabled'}><img class="track-art" src="/art/track-${t.id}.webp" alt="${safe(t.name)} track artwork"><b>${safe(t.name)}</b><small>${safe(t.description)}</small></button>`).join('')}</div><div class="race-status">${r.players.map(p=>`<span>${p.ready?'✅':'⏳'} ${safe(p.name)} ${p.ready?'READY':'choosing'}</span>`).join('')}</div><button class="primary" id="raceReady" ${me.ready?'disabled':''}>${me.ready?'WAITING FOR YOUR PARTNER…':'READY TO RACE! →'}</button><p class="fine">Auto-accelerate · hold left/right to steer · use nitro to speed up · avoid hazards.</p></div>`;
 }else if(['countdown','racing'].includes(r.stage)){
 inner=`<div class="race-arena"><div class="race-hud"><span>🏁 ${safe(track.name)}</span><strong id="raceReadout">YOU 0% · RIVAL 0%</strong></div><canvas id="raceCanvas" width="360" height="490" aria-label="Live race road, cars and obstacles"></canvas>${r.stage==='countdown'?`<div class="race-overlay">GET READY!<div>${Math.max(1,Math.ceil((r.startAt-Date.now())/1000))}</div></div>`:''}<div class="race-nitro"><span>NITRO</span><div><i id="nitroFill" style="width:${me.nitro}%"></i></div></div><div class="race-motion"><button id="motionToggle" class="secondary" type="button">Enable Motion Steering</button><button id="motionRecenter" class="secondary" type="button">Recenter</button></div><button id="raceItem" class="primary" type="button">${me.item?'USE ITEM: '+safe(me.item.toUpperCase()):'MYSTERY ITEM · EMPTY'}</button><div class="race-pad"><button id="raceLeft" class="race-control">◀ LEFT</button><button id="raceBoost" class="race-control nitro-btn">⚡ NITRO</button><button id="raceRight" class="race-control">RIGHT ▶</button></div><p class="fine">Press and hold to steer or boost. Nitro recharges automatically. Keep your car on the road!</p></div>`;
 }else{
 const winner=r.players.find(p=>p.id===r.winner),won=r.winner===state.youId;
 inner=`<div class="panel gameover"><div class="emoji">${won?'🏆':'🏁'}</div><h2 class="h2">${won?'YOU WON!':'RACE FINISHED!'}</h2><p>${safe(winner?.name||'A racer')} takes the checkered flag on ${safe(track.name)}!</p><div class="race-results">${r.players.slice().sort((a,b)=>b.distance-a.distance).map((p,i)=>`<div><b>${i+1}. ${safe(p.name)}</b><span>${Math.round(p.distance)}m</span></div>`).join('')}</div><p class="fine">Loser can choose an optional small sip, water, or a silly forfeit.</p>${host?'<button id="restartRace" class="primary">RACE AGAIN ↗</button>':'<div class="info">Waiting for the host to start another race…</div>'}</div>`;
 }
 root(`<div class="section-top"><span class="kicker">🏎️ KART CLASH</span><span class="round">${safe(r.stage.toUpperCase())}</span></div>${inner}`);
 if(r.stage==='select'){
  document.querySelectorAll('[data-driver]').forEach(b=>b.onclick=async()=>{const x=await emit('race:choose',{character:b.dataset.driver});if(!x.ok)notice(x.error)});
  document.querySelectorAll('[data-track]').forEach(b=>b.onclick=async()=>{const x=await emit('race:track',{track:b.dataset.track});if(!x.ok)notice(x.error)});
  qs('#raceReady')?.addEventListener('click',async()=>{const x=await emit('race:ready');if(!x.ok)notice(x.error)});
 }else if(['countdown','racing'].includes(r.stage)){
  qs('#motionToggle')?.addEventListener('click',enableTilt);qs('#motionRecenter')?.addEventListener('click',()=>{tiltNeutral=null;notice('Steering recentered.');});qs('#raceItem')?.addEventListener('click',()=>socket.emit('race:item'));raceHold('#raceLeft','left');raceHold('#raceRight','right');raceHold('#raceBoost','boost');
  raceInputTimer=setInterval(raceSendInput,110);raceDrawFrame=requestAnimationFrame(racerCanvas);
  const key=(ev,pressed)=>{if(!state||state.mode!=='race')return;const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',' ':'boost'};if(map[ev.key]){ev.preventDefault();raceControls[map[ev.key]]=pressed;raceSendInput();}};
  window.onkeydown=ev=>key(ev,true);window.onkeyup=ev=>key(ev,false);
 }else{qs('#restartRace')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});}
}
function renderMini(){
 const g=state.mini;if(!g)return root('<p>Loading minigame…</p>');
 const me=g.players.find(p=>p.id===state.youId),other=g.players.find(p=>p.id!==state.youId),host=state.youId===state.hostId;
 const names={mindmeld:'🧠 MIND MELD',emojirush:'🧩 EMOJI RUSH',tapduel:'⚡ TAP DUEL'};
 const scoreboard=`<div class="mini-scores">${g.players.map(p=>`<div><span>${safe(p.name)}</span><b>${p.score} pts</b></div>`).join('')}</div>`;
 let content='';
 if(g.stage==='finished'){
  const winner=g.players.find(p=>p.id===g.winner);
  content=`<div class="mini-stage"><div class="mini-symbol">🏆</div><h2>${winner?safe(winner.name)+' WINS!':'IT’S A TIE!'}</h2><p>That was ${g.total} rounds of pure fun.</p>${scoreboard}${host?'<button class="primary" id="miniRestart">CHOOSE ANOTHER GAME ↗</button>':'<div class="info">Waiting for the host…</div>'}</div>`;
 }else if(g.mode==='tapduel'){
  const remaining=g.deadline?Math.max(0,Math.ceil((g.deadline-Date.now())/1000)):0;
  const title=g.stage==='ready'?'READY YOUR FINGERS':g.stage==='countdown'?'GET READY…':g.stage==='tapping'?'TAP! TAP! TAP!':'HEAT RESULTS';
  content=`<div class="mini-stage"><div class="eyebrow">HEAT ${g.index+1} OF ${g.total}</div><div class="mini-symbol">${g.stage==='tapping'?'⚡':'🎯'}</div><h2>${title}</h2>${g.stage==='ready'?`<p>Both players press Ready. The game starts at the same time for both phones.</p><button class="primary" id="miniReady" ${me.ready?'disabled':''}>${me.ready?'WAITING FOR PARTNER…':'I’M READY!'}</button>`:g.stage==='countdown'?'<p class="mini-clock">'+remaining+'</p>':g.stage==='tapping'?`<p class="mini-clock" id="miniClock">${remaining}</p><button id="miniTap" class="mini-tap">TAP ⚡<small>Keep tapping until the clock runs out</small></button><p class="mini-taps">Your taps: <b id="myTapCount">${me.taps}</b> · Rival: <b id="rivalTapCount">${other?.taps||0}</b></p>`:`<h3>${g.results?.taps?.map(p=>`${safe(p.name)}: ${p.taps} taps`).join(' · ')||''}</h3><p>Next heat in a moment…</p>`}</div>${scoreboard}`;
 }else{
  const q=g.question;
  const answer=g.results?.answers?.find(p=>p.id===state.youId);
  const actual=g.mode==='emojirush'?g.results?.correct:null;
  const challenge=g.mode==='mindmeld'?'Choose the SAME answer without talking!':'Decode the emoji puzzle!';
  content=`<div class="mini-stage"><div class="eyebrow">ROUND ${g.index+1} / ${g.total} · NO TIMER</div><div class="mini-symbol">${g.mode==='mindmeld'?'🧠':'🎬'}</div><div class="mini-question">${safe(q?.title||'')}</div><p>${challenge}</p>${g.stage==='question'?(me.answered?'<div class="info">🔒 Locked in. Waiting for your partner…</div>':`<div class="choicegrid">${q.choices.map((v,i)=>`<button class="choice" data-mini-answer="${i}">${safe(v)} <span>↗</span></button>`).join('')}</div>`):`<div class="reveal"><h3>${g.mode==='mindmeld'?(g.results.match?'💖 MIND MELD! +2 EACH':'🎭 Different minds this round!'):(answer?.correct?'✅ CORRECT! +1':'💭 Not quite!')}</h3>${g.mode==='emojirush'?`<p>Answer: <b>${safe(q.choices[actual]||'')}</b></p>`:''}${g.results.answers.map(p=>`<p>${safe(p.name)}: <b>${safe(q.choices[p.answer]||'—')}</b></p>`).join('')}</div><div class="info">Next question shortly…</div>`}</div>${scoreboard}`;
 }
 root(`<div class="section-top"><div class="kicker">${names[g.mode]}</div><div class="round">ROUND ${Math.min(g.total,g.index+1)} / ${g.total}</div></div><div class="progress"><div style="width:${Math.min(100,g.index/g.total*100)}%"></div></div>${content}<p class="fine">Pause anytime · play together · optional drinks only</p>`);
 document.querySelectorAll('[data-mini-answer]').forEach(b=>b.onclick=async()=>{const x=await emit('mini:answer',{answer:Number(b.dataset.miniAnswer)});if(!x.ok)notice(x.error)});
 qs('#miniReady')?.addEventListener('click',async()=>{const x=await emit('mini:ready');if(!x.ok)notice(x.error)});
 qs('#miniTap')?.addEventListener('pointerdown',e=>{e.preventDefault();socket.emit('mini:tap');});
 qs('#miniRestart')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});
 if(g.mode==='tapduel'&&['countdown','tapping'].includes(g.stage)){
  const deadline=g.deadline,phase=g.stage;
  clockInterval=setInterval(()=>{const clock=qs('#miniClock');if(clock)clock.textContent=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(phase==='tapping'){const a=qs('#myTapCount'),b=qs('#rivalTapCount');if(a)a.textContent=state?.mini?.players?.find(p=>p.id===state.youId)?.taps||0;if(b)b.textContent=state?.mini?.players?.find(p=>p.id!==state.youId)?.taps||0;}},130);
 }
}
function render(){document.body.dataset.mode=state?.mode||"home";clearInterval(clockInterval);updateLeaveButton();updatePauseUI();if(!state)return renderHome();if(state.phase==='lobby')return renderLobby();if(state.arcade)return renderArcade();if(state.mini)return renderMini();if(state.mode==='race')return renderRace();if(state.mode==='story')return renderStory();if(state.mode==='sipbattle')return renderBattle();if(state.mode==='compatibility'){if(state.phase==='finished')return renderCompatibilityEnd();return renderCompatibilityRound()}if(state.phase==='finished')return renderEnd();renderRound()}
socket.on('connect',async()=>{status.textContent='● Live connected';status.style.color='#a5e6ba';if(joining)return;let stored;try{stored=JSON.parse(localStorage.getItem('sipSession')||'null')}catch{};
 if(stored?.code&&stored?.token){joining=true;const r=await emit('join',{code:stored.code,token:stored.token,name:stored.name});joining=false;if(!r.ok){localStorage.removeItem('sipSession');session=null;state=null;renderHome();notice('Your previous room expired. Create a new one.')}else session=stored}
 else if(!state)renderHome();});
socket.on('disconnect',()=>{status.textContent='● Reconnecting…';status.style.color='#ffca9e'});
socket.on('state',next=>{if(leaving)return;const old=state;state=next;if(!next.paused&&!old?.paused&&next.mini?.mode==='tapduel'&&old?.mini?.mode==='tapduel'&&next.mini.stage==='tapping'&&old.mini.stage==='tapping'&&next.mini.index===old.mini.index){/* keep the tap target stable between real-time updates */}else if(!next.paused&&!old?.paused&&next.mode==='race'&&old?.mode==='race'&&old.race?.stage===next.race?.stage&&['racing','countdown'].includes(next.race?.stage)){/* canvas handles live ticks without replacing controls */}else{stopRaceUI();render();}updatePauseUI();if(old&&old.code===next.code){if(next.mini&&old.mini&&next.mini.stage!==old.mini.stage){if(next.mini.stage==='finished')sound(next.mini.winner===next.youId?'win':'lose');else if(next.mini.stage==='reveal')sound('correct');else sound('turn')}else if(next.mode==='story'&&next.story&&old.story&&(next.story.step!==old.story.step||next.story.stage!==old.story.stage))sound(next.story.stage==='twist'?'twist':next.story.stage==='finished'?'finish':'turn');else if(next.phase==='reveal'&&old.phase!=='reveal'){if(next.mode==='compatibility'){const mine=next.reveal?.find(p=>p.id===next.youId);sound(mine?.correct?'correct':'tap');}else if(next.mode==='rapid'){const answers=next.reveal||[],round=next.round;const hit=round.type==='challenge'||(round.type==='match'&&answers.length===2&&answers[0].answer===answers[1].answer)||(round.type==='vote'&&answers.length===2&&((answers[0].answer===0?answers[0].id:answers[1].id)===(answers[1].answer===0?answers[1].id:answers[0].id)));sound(hit?'correct':'tap')}}else if(next.mode==='race'&&next.race&&old.race){if(next.race.stage==='finished'&&old.race.stage!=='finished')sound(next.race.winner===next.youId?'win':'lose');else if(next.race.stage==='racing'&&old.race.stage!=='racing')sound('turn');}else if(next.mode==='sipbattle'&&next.battle&&old.battle){if(next.battle.stage==='finished'&&old.battle.stage!=='finished')sound(next.battle.winner===next.youId?'win':'lose');else if(next.battle.turnCount>old.battle.turnCount)sound('tap');}else if(next.phase==='finished'&&old.phase!=='finished')sound('finish')}});
socket.on('room:closed',payload=>{returnHome(payload?.message||'Room closed.');});
qs('#leaveAny')?.addEventListener('click',forget);qs('#pauseAny')?.addEventListener('click',togglePause);qs('#resumeAny')?.addEventListener('click',togglePause);qs('#soundToggle')?.addEventListener('click',()=>{soundOn=!soundOn;localStorage.setItem('cdSound',soundOn?'on':'off');syncSoundButton();if(soundOn)sound('correct');});syncSoundButton();socket.on('replaced',()=>notice('This player rejoined on a different tab/device.'));
renderHome();
