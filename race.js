'use strict';
const CHARACTERS=[
 {id:'blaze',name:'Blaze',emoji:'🔥',color:'#ff765f',speed:1.04,steer:0.96,boost:1.02,tag:'Speedster'},
 {id:'bubbles',name:'Bubbles',emoji:'🫧',color:'#6fd9f5',speed:0.97,steer:1.18,boost:1.03,tag:'Corner expert'},
 {id:'pickle',name:'Pickle',emoji:'🥒',color:'#a6dd70',speed:1,steer:1.05,boost:1,tag:'All-rounder'},
 {id:'nova',name:'Nova',emoji:'🌟',color:'#fabd61',speed:1.01,steer:1,boost:1.12,tag:'Nitro master'},
 {id:'ghost',name:'Ghost',emoji:'👻',color:'#bb9bff',speed:0.99,steer:1.1,boost:1.05,tag:'Smooth driver'}
];
const TRACKS=[
 {id:'candy',name:'Candy Coast',emoji:'🍭',theme:'candy',length:750,curves:.14,hazards:10,description:'Pastel streets and sweet surprises'},
 {id:'neon',name:'Neon Nights',emoji:'🌃',theme:'neon',length:790,curves:.22,hazards:14,description:'Electric streets, tight bends'},
 {id:'desert',name:'Dusty Dash',emoji:'🏜️',theme:'desert',length:790,curves:.12,hazards:15,description:'Wide turns through hot sand'},
 {id:'snow',name:'Frostbite Pass',emoji:'❄️',theme:'snow',length:760,curves:.26,hazards:12,description:'Icy slopes and snowy hazards'},
 {id:'space',name:'Cosmic Circuit',emoji:'🪐',theme:'space',length:830,curves:.3,hazards:16,description:'Outer-space roads, wild corners'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ITEMS=['turbo','shield','zap','oil','refill'];
const ITEM_NAMES={turbo:'Turbo Burst',shield:'Bubble Shield',zap:'Zap Bolt',oil:'Oil Slick',refill:'Nitro Refill'};
function obstacles(track){const out=[];for(let i=0;i<track.hazards;i++){const distance=95+i*(track.length-165)/track.hazards+((i*37)%17);const x=[-.62,.1,.65,-.25,.38][(i*3+TRACKS.findIndex(t=>t.id===track.id))%5];out.push({distance:Math.round(distance),x,type:i%3===0?'box':'hazard',id:i});}return out;}
function createRace(players){return {stage:'select',trackId:'candy',players:players.map(p=>({id:p.id,name:p.name,character:'pickle',ready:false,distance:0,x:0,speed:0,steer:0,boost:false,nitro:100,item:null,shield:false,turboUntil:0,hitUntil:0,finishAt:null,seen:[]})),startAt:0,winner:null,tick:0,log:[],lastUpdate:Date.now()};}
function choose(race,id,character){if(race.stage!=='select')return 'Race already started.';const p=race.players.find(p=>p.id===id);if(!p||!CHARACTERS.some(c=>c.id===character))return 'Invalid racer.';p.character=character;p.ready=false;return null;}
function trackChoice(race,id,hostId,trackId){if(race.stage!=='select')return 'Race already started.';if(id!==hostId)return 'Host chooses the track.';if(!TRACKS.some(t=>t.id===trackId))return 'Invalid track.';race.trackId=trackId;race.players.forEach(p=>p.ready=false);return null;}
function ready(race,id){if(race.stage!=='select')return 'Already racing.';const p=race.players.find(p=>p.id===id);if(!p)return 'Not a racer.';p.ready=true;if(race.players.every(x=>x.ready)){race.stage='countdown';race.startAt=Date.now()+3500;race.lastUpdate=race.startAt;race.log=['Lights out — GO!'];}return null;}
function input(race,id,steer,boost){if(!['countdown','racing'].includes(race.stage))return 'Race is not active.';const p=race.players.find(p=>p.id===id);if(!p)return 'Not in race.';p.steer=clamp(Number(steer)||0,-1,1);p.boost=!!boost;return null;}
function useItem(race,id,now=Date.now()){
 if(race.stage!=='racing')return 'Not racing.';
 const p=race.players.find(v=>v.id===id);if(!p||!p.item)return 'No item available.';
 const item=p.item;p.item=null;const rival=race.players.find(v=>v.id!==id);
 if(item==='turbo')p.turboUntil=now+2400;
 if(item==='shield')p.shield=true;
 if(item==='refill')p.nitro=Math.min(100,p.nitro+65);
 if(item==='zap'&&rival){if(rival.shield){rival.shield=false;}else rival.hitUntil=Math.max(rival.hitUntil,now+1900);}
 if(item==='oil'&&rival&&rival.distance<p.distance&&p.distance-rival.distance<50){if(rival.shield)rival.shield=false;else rival.hitUntil=Math.max(rival.hitUntil,now+1100);}
 race.log=[`${p.name} activated ${ITEM_NAMES[item]}!`,...race.log].slice(0,6);return null;
}
function advance(race,now=Date.now()){ 
 if(race.stage==='countdown'){if(now>=race.startAt){race.stage='racing';race.lastUpdate=now;}return;}
 if(race.stage!=='racing')return;
 const dt=clamp((now-race.lastUpdate)/1000,0,.2);race.lastUpdate=now;
 const track=TRACKS.find(x=>x.id===race.trackId),obs=obstacles(track);
 for(const p of race.players){
  if(p.finishAt!==null)continue;
  const ch=CHARACTERS.find(c=>c.id===p.character);
  const old=p.distance;
  p.x=clamp(p.x+p.steer*dt*.92*ch.steer,-1.02,1.02);
  let velocity=17*ch.speed;const bend=Math.sin(p.distance/55)*track.curves;
  if(Math.abs(p.x-bend)>.82)velocity*=.58;
  if(now<p.hitUntil)velocity*=.45;if(now<p.turboUntil)velocity*=1.7;
  if(p.boost&&p.nitro>0){velocity*=1.8*ch.boost;p.nitro=Math.max(0,p.nitro-dt*31);}else p.nitro=Math.min(100,p.nitro+dt*11);
  p.speed=velocity;p.distance=Math.min(track.length,p.distance+velocity*dt);
  for(const item of obs){if(!p.seen.includes(item.id)&&old<=item.distance&&p.distance>=item.distance-1.1&&Math.abs(p.x-item.x)<(item.type==='box'?.58:.29)){p.seen.push(item.id);if(item.type==='box'){if(!p.item){p.item=ITEMS[Math.floor(Math.random()*ITEMS.length)];race.log=[`${p.name} opened a mystery box!`,...race.log].slice(0,6);}}else{if(p.shield)p.shield=false;else p.hitUntil=now+900;race.log=[`${p.name} hit an obstacle!`,...race.log].slice(0,6);}}}
  if(p.distance>=track.length){p.finishAt=now;if(!race.winner)race.winner=p.id;}
 }
 race.tick++;
 if(race.players.every(p=>p.finishAt!==null)||race.players.some(p=>p.finishAt!==null&&now-p.finishAt>13000)){
  race.stage='finished';race.log=[`${race.players.find(p=>p.id===race.winner)?.name||'Someone'} wins the race!`,...race.log].slice(0,6);
 }
}
function publicRace(race){return {stage:race.stage,trackId:race.trackId,tracks:TRACKS,characters:CHARACTERS,players:race.players.map(p=>({id:p.id,name:p.name,character:p.character,ready:p.ready,distance:Math.round(p.distance*10)/10,x:p.x,speed:p.speed,nitro:Math.round(p.nitro),item:p.item,shield:p.shield,turbo:p.turboUntil>Date.now(),finishAt:p.finishAt,hit:p.hitUntil>Date.now()})),startAt:race.startAt,winner:race.winner,log:race.log,tick:race.tick,obstacles:obstacles(TRACKS.find(x=>x.id===race.trackId))};}
module.exports={CHARACTERS,TRACKS,ITEMS,createRace,choose,trackChoice,ready,input,useItem,advance,publicRace};
