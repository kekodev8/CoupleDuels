'use strict';
/* Standalone Quick Draw — same shared four-heat sketch-and-guess rules as Party Mode. */
function renderStandaloneQuickDraw(){
 const p=state.quickdraw, d=p?.draw;
 if(!d)return root('<div class="info">Preparing Quick Draw…</div>');
 const finished=state.phase==='finished', me=state.youId, artist=d.drawerId===me;
 const artistName=p.players.find(x=>x.id===d.drawerId)?.name||'Your partner';
 const length=[10,8,6,4][d.heat]||4;
 const totals=p.players.map(x=>({id:x.id,name:x.name,points:d.totals?.[x.id]||0}));
 const scores=`<div class="l44-party-scores">${totals.map(x=>`<div><b>${safe(x.name)}${x.id===me?' (You)':''}</b><strong>${x.points} pts</strong></div>`).join('')}</div>`;
 if(finished){const sorted=[...totals].sort((a,b)=>b.points-a.points);const tie=sorted[0].points===sorted[1].points;
  root(`<section class="l44-party-game l46-mini qd47"><div class="qd47-hero"><h1>✏️ QUICK DRAW</h1><p>FOUR HEATS COMPLETE</p></div><h2>${tie?'🤝 IT’S A TIE!':'🏆 '+safe(sorted[0].name)+' WINS!'}</h2>${scores}<p>Awesome drawings, ridiculous guesses, and very little time.</p>${me===state.hostId?'<button class="primary" id="qd47-return">BACK TO PARTY LOBBY</button>':'<p>Waiting for the host to return to the lobby…</p>'}</section>`);
  qs('#qd47-return')?.addEventListener('click',async()=>{const r=await emit('restart');if(!r.ok)notice(r.error)});return;
 }
 const phase=d.phase, word=d.word;
 let prompt='';
 if(phase==='draw')prompt=artist?`<div class="qd47-secret">YOUR WORD <strong>${safe(word)}</strong></div><p>Draw it now! Your partner sees your sketch live.</p>`:`<p><strong>${safe(artistName)}</strong> is drawing. Watch closely—you'll guess next!</p>`;
 else if(phase==='guess')prompt=artist?'<p>Your partner is guessing! Watch them work it out.</p>':`<p>What did <b>${safe(artistName)}</b> draw?</p><form id="qd47-form"><input id="qd47-word" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type your guess" aria-label="Your guess"><button type="submit">GUESS!</button></form>`;
 else prompt=`<div class="qd47-answer">${d.correct?'🎉 Correct!':'⏱️ Time’s up!'} The word was <b>${safe(word)}</b>.</div>`;
 root(`<section class="l44-party-game l46-mini qd47"><div class="qd47-hero"><h1>✏️ QUICK DRAW</h1><p>DRAW · GUESS · LAUGH</p></div><p class="l44-overline">HEAT ${d.heat+1} OF 4 · ${length} SECOND DRAW</p><div class="l44-progress"><span style="width:${(d.heat+1)/4*100}%"></span></div>${scores}<h2>${artist?'Your turn to draw!':'Your partner’s turn to draw!'}</h2><div class="l46-timer">${phase==='draw'?'✏️ Drawing':phase==='guess'?'🔎 Guessing':'✨ Revealing'}: <strong id="qd47-clock">--</strong></div>${prompt}<canvas class="l46-canvas" id="qd47-canvas" width="640" height="430" aria-label="Shared drawing canvas"></canvas><p class="l44-fine">Time limits: 10 → 8 → 6 → 4 seconds · Correct guess: +3 guesser / +2 artist · No automatic image judging</p></section>`);
 const canvas=qs('#qd47-canvas');for(const pt of d.strokes)l46DrawLine(canvas,pt);
 if(phase==='draw'&&artist){let drawing=false,last=0;
  function send(e,first){const r=canvas.getBoundingClientRect(),point=[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),first?1:0];socket.emit('quickdraw:stroke',{points:[point]},ack=>{if(ack&&!ack.ok&&ack.error!=='Drawing unavailable.')notice(ack.error)});}
  canvas.addEventListener('pointerdown',e=>{drawing=true;canvas.setPointerCapture(e.pointerId);send(e,true);e.preventDefault()});
  canvas.addEventListener('pointermove',e=>{if(!drawing||Date.now()-last<18)return;last=Date.now();send(e,false);e.preventDefault()});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drawing=false});
 }
 qs('#qd47-form')?.addEventListener('submit',async e=>{e.preventDefault();const input=qs('#qd47-word');if(!input?.value.trim())return;const r=await emit('quickdraw:guess',{word:input.value});if(!r.ok){notice(r.error);input.select()}});
 l46Countdown(d.deadline,'qd47-clock');
}
socket.on('quickdraw:stroke',packet=>{if(!state?.quickdraw||state.mode!=='quickdraw'||state.phase!=='playing'||packet.drawerId!==state.quickdraw.draw?.drawerId)return;const canvas=qs('#qd47-canvas');if(canvas)for(const pt of packet.points)l46DrawLine(canvas,pt)});
