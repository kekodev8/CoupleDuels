/* CoupleDuels V3 arcade game screens. Uses shared state/socket/helpers from app.js. */
function arcadeArt(name){return '/art/'+name+'.webp'}
function renderArcade(){
 const a=state.arcade;if(!a)return root('<div class="info">Loading arcade…</div>');
 const me=a.players.find(p=>p.id===state.youId),host=state.hostId===state.youId;
 const titles={distorted:'DISTORTED GUESS',quickdraw:'QUICK DRAW DUEL',memory:'MEMORY HEIST'};
 let body='';
 const scores=`<div class="mini-scores">${a.players.map(p=>`<div><span>${safe(p.name)}</span><b>${p.score} pts</b></div>`).join('')}</div>`;
 if(a.stage==='finished'){
  const winner=a.players.find(p=>p.id===a.winner);
  body=`<div class="arcade-scene gameover"><img class="arcade-hero" src="${arcadeArt(a.mode==='distorted'?'pixel-dog':a.mode==='memory'?'memory-cards':'quickdraw')}" alt="Game artwork"><h2>${winner?safe(winner.name)+' WINS!':'IT’S A TIE!'}</h2>${scores}${host?'<button class="primary" id="arcadeRestart">CHOOSE ANOTHER GAME</button>':'<p>Waiting for host…</p>'}</div>`;
 }else if(a.mode==='distorted'){
  const q=a.question;
  body=`<div class="arcade-scene"><p class="kicker">PICTURE ${a.index+1}/${a.total}</p><h2>WHAT'S HIDING IN THE IMAGE?</h2><div class="image-riddle"><img class="${a.stage==='question'?'riddle-obscured':''}" src="${arcadeArt(q.image.replace('.webp',''))}" alt="Distorted visual puzzle"></div>${a.stage==='question'?(me.answered?'<div class="info">Answer locked. Waiting for your partner…</div>':`<div class="choicegrid">${q.choices.map((v,i)=>`<button class="choice" data-arcade-answer="${i}">${safe(v)}</button>`).join('')}</div>`):`<div class="reveal"><h3>${a.results?.answers.find(x=>x.id===state.youId)?.correct?'CORRECT! +2':'REVEALED!'}</h3><p>It was ${safe(q.choices[a.results?.correct]||'a mystery')}!</p></div>`}</div>${scores}`;
 }else if(a.mode==='memory'){
  const q=a.question;
  let contents='';
  if(a.stage==='ready')contents=`<img class="arcade-hero" src="${arcadeArt('memory-cards')}" alt="Illustrated cards"><h2>READY TO MEMORIZE?</h2><p>You have 6.5 seconds to remember an image, then answer what you saw.</p><button id="arcadeReady" class="primary" ${me.ready?'disabled':''}>${me.ready?'WAITING FOR PARTNER…':'I’M READY'}</button>`;
  if(a.stage==='preview')contents=`<h2>REMEMBER THIS PICTURE</h2><p class="arcade-clock" id="arcadeClock">${a.deadline?Math.max(0,Math.ceil((a.deadline-Date.now())/1000)):''}</p><img class="memory-preview" src="${arcadeArt(q.image.replace('.webp',''))}" alt="Image to memorize">`;
  if(a.stage==='guess')contents=`<h2>WHAT DID YOU JUST SEE?</h2><div class="memory-hidden">?</div>${me.answered?'<div class="info">Locked in — waiting for your partner</div>':`<div class="choicegrid">${q.choices.map((v,i)=>`<button class="choice" data-arcade-answer="${i}">${safe(v)}</button>`).join('')}</div>`}`;
  if(a.stage==='reveal')contents=`<h2>${a.results?.answers.find(x=>x.id===state.youId)?.correct?'CORRECT!':'THE REVEAL'}</h2><img class="memory-preview" src="${arcadeArt(q.image.replace('.webp',''))}" alt="Revealed image"><p>${safe(q.choices[a.results.correct])}</p>`;
  body=`<div class="arcade-scene"><p class="kicker">MEMORY ${a.index+1}/${a.total}</p>${contents}</div>${scores}`;
 }else if(a.mode==='quickdraw'){
  const result=a.results;
  const contents=a.stage==='ready'?`<h2>HOLD YOUR NERVE</h2><p>Don't tap until the screen says DRAW. An early tap is a false start.</p><button class="primary" id="arcadeReady" ${me.ready?'disabled':''}>${me.ready?'WAITING FOR PARTNER':'READY TO DRAW'}</button>`:a.stage==='countdown'?`<h2>WAIT FOR IT…</h2><div class="duel-wait"><img src="${arcadeArt('quickdraw')}" alt="Quick Draw artwork"></div><button class="duel-btn premature" id="arcadeDraw" ${me.drawn?'disabled':''}>DON'T DRAW YET</button>`:a.stage==='draw'?`<h2>DRAW!</h2><button class="duel-btn now" id="arcadeDraw" ${me.drawn?'disabled':''}>${me.drawn?'DRAW LOCKED':'TAP NOW!'}</button><p>First clean tap earns a point.</p>`:`<h2>${result?.winner?('FASTEST: '+safe(a.players.find(x=>x.id===result.winner)?.name||'')):'NO CLEAN DRAW!'}</h2><div class="duel-results">${(result?.players||[]).map(p=>`<p>${safe(p.name)} — ${p.early?'FALSE START':p.ms===null?'NO TAP':p.ms+' ms'}</p>`).join('')}</div>`;
  body=`<div class="arcade-scene"><p class="kicker">DUEL ${a.index+1}/${a.total}</p>${contents}</div>${scores}`;
 }
 root(`<div class="section-top"><span class="kicker">✦ ${titles[a.mode]}</span><span class="round">${Math.min(a.index+1,a.total)}/${a.total}</span></div><div class="progress"><div style="width:${Math.round(a.index/a.total*100)}%"></div></div>${body}<p class="fine">Synchronized on both phones · Shared pause · Optional drinks only</p>`);
 document.querySelectorAll('[data-arcade-answer]').forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await emit('arcade:answer',{answer:Number(b.dataset.arcadeAnswer)});if(!r.ok)notice(r.error)});
 qs('#arcadeReady')?.addEventListener('click',async()=>{const r=await emit('arcade:ready');if(!r.ok)notice(r.error)});
 qs('#arcadeDraw')?.addEventListener('pointerdown',async e=>{e.preventDefault();const r=await emit('arcade:draw');if(!r.ok&&r.error!=='Already tapped.')notice(r.error)});
 qs('#arcadeRestart')?.addEventListener('click',async()=>{const r=await emit('restart');if(!r.ok)notice(r.error)});
 if(a.stage==='preview'&&a.deadline){const deadline=a.deadline;clockInterval=setInterval(()=>{const node=qs('#arcadeClock');if(node&&state&&!state.paused)node.textContent=Math.max(0,Math.ceil((deadline-Date.now())/1000))},110)}
}
