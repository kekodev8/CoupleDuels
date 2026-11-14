'use strict';
/* Reliable touch/mouse input, one undoable gesture per pointerdown. */
function q48CanvasRedraw(canvas,strokes){if(!canvas)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);canvas._l46Last=null;for(const point of strokes)l46DrawLine(canvas,point);}
function q48InkUpdate(left,max=3.2){for(const fill of document.querySelectorAll('[data-q48-ink-fill]'))fill.style.width=Math.max(0,Math.min(100,100*left/max))+'%';for(const text of document.querySelectorAll('[data-q48-ink-text]'))text.textContent=Math.round(Math.max(0,left)/max*100)+'%';}
function q48Tools(d,artist){if(!artist||d.phase!=='draw')return '';return `<div class="q48-toolrow"><div class="q48-ink"><span>🖊 INK LEFT <b data-q48-ink-text>${Math.round(d.inkRemaining/d.inkMax*100)}%</b></span><div class="q48-ink-track"><span data-q48-ink-fill style="width:${100*d.inkRemaining/d.inkMax}%"></span></div></div><button type="button" id="q48-undo" class="q48-undo" aria-label="Undo your most recent stroke">↶ Undo last stroke</button></div><p class="q48-note">Lift your finger to start another line. Each line uses ink; Undo restores ink from your last line.</p>`;}
function q48GuessBox(id){return `<form id="${id}-form" class="q48-guess-form"><label for="${id}-word">✍️ TYPE YOUR GUESS</label><div class="q48-guess-row"><input id="${id}-word" type="text" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="What do you think it is?" aria-label="Type your guess"><button type="submit">GUESS ➜</button></div></form>`;}
function q48BindCanvas(canvas,d,namespace){if(!canvas)return; q48CanvasRedraw(canvas,d.strokes||[]);q48InkUpdate(d.inkRemaining,d.inkMax);
 let activeId=null,lastSent=0,firstAfterBlur=false;
 function release(e){if(e&&activeId!==null&&e.pointerId!==undefined&&activeId!==e.pointerId)return;const id=activeId;activeId=null;firstAfterBlur=false;if(id!==null&&canvas.hasPointerCapture?.(id)){try{canvas.releasePointerCapture(id);}catch{}}}
 function send(e,start){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const point=[Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width)),Math.min(1,Math.max(0,(e.clientY-rect.top)/rect.height)),start?1:0];socket.emit(namespace+':stroke',{points:[point]},r=>{if(r&&!r.ok&&r.error&&!/Ink is empty|Drawing unavailable/.test(r.error))notice(r.error);});}
 canvas.addEventListener('pointerdown',e=>{if(activeId!==null)return;if(e.button!==undefined&&e.button!==0)return;activeId=e.pointerId;lastSent=0;try{canvas.setPointerCapture(e.pointerId);}catch{}send(e,true);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(activeId!==e.pointerId)return;if(Date.now()-lastSent<14)return;lastSent=Date.now();send(e,false);e.preventDefault();});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
 window.addEventListener('blur',()=>{activeId=null;});
 document.getElementById('q48-undo')?.addEventListener('click',()=>{release();socket.emit(namespace+':undo',{},r=>{if(r&&!r.ok&&r.error!=='Nothing to undo.')notice(r.error);});});
}
