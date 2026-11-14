'use strict';
function pauseRoom(room, by, now=Date.now()){
 if(room.paused)return false;
 room.paused=true;room.pausedAt=now;room.pausedBy=by;
 if(room.race)room.race.players.forEach(p=>{p.steer=0;p.boost=false;});
 return true;
}
function resumeRoom(room,now=Date.now()){
 if(!room.paused)return false;
 const elapsed=Math.max(0,now-room.pausedAt);
 if(room.deadline)room.deadline+=elapsed;
 if(room.story?.deadline)room.story.deadline+=elapsed;
 if(room.mini?.deadline)room.mini.deadline+=elapsed;
 if(room.arcade?.deadline)room.arcade.deadline+=elapsed;
 if(room.arcade?.targetAt)room.arcade.targetAt+=elapsed;
 if(room.party?.draw?.deadline)room.party.draw.deadline+=elapsed;
 if(room.drawGame?.draw?.deadline)room.drawGame.draw.deadline+=elapsed;
 if(room.party?.kart){room.party.kart.endAt+=elapsed;room.party.kart.spawnAt+=elapsed;room.party.kart.lastTick=now;}
 if(room.party?.goAt)room.party.goAt+=elapsed;
 if(room.race){
  if(room.race.stage==='countdown')room.race.startAt+=elapsed;
  room.race.lastUpdate=now;
  for(const p of room.race.players){if(p.hitUntil)p.hitUntil+=elapsed;if(p.finishAt)p.finishAt+=elapsed;}
 }
 room.paused=false;room.pausedAt=null;room.pausedBy=null;
 return true;
}
module.exports={pauseRoom,resumeRoom};
