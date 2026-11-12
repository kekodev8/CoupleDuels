/* CoupleDuels V4.1 — local per-device preferences; no server changes needed. */
(() => {
  'use strict';
  const KEY = 'cdDevicePrefsV1';
  const panel = document.getElementById('settingsPanel');
  const open = document.getElementById('settingsOpen');
  const close = document.getElementById('settingsClose');
  const done = document.getElementById('settingsDone');
  const sound = document.getElementById('settingsSound');
  const motion = document.getElementById('settingsMotion');
  const note = document.getElementById('settingsLayoutNote');
  const layouts = Array.from(document.querySelectorAll('[data-layout]'));
  let previousFocus = null;
  let prefs = {layout:'auto', effects:!matchMedia('(prefers-reduced-motion: reduce)').matches};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (['auto','phone','computer'].includes(saved.layout)) prefs.layout=saved.layout;
    if (typeof saved.effects==='boolean') prefs.effects=saved.effects;
  } catch (_) {}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(_) {}}
  function apply(){
    document.documentElement.dataset.layout=prefs.layout;
    document.documentElement.dataset.effects=prefs.effects?'on':'off';
    layouts.forEach(b=>{
      const active=b.dataset.layout===prefs.layout;
      b.setAttribute('aria-pressed',String(active));
      b.classList.toggle('selected',active);
    });
    motion.checked=prefs.effects;
    note.textContent=prefs.layout==='phone'?'Phone layout: larger touch targets and a narrow, one-column game view.':prefs.layout==='computer'?'Computer layout: a wider game view and multi-column mode gallery. On small screens it will still fit to prevent clipping.':'Auto adapts the layout to your screen size. Racing controls remain game-specific.';
  }
  function syncSound(){sound.checked=localStorage.getItem('cdSound')==='on'}
  layouts.forEach(b=>b.addEventListener('click',()=>{prefs.layout=b.dataset.layout;save();apply()}));
  motion.addEventListener('change',()=>{prefs.effects=motion.checked;save();apply()});
  sound.addEventListener('change',()=>{
    const current=localStorage.getItem('cdSound')==='on';
    if(current!==sound.checked){document.getElementById('soundToggle')?.click();}
    syncSound();
  });
  document.getElementById('soundToggle')?.addEventListener('click',()=>{queueMicrotask(syncSound)});
  function show(){previousFocus=document.activeElement;syncSound();panel.hidden=false;document.body.classList.add('settings-is-open');close.focus()}
  function hide(){panel.hidden=true;document.body.classList.remove('settings-is-open');previousFocus?.focus?.()}
  open.addEventListener('click',show);
  close.addEventListener('click',hide);
  done.addEventListener('click',hide);
  panel.addEventListener('click',e=>{if(e.target===panel)hide()});
  document.addEventListener('keydown',e=>{
    if(panel.hidden)return;
    if(e.key==='Escape'){e.preventDefault();hide()}
    if(e.key==='Tab'){
      const focusable=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
  });
  apply();syncSound();
})();
