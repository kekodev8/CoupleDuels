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
function returnHome(message){stopRaceUI();localStorage.removeItem('sipSession');session=null;state=null;history.replaceState({},'','/');renderHome();updateLeaveButton();if(message)notice(message)}
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

function nameValue(){return (qs('#nickname')?.value||localStorage.getItem('sipName')||'Player').trim().slice(0,20)||'Player'}
function renderHome(){el.innerHTML=`<section class="landing"><div class="eyebrow">TWO PHONES · ONE CHAOTIC DUO</div><h1>LOVE IS A <em>GAME.</em><br>PLAY IT.</h1><p>Five modes. Laugh, race, battle, discover secrets, or build an outrageous story together.</p><div class="hero-chip">⚡ Chaos · 💘 Compatibility · ⚔️ Battle · 📖 Story · 🏎️ Racing</div><div class="panel"><label>Your nickname</label><input id="nickname" maxlength="20" placeholder="Your name" value="${safe(localStorage.getItem('sipName')||'')}"><button id="create" class="primary">CREATE A ROOM <span>↗</span></button><div class="separator"><span>or join your partner</span></div><input id="roomInput" maxlength="6" placeholder="6-character room code" value="${safe(roomFromUrl)}" autocomplete="off"><button id="join" class="secondary">JOIN ROOM</button></div><p class="fine">No accounts · Android + iPhone · Optional sips, never required</p></section>`;
 qs('#create').onclick=async()=>{const name=nameValue();localStorage.setItem('sipName',name);const r=await emit('create',{name});if(r.ok)remember(r.code,r.token,name);else notice(r.error)};
 qs('#join').onclick=async()=>{const name=nameValue(),code=qs('#roomInput').value.trim().toUpperCase();if(!/^[A-F0-9]{6}$/.test(code))return notice('Enter a valid 6-character room code.');localStorage.setItem('sipName',name);const r=await emit('join',{code,name});if(r.ok)remember(r.code,r.token,name);else notice(r.error)};
}
function playersHtml(){return `<div class="people">${state.players.map(p=>`<div class="person"><strong>${safe(p.name)} ${p.id===state.youId?'(you)':''}</strong><small>${p.connected?'🟢 Connected':'⚪ Offline'} ${p.id===state.hostId?'· Host':''}</small><br><b>${p.score}</b> <small>pts</small></div>`).join('')}${state.players.length<2?'<div class="person"><strong>Waiting for player 2…</strong><small>Scan the QR to join</small></div>':''}</div>`}
function root(content){el.innerHTML=`<section class="gameview">${content}</section>`}
function renderLobby(){const url=`${location.origin}/?room=${state.code}`,qr=`/api/qr?url=${encodeURIComponent(url)}`,host=state.youId===state.hostId;
 root(`<div class="eyebrow">✦ YOUR PRIVATE GAME ROOM</div><h2 class="h2">Pick your adventure.</h2><p>Have your partner scan this code with their phone camera.</p><div class="panel"><div class="kicker" style="text-align:center">ROOM CODE</div><div class="roomcode">${safe(state.code)}</div><img class="qr" src="${qr}" alt="QR code to join this room"><button class="secondary" id="copy">COPY INVITE LINK ⎘</button>${playersHtml()}<div class="mode-select"><div class="kicker">CHOOSE YOUR GAME MODE</div><button class="mode-card ${state.mode==='rapid'?'active':''}" data-mode="rapid" ${host?'':'disabled'}><strong>⚡ Rapid-Fire Chaos</strong><small>15 surprises from 90 prompts · no timers · new illustrations.</small></button><button class="mode-card ${state.mode==='compatibility'?'active':''}" data-mode="compatibility" ${host?'':'disabled'}><strong>💘 Couples Compatibility</strong><small>10 self-answers + 5 partner predictions · 50-question pool.</small></button><button class="mode-card ${state.mode==='sipbattle'?'active':''}" data-mode="sipbattle" ${host?'':'disabled'}><strong>⚔️ SipBattle</strong><small>Choose from 7 allies, unlock upgrades and unleash specials.</small></button><button class="mode-card ${state.mode==='race'?'active':''}" data-mode="race" ${host?'':'disabled'}><strong>🏎️ Kart Clash <span class="new-chip">NEW</span></strong><small>5 drivers · 5 maps · steer, dodge and use nitro on both phones!</small></button><button class="mode-card ${state.mode==='story'?'active':''}" data-mode="story" ${host?'':'disabled'}><strong>📖 Create Story <span class="new-chip">NEW</span></strong><small>5 chapters, 45-second turns, 4–6 exchanges before each twist. No winner.</small></button></div>${host?`<button class="primary" id="start" ${state.players.length!==2||!state.players.every(p=>p.connected)?'disabled':''}>START THE GAME <span>↗</span></button>`:'<div class="info">Waiting for host to start the game…</div>'}<button class="link" id="leave">Leave room</button></div><div class="sip">🥤 Optional drinking rule: celebrate a match with a small sip, water, or a snack. Skipping is always okay.</div>`);
 qs('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);notice('Invite link copied!')}catch{notice(url)}};
 if(host)document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=async()=>{const r=await emit('mode',{mode:b.dataset.mode});if(!r.ok)notice(r.error)});
 if(host)qs('#start').onclick=async()=>{const r=await emit('start');if(!r.ok)notice(r.error)};
 qs('#leave').onclick=forget;
}
function pictureFor(title,kind){const x=String(title||'').toLowerCase();let name='spark';if(/commercial|news|movie|camera|concert|show|sing|acting|report|interview|voice/.test(x))name='spotlight';else if(/food|pizza|fries|snack|restaurant|cook|dessert|breakfast/.test(x))name='snack';else if(/secret|mystery|guess|know|truth|surprise|detective/.test(x))name='mystery';else if(/love|date|romantic|partner|kiss|relationship|couple/.test(x))name='heart';else if(/battle|weapon|attack|hero|sword/.test(x))name='battle';return `<div class="question-picture"><img src="/art/${name}.svg" alt="Decorative ${name} illustration" loading="lazy"></div>`;}
function stageTitle(i){return ['THE SWEET START','THE PLAYFUL MIDDLE','THE CHAOS FINALE'][Math.floor(i/5)]||'FINALE'}
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
 root(`<div class="section-top"><div class="kicker">${stageTitle(state.roundIndex)}</div><div class="round">ROUND ${r.number} / 15 · <b>NO TIMER ♡</b></div></div><div class="progress"><div style="width:${(r.number/15)*100}%"></div></div><div class="stagechip">${['💞 WARMUP','🤭 PLAYFUL','🎭 CHAOS'][r.stage-1]} · STAGE ${r.stage}</div><div class="question">${pictureFor(r.title,r.type)}<div class="eyebrow">${r.type==='vote'?'SECRET VOTE':r.type==='match'?'SYNC YOUR MINDS':'DUO CHALLENGE'}</div><h2>${safe(r.title)}</h2><p class="hint">${safe(r.prompt)}</p>${actions}</div>${playersHtml()}<p class="fine">Take your time · both players finish before moving on · no alcohol penalties</p>`);

 qs('#done')?.addEventListener('click',async()=>{const x=await emit('answer',{answer:'done'});if(!x.ok)notice(x.error)});
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=async()=>{document.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);const x=await emit('answer',{answer:Number(b.dataset.answer)});if(!x.ok){notice(x.error);document.querySelectorAll('[data-answer]').forEach(y=>y.disabled=false)}});
}
function renderEnd(){const p=state.players.slice().sort((a,b)=>b.score-a.score),tie=p[0].score===p[1].score,host=state.youId===state.hostId;
 root(`<div class="gameover"><div class="emoji">🏆</div><div class="eyebrow">ALL 15 ROUNDS COMPLETE</div><h1>${tie?'PERFECT DUO!':'WE HAVE A WINNER!'}</h1><p>${tie?'It’s a tie. The power couple wins.':`${safe(p[0].name)} takes the crown!`}</p>${playersHtml()}<div class="panel"><h2 class="h2">Your night, your story.</h2><p>Rematch, switch nicknames, or invent your own bonus round. Optional sips stay optional.</p>${host?'<button class="primary" id="restart">PLAY AGAIN <span>↗</span></button>':'<div class="info">Waiting for host to choose a rematch…</div>'}<button class="link" id="leave">Leave room</button></div></div>`);
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
  body=`<div class="panel"><div class="kicker">⭐ YOUR MAIN HERO</div><div class="battle-card">⭐ ${safe(me.name)} · 65 HP · 10 ATK</div><p>Pick exactly two allies:</p><div class="battle-grid">${b.allies.map(a=>`<button class="battle-card ${chosen.includes(a.id)?'picked':''}" data-ally="${a.id}" ${me.locked?'disabled':''}><span class="hero-portrait">${a.emoji}</span><strong>${safe(a.name)}</strong><small>${a.hp} HP · ${a.attack} ATK</small><small>${safe(a.skill)}</small></button>`).join('')}</div><button class="primary" id="battleReady" ${me.locked||chosen.length!==2?'disabled':''}>${me.locked?'WAITING FOR PARTNER…':'LOCK IN MY TEAM ↗'}</button><p class="fine">${op.locked?'Opponent is ready':'Opponent is selecting allies'} · ${me.locked?'Your team is locked':'Your team is not locked'}</p></div>`;
 }else if(b.stage==='shop'){
  body=`<div class="panel"><div class="battle-stats"><div><small>AVAILABLE</small><strong>${me.points} ✨</strong></div><div><small>EARNED</small><strong>${me.earned}/5</strong></div><div><small>SPENT</small><strong>${me.spent}</strong></div></div><button class="secondary" id="claim" ${me.earned>=5||me.locked?'disabled':''}>+ 1 POWER POINT ${me.earned>=5?'(MAX)':''}</button><p class="fine">Optional sip, water, or no sip — each earns the same point. Maximum 5 per player; no drinking required.</p><div class="kicker" style="margin-top:24px">UPGRADE STORE</div>${b.upgrades.map(u=>`<button class="shop-item" data-buy="${u.id}" ${me.locked||me.points<u.cost||(me.upgrades[u.id]||0)>=u.max?'disabled':''}><div><strong>${safe(u.name)} </strong><small>${safe(u.desc)} · ${me.upgrades[u.id]||0}/${u.max}</small></div><b>${u.cost} ✨</b></button>`).join('')}<button id="shopReady" class="primary" ${me.locked?'disabled':''}>${me.locked?'WAITING FOR PARTNER…':'READY TO FIGHT ⚔️'}</button><p class="fine">${op.locked?'Opponent is ready':'Opponent is shopping'}</p></div>`;
 }else if(b.stage==='fight'){
  const actor=me.units.find(u=>u.id===battleActor&&u.hp>0)||me.units.find(u=>u.hp>0),target=op.units.find(u=>u.id===battleTarget&&u.hp>0)||op.units.find(u=>u.hp>0);
  battleActor=actor?.id||'hero';battleTarget=target?.id||'hero';
  body=`<div class="stagechip">${myTurn?'🟢 YOUR TURN':'⏳ OPPONENT TURN'} · TURN ${b.turnCount+1}</div><div class="battle-panel"><div class="kicker">YOUR TEAM — SELECT ATTACKER</div><div class="battle-grid">${me.units.map(u=>`<button class="battle-card ${battleActor===u.id?'picked':''}" data-actor="${u.id}" ${u.hp<=0?'disabled':''}><span class="hero-portrait">${u.emoji}</span><strong>${safe(u.name)}</strong>${hpBar(u)}</button>`).join('')}</div><div class="kicker" style="margin-top:18px">ENEMY TEAM — SELECT TARGET</div><div class="battle-grid">${op.units.map(u=>`<button class="battle-card enemy ${battleTarget===u.id?'picked':''}" data-target="${u.id}" ${u.hp<=0?'disabled':''}><span class="hero-portrait">${u.emoji}</span><strong>${safe(u.name)}</strong>${hpBar(u)}</button>`).join('')}</div><div class="battle-actions"><button data-move="attack" ${myTurn?'':'disabled'}>⚔️ ATTACK</button><button data-move="skill" ${myTurn?'':'disabled'}>✨ SPECIAL</button><button data-move="guard" ${myTurn?'':'disabled'}>🛡️ GUARD</button></div><p class="fine">${safe(actor?.skill||'Special')} · Guard halves the next hit. Medic heals your weakest living ally; Bard boosts attack.</p></div>`;
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
 const isMine=b.turnPlayerId===state.youId,person=state.players.find(p=>p.id===b.turnPlayerId);let content='';
 if(b.stage==='finished'){
  content=`<div class="story-finish"><div class="story-illustration">📚 ✨</div><div class="eyebrow">THE END · CO-OP COMPLETE</div><h1>WHAT A STORY.</h1><p>You built a five-chapter adventure together. No score, no winner—just an absolutely ridiculous memory.</p><div class="story-timeline">${b.history.map((entry,i)=>`<div><span>${i+1}</span> ${safe(entry.name)} added to ${entry.round==='Ending'?'the finale':'chapter '+entry.round}</div>`).join('')}</div>${isHost?'<button class="primary" id="restart">WRITE ANOTHER STORY ✨</button>':'<div class="info">Waiting for your partner to start a new story…</div>'}</div>`;
 }else if(b.stage==='twist'){
  const ready=b.ready.includes(state.youId);
  content=`<div class="story-scene"><div class="story-illustration">${b.ending?'🏁':'🌪️'}</div><div class="eyebrow">${b.ending?'THE GRAND FINALE':'PLOT TWIST!'}</div><h2>${safe(b.prompt)}</h2><p>No timer on plot twists. Talk about it together, then continue when you're ready.</p><div class="story-coop">${state.players.map(p=>`<span>${b.ready.includes(p.id)?'✅':'⌛'} ${safe(p.name)}</span>`).join('')}</div><button class="primary" id="storyReady" ${ready?'disabled':''}>${ready?'WAITING FOR YOUR PARTNER…':'WE’RE READY — CONTINUE →'}</button></div>`;
 }else{
  content=`<div class="story-scene"><div class="story-illustration">${b.ending?'🌅':b.round===1?'🗝️':b.round===2?'🚀':b.round===3?'🎭':b.round===4?'🐉':'🌌'}</div><div class="eyebrow">${b.ending?'FINAL SCENE':`CHAPTER ${b.round} / 5`}</div><h2>${b.ending?(b.step===b.endingStart?'Start the ending!':'Finish the story!'):b.step===0?'Once upon a time…':`Keep the story going, ${safe(b.turnName)}!`}</h2>${b.step<2?`<div class="story-opening">${safe(b.opening)}</div>`:''}${!b.ending?`<div class="story-exchange">Exchange ${b.exchange} of ${b.exchangesInChapter} before the next twist</div>`:''}<div class="story-speaker">🎤 ${safe(b.turnName)} is telling the story</div><div class="countdown" id="storyClock">45</div><p>${isMine?'Say your part out loud. Tap Done early if you finish.':'Listen to your partner and get ready to add your next twist!'}</p>${isMine?'<button class="primary" id="storyDone">DONE SPEAKING ✓</button>':'<div class="info">Their turn ends automatically after 45 seconds.</div>'}</div>`;
 }
 root(`<div class="section-top"><div class="kicker">📖 CREATE STORY</div><div class="round">${b.stage==='finished'?'COMPLETE':b.ending?'ENDING':`CHAPTER ${b.round} OF 5`}</div></div><div class="progress"><div style="width:${Math.min(100,b.step/b.totalTurns*100)}%"></div></div>${content}${b.stage!=='finished'?'<div class="story-rule">🎭 Speak out loud, take turns, and build on whatever your partner says. There is no scoring in this mode.</div>':''}`);
 if(b.stage==='turn'){const update=()=>{const e=qs('#storyClock');if(!e||!state?.story||state.story.stage!=='turn')return;const left=Math.max(0,Math.ceil((state.story.deadline-Date.now())/1000));e.textContent=left;e.classList.toggle('urgent',left<=7)};update();clearInterval(clockInterval);clockInterval=setInterval(update,200);}
 qs('#storyDone')?.addEventListener('click',async()=>{sound('tap');const x=await emit('story:done');if(!x.ok)notice(x.error)});
 qs('#storyReady')?.addEventListener('click',async()=>{sound('tap');const x=await emit('story:ready');if(!x.ok)notice(x.error)});
 qs('#restart')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});
}

// Kart Clash: live 2-player top-down racing, synchronized by the room server.
let raceControls={left:false,right:false,boost:false},raceCanvasRunning=false,raceDrawFrame=0,raceInputTimer=null,lastRaceStage=null;
function stopRaceUI(){if(raceDrawFrame)cancelAnimationFrame(raceDrawFrame);raceDrawFrame=0;raceCanvasRunning=false;if(raceInputTimer)clearInterval(raceInputTimer);raceInputTimer=null;raceControls={left:false,right:false,boost:false};}
function raceSendInput(){if(!state||state.mode!=='race'||!['racing','countdown'].includes(state.race?.stage))return;socket.emit('race:input',{steer:Number(raceControls.right)-Number(raceControls.left),boost:raceControls.boost});}
function racerCanvas(){
 const canvas=qs('#raceCanvas');if(!canvas||!state?.race||!['racing','countdown'].includes(state.race.stage))return;
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,r=state.race,track=r.tracks.find(t=>t.id===r.trackId),me=r.players.find(p=>p.id===state.youId),enemy=r.players.find(p=>p.id!==state.youId);
 if(!me||!track)return;
 const styles={candy:['#ffafd3','#7654a9','#73557c','#fff1ac'],neon:['#122b50','#2c2860','#151e36','#5df4ed'],desert:['#c68f45','#c6aa75','#856f54','#f6d9a2'],snow:['#c2e7ee','#9bcce5','#819cab','#fff'],space:['#17102b','#46316e','#1c1b42','#e0a0ff']};
 const [grass,edge,road,line]=styles[track.theme],cx=(d)=>w/2+Math.sin(d/55)*track.curves*95;
 ctx.fillStyle=grass;ctx.fillRect(0,0,w,h);
 for(let y=0;y<h;y+=4){const dist=me.distance+(h*.73-y)/2.7;const center=cx(dist);ctx.fillStyle=edge;ctx.fillRect(center-118,y,236,4);ctx.fillStyle=road;ctx.fillRect(center-104,y,208,4);const roadStripe=Math.floor(dist/9)%2===0; if(roadStripe){ctx.fillStyle=line;ctx.globalAlpha=.6;ctx.fillRect(center-36,y,3,4);ctx.fillRect(center+35,y,3,4);ctx.globalAlpha=1;}}
 if(track.theme==='space'||track.theme==='neon'){ctx.fillStyle='#ffffff66';for(let i=0;i<24;i++){const y=((i*71+Math.floor(me.distance*4))%h);const x=(i*83)%w;ctx.fillRect(x,y,2,2)}}
 function placeCar(p,isMe){const char=r.characters.find(c=>c.id===p.character),y=h*.73+(me.distance-p.distance)*2.7;if(y< -40||y>h+40)return;const x=cx(p.distance)+p.x*85;ctx.save();ctx.translate(x,y);ctx.shadowColor=isMe?'#ffffff':'#ff709e';ctx.shadowBlur=12;ctx.fillStyle=char?.color||'#fff';ctx.fillRect(-14,-23,28,43);ctx.fillStyle='#25243d';ctx.fillRect(-10,-15,20,14);ctx.shadowBlur=0;ctx.font='19px system-ui';ctx.textAlign='center';ctx.fillText(char?.emoji||'🏎️',0,7);ctx.fillStyle='#ffffff';ctx.font='bold 11px system-ui';ctx.fillText(isMe?'YOU':p.name.slice(0,8),0,-28);ctx.restore();}
 for(const ob of r.obstacles){const y=h*.73+(me.distance-ob.distance)*2.7;if(y<0||y>h)continue;const x=cx(ob.distance)+ob.x*85;ctx.font='25px system-ui';ctx.textAlign='center';ctx.fillText(ob.type==='boost'?'⚡':track.theme==='snow'?'🧊':track.theme==='desert'?'🪨':'🚧',x,y);}
 placeCar(enemy,false);placeCar(me,true);
 const readout=qs('#raceReadout');if(readout)readout.textContent=`YOU ${Math.floor(me.distance/track.length*100)}%   ·   RIVAL ${Math.floor(enemy.distance/track.length*100)}%`;
 const nitro=qs('#nitroFill');if(nitro)nitro.style.width=me.nitro+'%';
 raceDrawFrame=requestAnimationFrame(racerCanvas);
}
function raceHold(selector,key){const b=qs(selector);if(!b)return;const change=(v,e)=>{e?.preventDefault();raceControls[key]=v;raceSendInput();};b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);change(true,e)});['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,e=>change(false,e)));}
function renderRace(){const r=state.race;if(!r)return root('<div class="info">Loading race…</div>');const host=state.youId===state.hostId,me=r.players.find(p=>p.id===state.youId),track=r.tracks.find(t=>t.id===r.trackId);
 let inner='';
 if(r.stage==='select'){
 inner=`<div class="panel"><div class="kicker">STEP 1 · PICK YOUR DRIVER</div><div class="race-characters">${r.characters.map(c=>`<button class="race-character ${me.character===c.id?'picked':''}" data-driver="${c.id}"><span>${c.emoji}</span><b>${safe(c.name)}</b><small>${safe(c.tag)}</small></button>`).join('')}</div><div class="kicker">STEP 2 · PICK A TRACK</div><div class="race-tracks">${r.tracks.map(t=>`<button class="race-track ${r.trackId===t.id?'picked':''}" data-track="${t.id}" ${host?'':'disabled'}><span>${t.emoji}</span><b>${safe(t.name)}</b><small>${safe(t.description)}</small></button>`).join('')}</div><div class="race-status">${r.players.map(p=>`<span>${p.ready?'✅':'⏳'} ${safe(p.name)} ${p.ready?'READY':'choosing'}</span>`).join('')}</div><button class="primary" id="raceReady" ${me.ready?'disabled':''}>${me.ready?'WAITING FOR YOUR PARTNER…':'READY TO RACE! →'}</button><p class="fine">Auto-accelerate · hold left/right to steer · use nitro to speed up · avoid hazards.</p></div>`;
 }else if(['countdown','racing'].includes(r.stage)){
 inner=`<div class="race-arena"><div class="race-hud"><span>🏁 ${safe(track.name)}</span><strong id="raceReadout">YOU 0% · RIVAL 0%</strong></div><canvas id="raceCanvas" width="360" height="490" aria-label="Live race road, cars and obstacles"></canvas>${r.stage==='countdown'?`<div class="race-overlay">GET READY!<div>${Math.max(1,Math.ceil((r.startAt-Date.now())/1000))}</div></div>`:''}<div class="race-nitro"><span>NITRO</span><div><i id="nitroFill" style="width:${me.nitro}%"></i></div></div><div class="race-pad"><button id="raceLeft" class="race-control">◀ LEFT</button><button id="raceBoost" class="race-control nitro-btn">⚡ NITRO</button><button id="raceRight" class="race-control">RIGHT ▶</button></div><p class="fine">Press and hold to steer or boost. Nitro recharges automatically. Keep your car on the road!</p></div>`;
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
  raceHold('#raceLeft','left');raceHold('#raceRight','right');raceHold('#raceBoost','boost');
  raceInputTimer=setInterval(raceSendInput,110);raceDrawFrame=requestAnimationFrame(racerCanvas);
  const key=(ev,pressed)=>{if(!state||state.mode!=='race')return;const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',' ':'boost'};if(map[ev.key]){ev.preventDefault();raceControls[map[ev.key]]=pressed;raceSendInput();}};
  window.onkeydown=ev=>key(ev,true);window.onkeyup=ev=>key(ev,false);
 }else{qs('#restartRace')?.addEventListener('click',async()=>{const x=await emit('restart');if(!x.ok)notice(x.error)});}
}
function render(){clearInterval(clockInterval);updateLeaveButton();if(!state)return renderHome();if(state.phase==='lobby')return renderLobby();if(state.mode==='race')return renderRace();if(state.mode==='story')return renderStory();if(state.mode==='sipbattle')return renderBattle();if(state.mode==='compatibility'){if(state.phase==='finished')return renderCompatibilityEnd();return renderCompatibilityRound()}if(state.phase==='finished')return renderEnd();renderRound()}
socket.on('connect',async()=>{status.textContent='● Live connected';status.style.color='#a5e6ba';if(joining)return;let stored;try{stored=JSON.parse(localStorage.getItem('sipSession')||'null')}catch{};
 if(stored?.code&&stored?.token){joining=true;const r=await emit('join',{code:stored.code,token:stored.token,name:stored.name});joining=false;if(!r.ok){localStorage.removeItem('sipSession');session=null;state=null;renderHome();notice('Your previous room expired. Create a new one.')}else session=stored}
 else if(!state)renderHome();});
socket.on('disconnect',()=>{status.textContent='● Reconnecting…';status.style.color='#ffca9e'});
socket.on('state',next=>{if(leaving)return;const old=state;state=next;if(next.mode==='race'&&old?.mode==='race'&&old.race?.stage===next.race?.stage&&['racing','countdown'].includes(next.race?.stage)){/* canvas handles live ticks without replacing controls */}else{stopRaceUI();render();}if(old&&old.code===next.code){if(next.mode==='story'&&next.story&&old.story&&(next.story.step!==old.story.step||next.story.stage!==old.story.stage))sound(next.story.stage==='twist'?'twist':next.story.stage==='finished'?'finish':'turn');else if(next.phase==='reveal'&&old.phase!=='reveal'){if(next.mode==='compatibility'){const mine=next.reveal?.find(p=>p.id===next.youId);sound(mine?.correct?'correct':'tap');}else if(next.mode==='rapid'){const answers=next.reveal||[],round=next.round;const hit=round.type==='challenge'||(round.type==='match'&&answers.length===2&&answers[0].answer===answers[1].answer)||(round.type==='vote'&&answers.length===2&&((answers[0].answer===0?answers[0].id:answers[1].id)===(answers[1].answer===0?answers[1].id:answers[0].id)));sound(hit?'correct':'tap')}}else if(next.mode==='race'&&next.race&&old.race){if(next.race.stage==='finished'&&old.race.stage!=='finished')sound(next.race.winner===next.youId?'win':'lose');else if(next.race.stage==='racing'&&old.race.stage!=='racing')sound('turn');}else if(next.mode==='sipbattle'&&next.battle&&old.battle){if(next.battle.stage==='finished'&&old.battle.stage!=='finished')sound(next.battle.winner===next.youId?'win':'lose');else if(next.battle.turnCount>old.battle.turnCount)sound('tap');}else if(next.phase==='finished'&&old.phase!=='finished')sound('finish')}});
socket.on('room:closed',payload=>{returnHome(payload?.message||'Room closed.');});
qs('#leaveAny')?.addEventListener('click',forget);qs('#soundToggle')?.addEventListener('click',()=>{soundOn=!soundOn;localStorage.setItem('cdSound',soundOn?'on':'off');syncSoundButton();if(soundOn)sound('correct');});syncSoundButton();socket.on('replaced',()=>notice('This player rejoined on a different tab/device.'));
renderHome();
