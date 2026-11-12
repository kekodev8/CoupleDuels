'use strict';
const crypto = require('crypto');
const shuffle = items => items.map(x=>({x,r:crypto.randomInt(1000000)})).sort((a,b)=>a.r-b.r).map(v=>v.x);
// Curated Wikipedia article thumbnails: loaded by the browser from Wikipedia itself.
// We do not bundle third-party screenshots or claim ownership of character artwork.
// Array: [display label, Wikipedia article title, category].
const IMAGES = [
 ['Frozen','Frozen (2013 film)','Disney'],['Moana','Moana (2016 film)','Disney'],
 ['Encanto','Encanto','Disney'],['Zootopia','Zootopia','Disney'],
 ['Inside Out 2','Inside Out 2','Disney'],['Lilo & Stitch','Lilo & Stitch','Disney'],
 ['The Lion King','The Lion King','Disney'],['Tangled','Tangled','Disney'],
 ['The Incredibles','The Incredibles','Disney'],['Toy Story','Toy Story','Disney'],
 ['Adventure Time','Adventure Time','Cartoon Network'],['Regular Show','Regular Show','Cartoon Network'],
 ['The Amazing World of Gumball','The Amazing World of Gumball','Cartoon Network'],
 ['Teen Titans Go!','Teen Titans Go!','Cartoon Network'],['We Bare Bears','We Bare Bears','Cartoon Network'],
 ['Ben 10','Ben 10','Cartoon Network'],['The Powerpuff Girls','The Powerpuff Girls','Cartoon Network'],
 ['Courage the Cowardly Dog','Courage the Cowardly Dog','Cartoon Network'],
 ['Rick and Morty','Rick and Morty','Adult Swim'],['Smiling Friends','Smiling Friends','Adult Swim'],
 ['Aqua Teen Hunger Force','Aqua Teen Hunger Force','Adult Swim'],['Robot Chicken','Robot Chicken','Adult Swim'],
 ['Metalocalypse','Metalocalypse','Adult Swim'],['The Boondocks','The Boondocks (TV series)','Adult Swim'],
 ['Mop','Mop','Everyday'],['Sponge','Sponge (tool)','Everyday'],['Book','Book','Everyday'],
 ['Pencil','Pencil','Everyday'],['Toothbrush','Toothbrush','Everyday'],['Scissors','Scissors','Everyday'],
 ['Backpack','Backpack','Everyday'],['Coffee mug','Mug','Everyday'],['Umbrella','Umbrella','Everyday'],
 ['Keyboard','Computer keyboard','Everyday'],['Flashlight','Flashlight','Everyday'],
 ['Stapler','Stapler','Everyday'],['Headphones','Headphones','Everyday'],['Frying pan','Frying pan','Everyday']
];
function optionsFor(img){const same=shuffle(IMAGES.filter(v=>v[0]!==img[0]&&v[2]===img[2]));const mixed=shuffle(IMAGES.filter(v=>v[0]!==img[0]&&v[2]!==img[2]));const decoys=[...same,...mixed].slice(0,3).map(v=>v[0]);return shuffle([img[0],...decoys]);}
const makeCard=v=>({imagePage:v[1],category:v[2],answer:v[0],choices:optionsFor(v)});
function make(mode, players, now=Date.now()){
 const cards=mode==='distorted'?shuffle(IMAGES.filter(v=>v[2]!=='Everyday')).slice(0,8).map(makeCard):[];
 const memory=mode==='memory'?shuffle(IMAGES).slice(0,8).map(makeCard):[];
 return {mode,stage:mode==='quickdraw'?'ready':mode==='memory'?'ready':'question',index:0,total:mode==='distorted'?8:mode==='memory'?8:7,
  cards,memory,players:players.map(p=>({id:p.id,name:p.name,score:0,answer:null,ready:false,drawAt:null,falseStarts:0})),
  deadline:null,results:null,winner:null,targetAt:null};
}
function question(g){if(g.mode==='distorted')return g.cards[g.index];if(g.mode==='memory')return g.memory[g.index];return null;}
function publicState(g, now=Date.now()){
 const q=question(g);return {mode:g.mode,stage:g.stage,index:g.index,total:g.total,
 players:g.players.map(p=>({id:p.id,name:p.name,score:p.score,answered:p.answer!==null,ready:p.ready,drawn:p.drawAt!==null,falseStarts:p.falseStarts})),
 // Memory cards show during memorization; reveal after both have guessed.
 question:q?{imagePage:q.imagePage,category:q.category,choices:q.choices,hideImage:g.mode==='memory'&&!['preview','reveal'].includes(g.stage)}:null,
 results:g.results,winner:g.winner,deadline:g.deadline,previewSeconds:g.mode==='memory'?[4.2,3.5,3,2.6,2.2,1.9,1.6,1.3][g.index]||null:null};
}
function answer(g,id,index){if(!['question','guess'].includes(g.stage))return 'Not taking answers.';
 const p=g.players.find(x=>x.id===id),q=question(g);if(!p||p.answer!==null)return 'Already answered.';
 if(!Number.isInteger(index)||index<0||index>=q.choices.length)return 'Invalid choice.';
 p.answer=index;
 if(g.players.every(x=>x.answer!==null)){
  g.results={correct:q.choices.indexOf(q.answer),answers:g.players.map(x=>({id:x.id,name:x.name,answer:x.answer,correct:q.choices[x.answer]===q.answer}))};
  g.players.forEach(x=>{if(q.choices[x.answer]===q.answer)x.score+=(g.mode==='distorted'?2:1)});
  g.stage='reveal';g.deadline=null;g.players.forEach(x=>x.ready=false);
 }
 return null;
}
function ready(g,id,now=Date.now()){
 if(g.stage==='reveal'){const p=g.players.find(x=>x.id===id);if(!p)return 'Not a player.';p.ready=true;if(g.players.every(x=>x.ready))nextRound(g);return null;}
 if(g.stage!=='ready')return 'Wait for the next heat.';
 const p=g.players.find(x=>x.id===id);if(!p)return 'Not a player.';p.ready=true;
 if(g.players.every(x=>x.ready)){
  if(g.mode==='quickdraw'){
   g.stage='countdown';g.deadline=now+2400+crypto.randomInt(1900);g.players.forEach(x=>{x.drawAt=null;x.answer=null});
  }else if(g.mode==='memory'){g.stage='preview';g.deadline=now+[4200,3500,3000,2600,2200,1900,1600,1300][g.index];}
 }
 return null;
}
function draw(g,id,now=Date.now()){
 if(g.mode!=='quickdraw'||!['countdown','draw'].includes(g.stage))return 'No draw underway.';
 const p=g.players.find(x=>x.id===id);if(!p)return 'Not a player.';
 if(p.drawAt!==null)return 'Already tapped.';
 if(g.stage==='countdown'){p.drawAt=-1;p.falseStarts++;}
 else {p.drawAt=now;}
 if(g.players.every(x=>x.drawAt!==null))finishDraw(g,now);
 return null;
}
function finishDraw(g,now){
 let winners=[];const valid=g.players.filter(p=>p.drawAt>0).sort((a,b)=>a.drawAt-b.drawAt);
 if(valid.length)winners=[valid[0].id];winners.forEach(id=>g.players.find(p=>p.id===id).score++);
 g.results={winner:winners[0]||null,players:g.players.map(p=>({id:p.id,name:p.name,early:p.drawAt===-1,ms:p.drawAt>0?Math.max(0,p.drawAt-g.targetAt):null}))};
 g.stage='reveal';g.deadline=now+3600;
}
function tick(g,now=Date.now()){
 if(!g.deadline||now<g.deadline)return false;
 if(g.mode==='quickdraw'){
  if(g.stage==='countdown'){g.stage='draw';g.targetAt=now;g.deadline=now+2300;return true;}
  if(g.stage==='draw'){finishDraw(g,now);return true;}
 }else if(g.mode==='memory'&&g.stage==='preview'){
  g.stage='guess';g.deadline=null;return true;
 }
 if(g.stage==='reveal'){if(g.mode==='quickdraw'){nextRound(g);return true;}return false;} // Ready advances picture games.
 return false;
}
function nextRound(g){
 g.index++;g.results=null;g.deadline=null;
 g.players.forEach(p=>{p.answer=null;p.ready=false;p.drawAt=null});
 if(g.index>=g.total){g.stage='finished';const [a,b]=g.players;g.winner=a.score===b.score?null:a.score>b.score?a.id:b.id;}
 else g.stage=g.mode==='distorted'?'question':'ready';
}
module.exports={IMAGES,make,publicState,answer,ready,draw,tick};
