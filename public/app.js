const socket=io({reconnection:true});
const el=document.getElementById('screen');
const status=document.getElementById('connection');
let state=null,session=null,joining=false,toastTimeout;
setInterval(()=>{const clock=qs('#countdown');if(clock&&state?.deadline)clock.textContent=Math.max(0,Math.ceil((state.deadline-Date.now())/1000))+'s';},200);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qs=(q)=>document.querySelector(q);
const roomFromUrl=(new URLSearchParams(location.search).get('room')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,6).toUpperCase();
function notice(text){const t=qs('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),3300)}
function emit(event,data={}){return new Promise(resolve=>socket.timeout(9000).emit(event,data,(err,res)=>resolve(err?{ok:false,error:'Connection timed out. Try again.'}:res)))}
function remember(code,token,name){session={code,token,name};localStorage.setItem('sipSession',JSON.stringify(session));history.replaceState({},'',`/?room=${code}`)}
function forget(){localStorage.removeItem('sipSession');session=null;state=null;history.replaceState({},'','/');location.reload()}
function nameValue(){return (qs('#nickname')?.value||localStorage.getItem('sipName')||'Player').trim().slice(0,20)||'Player'}
function renderHome(){el.innerHTML=`<section class="landing"><div class="eyebrow">TWO PHONES · ONE CHAOTIC DUO</div><h1>LOVE IS A <em>GAME.</em><br>PLAY IT.</h1><p>Three modes, two phones, one hilarious night. Go rapid-fire or find out how well you really know each other.</p><div class="hero-chip">⚡ Rapid-Fire · 💘 Compatibility · ⚔️ SipBattle</div><div class="panel"><label>Your nickname</label><input id="nickname" maxlength="20" placeholder="Your name" value="${safe(localStorage.getItem('sipName')||'')}"><button id="create" class="primary">CREATE A ROOM <span>↗</span></button><div class="separator"><span>or join your partner</span></div><input id="roomInput" maxlength="6" placeholder="6-character room code" value="${safe(roomFromUrl)}" autocomplete="off"><button id="join" class="secondary">JOIN ROOM</button></div><p class="fine">No accounts · Android + iPhone · Optional sips, never required</p></section>`;
 qs('#create').onclick=async()=>{const name=nameValue();localStorage.setItem('sipName',name);const r=await emit('create',{name});if(r.ok)remember(r.code,r.token,name);else notice(r.error)};
 qs('#join').onclick=async()=>{const name=nameValue(),code=qs('#roomInput').value.trim().toUpperCase();if(!/^[A-F0-9]{6}$/.test(code))return notice('Enter a valid 6-character room code.');localStorage.setItem('sipName',name);const r=await emit('join',{code,name});if(r.ok)remember(r.code,r.token,name);else notice(r.error)};
}
function playersHtml(){return `<div class="people">${state.players.map(p=>`<div class="person"><strong>${safe(p.name)} ${p.id===state.youId?'(you)':''}</strong><small>${p.connected?'🟢 Connected':'⚪ Offline'} ${p.id===state.hostId?'· Host':''}</small><br><b>${p.score}</b> <small>pts</small></div>`).join('')}${state.players.length<2?'<div class="person"><strong>Waiting for player 2…</strong><small>Scan the QR to join</small></div>':''}</div>`}
function root(content){el.innerHTML=`<section class="gameview">${content}</section>`}
function renderLobby(){const url=`${location.origin}/?room=${state.code}`,qr=`/api/qr?url=${encodeURIComponent(url)}`,host=state.youId===state.hostId;
 root(`<div class="eyebrow">✦ YOUR PRIVATE GAME ROOM</div><h2 class="h2">Your duo, your rules.</h2><p>Have your partner scan this code with their phone camera.</p><div class="panel"><div class="kicker" style="text-align:center">ROOM CODE</div><div class="roomcode">${safe(state.code)}</div><img class="qr" src="${qr}" alt="QR code to join this room"><button class="secondary" id="copy">COPY INVITE LINK ⎘</button>${playersHtml()}<div class="mode-select"><div class="kicker">CHOOSE YOUR GAME MODE</div><button class="mode-card ${state.mode==='rapid'?'active':''}" data-mode="rapid" ${host?'':'disabled'}><strong>⚡ Rapid-Fire Chaos</strong><small>15 lightning-fast votes, matching games, and challenges.</small></button><button class="mode-card ${state.mode==='compatibility'?'active':''}" data-mode="compatibility" ${host?'':'disabled'}><strong>💘 Couples Compatibility</strong><small>10 personal questions each + 5 guesses about your partner. Shared score out of 100%.</small></button><button class="mode-card ${state.mode==='sipbattle'?'active':''}" data-mode="sipbattle" ${host?'':'disabled'}><strong>⚔️ SipBattle</strong><small>Draft 3 heroes, power up with 1–5 point upgrades, and fight turn by turn.</small></button></div>${host?`<button class="primary" id="start" ${state.players.length!==2||!state.players.every(p=>p.connected)?'disabled':''}>START THE GAME <span>↗</span></button>`:'<div class="info">Waiting for host to start the game…</div>'}<button class="link" id="leave">Leave room</button></div><div class="sip">🥤 Optional drinking rule: celebrate a match with a small sip, water, or a snack. Skipping is always okay.</div>`);
 qs('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);notice('Invite link copied!')}catch{notice(url)}};
 if(host)document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=async()=>{const r=await emit('mode',{mode:b.dataset.mode});if(!r.ok)notice(r.error)});
 if(host)qs('#start').onclick=async()=>{const r=await emit('start');if(!r.ok)notice(r.error)};
 qs('#leave').onclick=forget;
}
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
 root(`<div class="section-top"><div class="kicker">💘 COUPLES COMPATIBILITY</div><div class="round">${n} / 15 · <b id="countdown">${Math.max(0,Math.ceil((state.deadline-Date.now())/1000))}s</b></div></div><div class="progress"><div style="width:${n/15*100}%"></div></div><div class="stagechip">${safe(subtitle)}</div><div class="question"><div class="eyebrow">${self?'QUESTION '+n+' OF 10':'PREDICTION '+(n-10)+' OF 5'}</div><h2>${safe(r.title)}</h2><p class="hint">${self?'Pick YOUR real answer, not what your partner would say.':`What did ${safe(partner?.name||'your partner')} choose when answering this earlier?`}</p>${actions}</div>${playersHtml()}<p class="fine">${self?'Your original answers stay secret during the first 10 questions.':'Each correct partner prediction earns 1 point. 10 possible matches combined.'}</p>`);
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
 root(`<div class="section-top"><div class="kicker">${stageTitle(state.roundIndex)}</div><div class="round">ROUND ${r.number} / 15 · <b id="countdown">${Math.max(0,Math.ceil((state.deadline-Date.now())/1000))}s</b></div></div><div class="progress"><div style="width:${(r.number/15)*100}%"></div></div><div class="stagechip">${['💞 WARMUP','🤭 PLAYFUL','🎭 CHAOS'][r.stage-1]} · STAGE ${r.stage}</div><div class="question"><div class="eyebrow">${r.type==='vote'?'SECRET VOTE':r.type==='match'?'SYNC YOUR MINDS':'DUO CHALLENGE'}</div><h2>${safe(r.title)}</h2><p class="hint">${safe(r.prompt)}</p>${actions}</div>${playersHtml()}<p class="fine">12-second picks · 18-second challenges · automatic next rounds · no alcohol penalties</p>`);

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
  body=`<div class="panel"><div class="kicker">⭐ YOUR MAIN HERO</div><div class="battle-card">⭐ ${safe(me.name)} · 65 HP · 10 ATK</div><p>Pick exactly two allies:</p><div class="battle-grid">${b.allies.map(a=>`<button class="battle-card ${chosen.includes(a.id)?'picked':''}" data-ally="${a.id}" ${me.locked?'disabled':''}><strong>${a.emoji} ${safe(a.name)}</strong><small>${a.hp} HP · ${a.attack} ATK</small><small>${safe(a.skill)}</small></button>`).join('')}</div><button class="primary" id="battleReady" ${me.locked||chosen.length!==2?'disabled':''}>${me.locked?'WAITING FOR PARTNER…':'LOCK IN MY TEAM ↗'}</button><p class="fine">${op.locked?'Opponent is ready':'Opponent is selecting allies'} · ${me.locked?'Your team is locked':'Your team is not locked'}</p></div>`;
 }else if(b.stage==='shop'){
  body=`<div class="panel"><div class="battle-stats"><div><small>AVAILABLE</small><strong>${me.points} ✨</strong></div><div><small>EARNED</small><strong>${me.earned}/5</strong></div><div><small>SPENT</small><strong>${me.spent}</strong></div></div><button class="secondary" id="claim" ${me.earned>=5||me.locked?'disabled':''}>+ 1 POWER POINT ${me.earned>=5?'(MAX)':''}</button><p class="fine">Optional sip, water, or no sip — each earns the same point. Maximum 5 per player; no drinking required.</p><div class="kicker" style="margin-top:24px">UPGRADE STORE</div>${b.upgrades.map(u=>`<button class="shop-item" data-buy="${u.id}" ${me.locked||me.points<u.cost||(me.upgrades[u.id]||0)>=u.max?'disabled':''}><div><strong>${safe(u.name)} </strong><small>${safe(u.desc)} · ${me.upgrades[u.id]||0}/${u.max}</small></div><b>${u.cost} ✨</b></button>`).join('')}<button id="shopReady" class="primary" ${me.locked?'disabled':''}>${me.locked?'WAITING FOR PARTNER…':'READY TO FIGHT ⚔️'}</button><p class="fine">${op.locked?'Opponent is ready':'Opponent is shopping'}</p></div>`;
 }else if(b.stage==='fight'){
  const actor=me.units.find(u=>u.id===battleActor&&u.hp>0)||me.units.find(u=>u.hp>0),target=op.units.find(u=>u.id===battleTarget&&u.hp>0)||op.units.find(u=>u.hp>0);
  battleActor=actor?.id||'hero';battleTarget=target?.id||'hero';
  body=`<div class="stagechip">${myTurn?'🟢 YOUR TURN':'⏳ OPPONENT TURN'} · TURN ${b.turnCount+1}</div><div class="battle-panel"><div class="kicker">YOUR TEAM — SELECT ATTACKER</div><div class="battle-grid">${me.units.map(u=>`<button class="battle-card ${battleActor===u.id?'picked':''}" data-actor="${u.id}" ${u.hp<=0?'disabled':''}><strong>${u.emoji} ${safe(u.name)}</strong>${hpBar(u)}</button>`).join('')}</div><div class="kicker" style="margin-top:18px">ENEMY TEAM — SELECT TARGET</div><div class="battle-grid">${op.units.map(u=>`<button class="battle-card enemy ${battleTarget===u.id?'picked':''}" data-target="${u.id}" ${u.hp<=0?'disabled':''}><strong>${u.emoji} ${safe(u.name)}</strong>${hpBar(u)}</button>`).join('')}</div><div class="battle-actions"><button data-move="attack" ${myTurn?'':'disabled'}>⚔️ ATTACK</button><button data-move="skill" ${myTurn?'':'disabled'}>✨ SPECIAL</button><button data-move="guard" ${myTurn?'':'disabled'}>🛡️ GUARD</button></div><p class="fine">${safe(actor?.skill||'Special')} · Guard halves the next hit. Medic heals your weakest living ally; Bard boosts attack.</p></div>`;
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
function render(){if(!state)return renderHome();if(state.phase==='lobby')return renderLobby();if(state.mode==='sipbattle')return renderBattle();if(state.mode==='compatibility'){if(state.phase==='finished')return renderCompatibilityEnd();return renderCompatibilityRound()}if(state.phase==='finished')return renderEnd();renderRound()}
socket.on('connect',async()=>{status.textContent='● Live connected';status.style.color='#a5e6ba';if(joining)return;let stored;try{stored=JSON.parse(localStorage.getItem('sipSession')||'null')}catch{};
 if(stored?.code&&stored?.token){joining=true;const r=await emit('join',{code:stored.code,token:stored.token,name:stored.name});joining=false;if(!r.ok){localStorage.removeItem('sipSession');session=null;state=null;renderHome();notice('Your previous room expired. Create a new one.')}else session=stored}
 else if(!state)renderHome();});
socket.on('disconnect',()=>{status.textContent='● Reconnecting…';status.style.color='#ffca9e'});
socket.on('state',next=>{state=next;render()});socket.on('replaced',()=>notice('This player rejoined on a different tab/device.'));
renderHome();
