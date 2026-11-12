'use strict';
// All authoritative battle decisions live on the server; no alcohol tracking.
const ALLIES=[
 {id:'tank',name:'Bulwark',emoji:'🛡️',hp:48,attack:7,skill:'Shield Slam'},
 {id:'mage',name:'Hex',emoji:'🔮',hp:31,attack:11,skill:'Arcane Burst'},
 {id:'medic',name:'Patch',emoji:'💚',hp:36,attack:7,skill:'Team Heal'},
 {id:'rogue',name:'Jinx',emoji:'🗡️',hp:32,attack:10,skill:'Double Strike'},
 {id:'bard',name:'Echo',emoji:'🎸',hp:37,attack:8,skill:'Battle Hymn'},
 {id:'archer',name:'Arrow',emoji:'🏹',hp:35,attack:9,skill:'Piercing Shot'},
 {id:'mystic',name:'Luna',emoji:'🌙',hp:39,attack:8,skill:'Moonlight Shield'}
];
const UPGRADES=[
 {id:'blade',name:'Sharpen Weapon',cost:1,desc:'+2 main character attack',max:3},
 {id:'armor',name:'Upgrade Armor',cost:2,desc:'+12 main character maximum HP',max:2},
 {id:'charge',name:'Charge Special',cost:3,desc:'+5 special attack damage',max:2},
 {id:'vitality',name:'Team Vitality',cost:4,desc:'+8 maximum HP for every teammate',max:1},
 {id:'legendary',name:'Legendary Weapon',cost:5,desc:'+7 main character attack',max:1}
];
function makeBattle(players){
 const teams={};for(const p of players)teams[p.id]={selected:[],locked:false,points:0,earned:0,spent:0,upgrades:{},units:[],guarded:null};
 return {stage:'draft',teams,turn:0,turnCount:0,log:['Choose two allies to join your personal hero!'],winner:null};
}
function select(b,playerId,allyIds){const t=b.teams[playerId];if(b.stage!=='draft'||!t||t.locked)return 'Team selection closed.';
 if(!Array.isArray(allyIds)||allyIds.length!==2||new Set(allyIds).size!==2||!allyIds.every(id=>ALLIES.some(a=>a.id===id)))return 'Pick two different allies.';
 t.selected=[...allyIds];return null;}
function teamReady(b,playerId,players){const t=b.teams[playerId];if(b.stage!=='draft'||t.selected.length!==2)return 'Pick two teammates first.';t.locked=true;
 if(players.every(p=>b.teams[p.id].locked)){b.stage='shop';for(const p of players)b.teams[p.id].locked=false;b.log.push('Shop open: claim up to five power points each. No drink required.');}return null;}
function claim(b,id){const t=b.teams[id];if(b.stage!=='shop'||!t||t.locked)return 'Power points are unavailable now.';if(t.earned>=5)return 'Five-point cap reached.';t.earned++;t.points++;return null;}
function buy(b,id,key){const t=b.teams[id];if(b.stage!=='shop'||!t||t.locked)return 'Shop is closed.';const u=UPGRADES.find(u=>u.id===key);if(!u)return 'Unknown upgrade.';if((t.upgrades[key]||0)>=u.max)return 'Upgrade is maxed out.';if(t.points<u.cost)return 'Not enough power points.';t.points-=u.cost;t.spent+=u.cost;t.upgrades[key]=(t.upgrades[key]||0)+1;return null;}
function initUnits(t,player){const up=t.upgrades;const bonus=8*(up.vitality||0);
 return [
 {id:'hero',name:player.name,emoji:'⭐',maxHp:65+12*(up.armor||0)+bonus,hp:65+12*(up.armor||0)+bonus,attack:10+2*(up.blade||0)+7*(up.legendary||0),skill:'Power Strike',boost:5*(up.charge||0),guard:false},
 ...t.selected.map(id=>{const a=ALLIES.find(x=>x.id===id);return {...a,id,maxHp:a.hp+bonus,hp:a.hp+bonus,boost:0,guard:false};})];}
function shopReady(b,id,players){const t=b.teams[id];if(b.stage!=='shop')return 'Shop already closed.';t.locked=true;if(players.every(p=>b.teams[p.id].locked)){
  for(const p of players)b.teams[p.id].units=initUnits(b.teams[p.id],p);
  b.stage='fight';b.turn=0;b.turnCount=0;b.log.push('⚔️ Battle begins! '+players[0].name+' attacks first.');}
 return null;}
function fight(b,players,id,actorId,targetId,move){if(b.stage!=='fight')return 'Battle is not active.';
 const active=players[b.turn];if(active.id!==id)return 'Wait for your turn.';
 if(!['attack','skill','guard'].includes(move))return 'Invalid move.';
 const mine=b.teams[id],opponent=players[1-b.turn],enemy=b.teams[opponent.id];
 const actor=mine.units.find(u=>u.id===actorId&&u.hp>0),target=enemy.units.find(u=>u.id===targetId&&u.hp>0);
 if(!actor)return 'Select a living teammate.';
 if(move!=='guard'&&!target)return 'Select a living enemy.';
 const damage=(unit,amount)=>{const prevented=unit.guard?Math.ceil(amount/2):0;unit.guard=false;const applied=Math.min(unit.hp,Math.max(1,amount-prevented));unit.hp-=applied;return applied;};
 let msg='';
 if(move==='guard'){actor.guard=true;msg=`${actor.name} braces for the next hit.`;}
 else if(move==='attack'){msg=`${actor.name} hits ${target.name} for ${damage(target,actor.attack)} damage.`;}
 else if(actor.id==='hero'){msg=`${actor.name} unleashes Power Strike on ${target.name} for ${damage(target,actor.attack+7+actor.boost)} damage!`;}
 else if(actor.id==='tank'){actor.guard=true;msg=`${actor.name} Shield Slams ${target.name} for ${damage(target,actor.attack+4)} and guards.`;}
 else if(actor.id==='mage'){msg=`${actor.name} blasts ${target.name} for ${damage(target,actor.attack+7)} magic damage!`;}
 else if(actor.id==='rogue'){const d1=damage(target,actor.attack);const d2=target.hp>0?damage(target,6):0;msg=`${actor.name} strikes twice for ${d1+d2} damage!`;}
 else if(actor.id==='medic'){const ally=mine.units.filter(u=>u.hp>0).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];const healed=Math.min(15,ally.maxHp-ally.hp);ally.hp+=healed;msg=`${actor.name} heals ${ally.name} for ${healed} HP.`;}
 else if(actor.id==='archer'){msg=`${actor.name} lands a precise shot on ${target.name} for ${damage(target,actor.attack+5)} damage!`;}
 else if(actor.id==='mystic'){const ally=mine.units.filter(u=>u.hp>0).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];ally.guard=true;msg=`${actor.name} gives ${ally.name} a moonlit shield for the next hit!`;}
 else if(actor.id==='bard'){for(const u of mine.units)if(u.hp>0)u.attack+=2;msg=`${actor.name} inspires the team: +2 attack for living allies!`;}
 b.log.push(msg);b.log=b.log.slice(-12);b.turnCount++;
 if(enemy.units.every(u=>u.hp<=0)){b.stage='finished';b.winner=id;b.log.push('🏆 '+active.name+' wins!');}
 else if(b.turnCount>=100){const total=(team)=>team.units.reduce((sum,u)=>sum+u.hp,0);const a=total(mine),c=total(enemy);b.stage='finished';b.winner=a===c?null:(a>c?id:opponent.id);b.log.push('Battle limit reached: '+(b.winner?'highest HP wins.':'draw.'));}
 else b.turn=1-b.turn;
 return null;}
function publicBattle(b,players){return {stage:b.stage,turnPlayerId:players[b.turn]?.id||null,turnCount:b.turnCount,winner:b.winner,log:b.log.slice(-6),allies:ALLIES,upgrades:UPGRADES,
 teams:players.map(p=>({id:p.id,name:p.name,selected:b.teams[p.id].selected,locked:b.teams[p.id].locked,points:b.teams[p.id].points,earned:b.teams[p.id].earned,spent:b.teams[p.id].spent,upgrades:b.teams[p.id].upgrades,units:b.teams[p.id].units}))};}
module.exports={ALLIES,UPGRADES,makeBattle,select,teamReady,claim,buy,shopReady,fight,publicBattle};
